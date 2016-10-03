var Path = require('path')
var electron = require('electron')
var extend = require('xtend/mutable')

module.exports = function Window (context, path, opts) {
  var window = new electron.BrowserWindow(extend({
    show: false
  }, opts))

  electron.ipcMain.on('ready-to-show', handleReadyToShow)

  window.webContents.on('dom-ready', function () {
    window.webContents.executeJavaScript(`
      var electron = require('electron')
      var rootView = require(${JSON.stringify(path)})
      var insertCss = require('insert-css')
      var h = require('../lib/h')
      var createClient = require('ssb-client')

      require('../lib/context-menu')
      insertCss(require('../styles'))
      electron.webFrame.setZoomLevelLimits(1, 1)

      var config = ${JSON.stringify(context.config)}
      var shouldShow = ${opts.show !== false}

      createClient(config.keys, config, (err, client) => {
        if (err) return notify(err)
        try {
          document.documentElement.replaceChild(h('body', [
            rootView(client, config)
          ]), document.body)
        } catch (ex) {
          electron.ipcRenderer.send('ready-to-show')
          throw ex
        }
        shouldShow && electron.ipcRenderer.send('ready-to-show')
      })
    `)
  })

  // setTimeout(function () {
  //   window.show()
  // }, 3000)

  window.webContents.on('will-navigate', function (e) {
    e.preventDefault()
  })

  window.webContents.on('will-navigate', function (e, url) {
    e.preventDefault()
    electron.shell.openExternal(url)
  })

  window.on('closed', function () {
    electron.ipcMain.removeListener('ready-to-show', handleReadyToShow)
  })

  window.loadURL('file://' + Path.join(__dirname, '..', 'assets', 'base.html'))
  return window

  // scoped

  function handleReadyToShow (ev) {
    if (ev.sender === window) {
      window.show()
      electron.ipcMain.removeListener('ready-to-show', handleReadyToShow)
    }
  }
}
