var Path = require('path')
var electron = require('electron')
var extend = require('xtend/mutable')

module.exports = function Window (context, path, opts) {
  var window = new electron.BrowserWindow(extend({
    show: false
  }, opts))

  window.webContents.on('dom-ready', function () {
    window.webContents.executeJavaScript(`
      var electron = require('electron')
      var render = require(${JSON.stringify(path)})
      var insertCss = require('insert-css')
      var h = require('../lib/h')

      require('../lib/context-menu')
      insertCss(require('../styles'))
      electron.webFrame.setZoomLevelLimits(1, 1)

      document.documentElement.replaceChild(h('body', [
        render(${JSON.stringify(context.config)})
      ]), document.body)
    `, () => {
      if (!opts || opts.show !== false) {
        window.show()
      }
    })
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

  window.loadURL('file://' + Path.join(__dirname, '..', 'assets', 'base.html'))
  return window
}
