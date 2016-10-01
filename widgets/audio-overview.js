var computed = require('@mmckegg/mutant/computed')
var watch = require('@mmckegg/mutant/watch')
var svg = require('../lib/svg')
var drawSvgOverview = require('../lib/svg-overview')

module.exports = function (overview, width, height) {
  return svg('svg', {
    viewBox: `0 0 ${width} ${height}`,
    preserveAspectRatio: 'none',
    hooks: [
      ComputedInnerHtmlHook([overview, width, height], drawSvgOverview)
    ]
  })
}

function ComputedInnerHtmlHook (args, fn) {
  return function (element) {
    return watch(computed(args, fn), value => element.innerHTML = value)
  }
}
