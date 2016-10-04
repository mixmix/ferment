var MarkdownHook = require('./markdown-hook')
var h = require('./h')

module.exports = function (value) {
  return h('div', {
    hooks: [
      MarkdownHook(value)
    ]
  })
}
