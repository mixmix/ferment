var electron = require('electron')
var setupIpc = require('./lib/background-ipc')
var openWindow = require('./lib/window')
var createSbot = require('./lib/ssb-server')
var serveBlobs = require('./lib/serve-blobs')
var makeSingleInstance = require('./lib/make-single-instance')
var pull = require('pull-stream')
var pullFile = require('pull-file')
var Path = require('path')

var windows = {
  adders: new Set()
}

var context = null
if (process.argv[2] === '--test-peer') {
  // helpful for testing peers on a single machine
  context = setupContext('ferment-peer', {
    port: 43762
  })

  if (process.argv[3]) {
    context.sbot.gossip.add(process.argv[3], 'local')
  }
} else {
  makeSingleInstance(windows, openMainWindow)
  context = setupContext('ferment')
}

console.log('address:', context.sbot.getAddress())

electron.ipcMain.on('add-blob', (ev, id, path, cb) => {
  pull(
    pullFile(path),
    context.sbot.blobs.add((err, hash) => {
      if (err) return ev.sender.send('response', id, err)
      ev.sender.send('response', id, null, hash)
    })
  )
})

electron.app.on('ready', function () {
  setupIpc(windows)
  startBackgroundProcess()
  openMainWindow()
})

electron.app.on('activate', function (e) {
  openMainWindow()
})

electron.ipcMain.on('open-add-window', openAddWindow)

function openMainWindow () {
  if (!windows.main) {
    windows.main = openWindow(context, Path.join(__dirname, 'main-window.js'), {
      width: 1024,
      height: 768,
      titleBarStyle: 'hidden-inset',
      title: 'Ferment',
      show: true,
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

function openAddWindow () {
  var window = openWindow(context, Path.join(__dirname, 'add-audio-window.js'), {
    parent: windows.main,
    show: true,
    width: 850,
    height: 350,
    useContentSize: true,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    resizable: false,
    title: 'Add Audio File',
    backgroundColor: '#444',
    acceptFirstMouse: true
  })

  windows.adders.add(window)

  window.on('closed', function () {
    windows.adders.delete(window)
  })
}

function startBackgroundProcess () {
  windows.background = openWindow(context, Path.join(__dirname, 'background-window.js'), {
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

function setupContext (appName, opts) {
  var ssbConfig = require('./lib/ssb-config')(appName, opts)
  var context = {
    sbot: createSbot(ssbConfig),
    config: ssbConfig
  }

  ssbConfig.manifest = context.sbot.getManifest()
  serveBlobs(context)

  return context
}
