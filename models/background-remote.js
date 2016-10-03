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

var listeners = {}
electron.ipcRenderer.on('bg-multi-response', function (ev, id, ...args) {
  var listener = listeners[id]
  if (listener) {
    listener(...args)
  }
})

module.exports = function () {
  return {
    stream (torrentId, cb) {
      var id = seq++
      callbacks[id] = cb
      electron.ipcRenderer.send('bg-stream-torrent', id, torrentId)
      return () => {
        electron.ipcRenderer.send('bg-release', id)
      }
    },

    seedTorrent (infoHash, cb) {
      var id = seq++
      callbacks[id] = cb
      electron.ipcRenderer.send('bg-seed-torrent', id, infoHash)
    },

    checkTorrent (torrentId, cb) {
      var id = seq++
      callbacks[id] = cb
      electron.ipcRenderer.send('bg-check-torrent', id, torrentId)
    },

    subscribeProgress (torrentId, listener) {
      var id = seq++
      listeners[id] = listener
      electron.ipcRenderer.send('bg-subscribe-progress', id, torrentId)
      return () => {
        delete listeners[id]
        electron.ipcRenderer.send('bg-release', id)
      }
    }
  }
}
