var watchEvent = require('./watch-event')

module.exports = function () {
  return function (element) {
    var parent = element.parentNode
    while (parent && !isScroller(parent)) {
      parent = parent.parentNode
    }
    if (parent) {
      return watchEvent(parent, 'scroll', (ev) => {
        element.style.marginTop = `${parent.scrollTop}px`
      })
    }
  }
}

function isScroller (element) {
  if (element) {
    // TODO: handle more cases
    return window.getComputedStyle(element).overflow === 'auto'
  }
}
