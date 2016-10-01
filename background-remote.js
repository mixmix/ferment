var electron = require('electron')
var seq = Date.now()

var callbacks = {}
electron.ipcRenderer.on('bg-response', function (ev, id, ...args) {
  var cb = callbacks[id]
  if (cb) {
    delete callbacks[id]
    cb(...args)
  }
})

module.exports = function (context) {
  return {
    context,
    stream (torrentId, cb) {
      var id = seq++
      callbacks[id] = cb
      electron.ipcRenderer.send('bg-stream-torrent', id, torrentId)
      return () => {
        electron.ipcRenderer.send('bg-release', id)
      }
    }
  }
}
