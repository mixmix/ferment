var electron = require('electron')
var setupIpc = require('./lib/background-ipc')
var openWindow = require('./lib/window')
var createSbot = require('./lib/ssb-server')
var serveBlobs = require('./lib/serve-blobs')
var makeSingleInstance = require('./lib/make-single-instance')

var windows = {
  adders: new Set()
}

makeSingleInstance(windows, openMainWindow)

var context = setupContext('ferment')

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
    windows.main = openWindow(context, __dirname + '/main-window.js', {
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
  var window = openWindow(context, __dirname + '/add-audio-window.js', {
    //parent: windows.main,
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

  // if (windows.main) {
  //   window.setParentWindow(windows.main)
  // }

  windows.adders.add(window)

  window.on('closed', function () {
    windows.adders.delete(window)
  })
}

function startBackgroundProcess () {
  windows.background = openWindow(context, __dirname + '/background-window.js', {
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

function setupContext (appName) {
  var ssbConfig = require('./lib/ssb-config')(appName)
  var context = {
    db: createSbot(ssbConfig),
    config: ssbConfig
  }

  ssbConfig.manifest = context.db.getManifest()
  serveBlobs(context)

  return context
}
