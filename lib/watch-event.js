module.exports = function watchEvent (source, event, listener) {
  if (source.on) {
    source.on(event, listener)
    return function () {
      source.removeListener(event, listener)
    }
  } else if (source.addEventListener) {
    source.addEventListener(event, listener)
    return function () {
      source.removeEventListener(event, listener)
    }
  }
}
