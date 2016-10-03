var md = require('ssb-markdown')
var watch = require('@mmckegg/mutant/watch')

module.exports = function (value, opts) {
  return function (element) {
    return watch(value, (value) => {
      element.innerHTML = md.block(value, opts)
    })
  }
}

module.exports.inline = function (value) {
  return function (element) {
    return watch(value, (value) => {
      element.innerHTML = md.inline(value)
    })
  }
}
