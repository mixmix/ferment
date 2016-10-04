var WebTorrent = require('webtorrent')
var pull = require('pull-stream')
var ssbConfig = require('../lib/ssb-config')('ferment')
var createClient = require('ssb-client')
var fs = require('fs')
var Path = require('path')
var parseTorrent = require('parse-torrent')

var torrentClient = WebTorrent()
var authors = process.argv.slice(2)
var mediaPath = ssbConfig.mediaPath

startSeeding()
createClient(ssbConfig.keys, ssbConfig, function (err, sbot) {
  if (err) console.log(err)
  pull(
    sbot.createFeedStream({live: true}),
    pull.drain((item) => {
      if (item.value && authors.includes(item.value.author) && item.value.content.type === 'ferment/audio') {
        var torrent = torrentClient.get(item.value.content.audioSrc)
        if (!torrent) {
          console.log(item.value.content.audioSrc)
          addTorrent(item.value.content.audioSrc, (err, torrent) => {
            if (err) console.log(err)
            console.log('added', torrent.infoHash)
          })
        }
      }
    })
  )
})

function startSeeding () {
  var entries = fs.readdirSync(mediaPath)
  entries.forEach((name) => {
    if (Path.extname(name) === '.torrent') {
      torrentClient.add(Path.join(mediaPath, name), {
        path: getTorrentDataPath(Path.basename(name, '.torrent'))
      }, (torrent) => {
        console.log('seeding', name)
      })
    }
  })
}

function addTorrent (torrentId, cb) {
  var torrent = parseTorrent(torrentId)
  var torrentPath = getTorrentPath(torrent.infoHash)

  torrentClient.add(torrent, {
    path: getTorrentDataPath(torrent.infoHash)
  }, function (torrent) {
    console.log('add torrent', torrent.infoHash)
    fs.writeFile(torrentPath, torrent.torrentFile, (err) => {
      if (err) cb && cb(err)
      cb && cb(null, torrent)
    })
  })
}

function getTorrentPath (infoHash) {
  return `${getTorrentDataPath(infoHash)}.torrent`
}

function getTorrentDataPath (infoHash) {
  return Path.join(mediaPath, `${infoHash}`)
}
