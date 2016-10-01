var join = require('path').join
var electron = require('electron')
var fs = require('fs')
var ServeBlobs = require('./lib/serve-blobs')
var openWindow = require('./window')

var windows = {}

if (electron.app.makeSingleInstance((commandLine, workingDirectory) => {
  if (windows.main) {
    if (windows.main.isMinimized()) windows.main.restore()
    windows.main.focus()
  } else {
    openMainWindow()
  }
})) {
  electron.app.quit()
}

var createSbot = require('scuttlebot')
  .use(require('scuttlebot/plugins/master'))
  .use(require('scuttlebot/plugins/gossip'))
  .use(require('scuttlebot/plugins/friends'))
  .use(require('scuttlebot/plugins/replicate'))
  .use(require('ssb-blobs'))
  .use(require('scuttlebot/plugins/invite'))
  .use(require('scuttlebot/plugins/block'))
  .use(require('scuttlebot/plugins/logging'))
  .use(require('scuttlebot/plugins/private'))
  .use(require('scuttlebot/plugins/local'))
  .use(require('scuttlebot/plugins/plugins'))

var ssbKeys = require('ssb-keys')

var ssbConfig = require('ssb-config/inject')('ferment', {
  port: 1024 + (~~(Math.random() * (65536 - 1024))),
  blobsPort: 1024 + (~~(Math.random() * (65536 - 1024)))
})

ssbConfig.mediaPath = join(ssbConfig.path, 'media')
ssbConfig.keys = ssbKeys.loadOrCreateSync(join(ssbConfig.path, 'secret'))

if (!fs.existsSync(ssbConfig.mediaPath)) {
  fs.mkdirSync(ssbConfig.mediaPath)
}

var context = {
  db: createSbot(ssbConfig),
  config: ssbConfig
}

require('http').createServer(ServeBlobs(context.db)).listen(context.config.blobsPort)
ssbConfig.manifest = context.db.getManifest()

electron.app.on('ready', function () {
  setupIpc()
  startBackgroundProcess()
  openMainWindow()
})

electron.app.on('activate', function (e) {
  openMainWindow()
})

function openMainWindow () {
  if (!windows.main) {
    windows.main = openWindow(context, __dirname + '/views/main-window.js', {
      width: 1024,
      height: 768,
      titleBarStyle: 'hidden-inset',
      title: 'Ferment',
      backgroundColor: '#444',
      acceptFirstMouse: true,
      webPreferences: {
        experimentalFeatures: true
      }
    })
    windows.main.on('closed', function () {
      windows.main = null
    })
  }
}

function startBackgroundProcess () {
  windows.background = openWindow(context, __dirname + '/background.js', {
    center: true,
    fullscreen: false,
    fullscreenable: false,
    height: 150,
    maximizable: false,
    minimizable: false,
    resizable: false,
    show: false,
    skipTaskbar: true,
    title: 'ferment-background-window',
    useContentSize: true,
    width: 150
  })
}

function setupIpc () {
  var messageQueueMainToBackground = []

  electron.ipcMain.once('ipcBackgroundReady', function (e) {
    electron.app.ipcBackgroundReady = true
    messageQueueMainToBackground.forEach(function (message) {
      windows.background.send(message.name, ...message.args)
    })
  })

  var oldEmit = electron.ipcMain.emit
  electron.ipcMain.emit = function (name, e, ...args) {
    // Relay messages between the main window and the background window
    if (name.startsWith('bg-') && !electron.app.isQuitting) {
      if (e.sender.browserWindowOptions.title === 'ferment-background-window') {
        // Send message to main window
        if (windows.main) {
          windows.main.send(name, ...args)
        }
      } else if (electron.app.ipcBackgroundReady) {
        // Send message to webtorrent window
        windows.background.send(name, ...args)
      } else {
        // Queue message for background window, it hasn't finished loading yet
        messageQueueMainToBackground.push({
          name: name,
          args: args
        })
      }
      return
    }

    // Emit all other events normally
    oldEmit.call(electron.ipcMain, name, e, ...args)
  }
}
