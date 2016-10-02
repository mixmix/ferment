var WebTorrent = require('webtorrent')
var electron = require('electron')
var createTorrent = require('create-torrent')
var join = require('path').join
var getExt = require('path').extname
var fs = require('fs')
var ipc = electron.ipcRenderer

module.exports = function (config) {
  var torrentClient = new WebTorrent()
  var mediaPath = config.mediaPath
  var releases = {}

  // start seeding
  fs.readdir(mediaPath, function (err, entries) {
    if (err) throw err
    entries.forEach((name) => {
      if (getExt(name) === '.torrent') {
        torrentClient.add(join(mediaPath, name), { path: mediaPath }, (torrent) => {
          console.log('seeding', name)
        })
      }
    })
  })

  ipc.on('bg-release', function (ev, id) {
    if (releases[id]) {
      var release = releases[id]
      releases[id] = null
      release()
    }
  })

  ipc.on('bg-stream-torrent', (ev, id, torrentId) => {
    var torrent = torrentClient.get(torrentId)
    var server = torrent.createServer()
    server.listen(0, function (err) {
      if (err) return ipc.send('bg-response', id, err)
      var port = server.address().port
      var url = 'http://localhost:' + port + '/0'
      ipc.send('bg-response', id, null, url)
    })
    releases[id] = () => {
      server.close()
    }
  })

  ipc.on('bg-create-torrent', (ev, id, filePath, hash) => {
    var torrentPath = join(mediaPath, `${hash}.torrent`)
    createTorrent(filePath, function (err, torrent) {
      if (err) return ipc.send('bg-response', id, err)
      fs.writeFile(torrentPath, torrent, function (err) {
        if (err) return ipc.send('bg-response', id, err)
        torrentClient.add(torrentPath, { path: mediaPath }, function (torrent) {
          ipc.send('bg-response', id, null, torrent.magnetURI)
        })
      })
    })
  })

  ipc.send('ipcBackgroundReady', true)
}
