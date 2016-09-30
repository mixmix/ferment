var join = require('path').join
var electron = require('electron')
var fs = require('fs')
var ServeBlobs = require('./lib/serve-blobs')

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

var db = createSbot(ssbConfig)
require('http').createServer(ServeBlobs(db)).listen(ssbConfig.blobsPort)

ssbConfig.manifest = db.getManifest()

var mainWindow = null

electron.app.on('ready', function () {
  mainWindow = new electron.BrowserWindow({
    width: 1024,
    height: 768,
    titleBarStyle: 'hidden-inset',
    title: 'Ferment',
    acceptFirstMouse: true,
    show: false,
    webPreferences: {
      experimentalFeatures: true,
      pageVisibility: true
    },
    backgroundColor: '#444'
  })

  mainWindow.webContents.on('dom-ready', function () {
    var rootPath = __dirname + '/index.js'
    var ssbClientPath = __dirname + '/lib/ssb-client.js'
    mainWindow.webContents.executeJavaScript(`
      window.db = require(${JSON.stringify(ssbClientPath)})(
        ${JSON.stringify(ssbConfig.keys)},
        ${JSON.stringify(ssbConfig)}
      )
      require(${JSON.stringify(rootPath)})
    `, () => {
      mainWindow.show()
    })
  })

  mainWindow.webContents.on('will-navigate', function (e) {
    e.preventDefault()
  })

  mainWindow.webContents.on('will-navigate', function (e, url) {
    e.preventDefault()
    electron.shell.openExternal(url)
  })

  mainWindow.loadURL('file://' + __dirname + '/assets/base.html')
})
