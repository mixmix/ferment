var electron = require('electron')
var extend = require('xtend/mutable')

module.exports = function Window (context, path, opts) {
  var window = new electron.BrowserWindow(extend({
    show: false
  }, opts))

  window.webContents.on('dom-ready', function () {
    var ssbClientPath = __dirname + '/lib/ssb-client.js'
    window.webContents.executeJavaScript(`
      var render = require(${JSON.stringify(path)})
      var insertCss = require('insert-css')
      var h = require('../lib/h')

      require('../lib/context-menu')
      insertCss(require('../styles'))

      window.rootContext = {
        db: require(${JSON.stringify(ssbClientPath)})(
          ${JSON.stringify(context.config.keys)},
          ${JSON.stringify(context.config)}
        ),
        config: ${JSON.stringify(context.config)}
      }

      document.documentElement.replaceChild(h('body', [
        render(window.rootContext)
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

  window.loadURL('file://' + __dirname + '/assets/base.html')

  return window
}
