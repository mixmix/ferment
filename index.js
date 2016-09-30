var pull = require('pull-stream')
var Value = require('@mmckegg/mutant/value')
var Struct = require('@mmckegg/mutant/struct')
var MutantArray = require('@mmckegg/mutant/array')
var MutantMap = require('@mmckegg/mutant/map')
var h = require('./lib/h')
var svg = require('./lib/svg')
var send = require('@mmckegg/mutant/send')
var insertCss = require('insert-css')
var when = require('@mmckegg/mutant/when')
var watch = require('@mmckegg/mutant/watch')
var extend = require('xtend')

var computed = require('@mmckegg/mutant/computed')
var generateMeta = require('./lib/generate-meta')
var drawSvgOverview = require('./lib/svg-overview')

var convert = require('./lib/convert')
var shasum = require('./lib/shasum')

var WebTorrent = require('webtorrent')
var createTorrent = require('create-torrent')
var join = require('path').join
var getExt = require('path').extname
var fs = require('fs')

require('./lib/context-menu')
insertCss(require('./styles'))

var playButtonIcons = {
  paused: '\u25B6',
  playing: '⏸',
  waiting: '📶'
}

var db = window.db
var feed = FeedArray(db.createFeedStream({live: true}))

var torrentClient = new WebTorrent()

var mediaPath = db.config.mediaPath
var audioElement = h('audio', { controls: true })
var lastServer = null

fs.readdir(db.config.mediaPath, function (err, entries) {
  if (err) throw err
  entries.forEach((name) => {
    if (getExt(name) === '.torrent') {
      torrentClient.add(join(mediaPath, name), { path: mediaPath }, function (torrent) {
        console.log('seeding', name)
      })
    }
  })
})

// add('/Users/matt/Desktop/Frontier (live at Garrett Landing).mp3', {
//   title: 'Frontier (live at Garrett Landing)',
//   license: 'CC BY-SA 4.0',
//   artworkSrc: 'https://i1.sndcdn.com/artworks-000183021825-8bebab-t500x500.jpg'
// })
//
// add('/Users/matt/Desktop/Old School Techno Jam (Art~Hack 22 September 2016).m4a', {
//   title: 'Old School Techno Jam (Art~Hack 22 September 2016)',
//   license: 'CC BY-SA 4.0',
//   artworkSrc: 'https://i1.sndcdn.com/artworks-000185414676-hv9vtj-t500x500.jpg'
// })

var currentlyPlaying = null

function add (path, data) {
  generateMeta(path, function (err, meta) {
    if (err) throw err
    console.log('generated meta', meta)
    var toPath = join(mediaPath, `importing-${Date.now()}.ogg`)
    convert(path, toPath, function (err) {
      if (err) throw err
      console.log('converted to ogg')
      shasum(toPath, function (err, hash) {
        if (err) throw err
        var finalPath = join(mediaPath, `${hash}.ogg`)
        var torrentPath = join(mediaPath, `${hash}.torrent`)
        console.log('generate hash', hash)
        fs.rename(toPath, finalPath, function (err) {
          if (err) throw err
          createTorrent(finalPath, function (err, torrent) {
            if (err) throw err
            fs.writeFile(torrentPath, torrent, function (err) {
              if (err) throw err
              torrentClient.add(torrentPath, { path: mediaPath }, function (torrent) {
                console.log('seeding torrent', torrentPath)
                var item = extend({
                  type: 'ferment/audio',
                  audioSrc: torrent.magnetURI
                }, meta, data)

                console.log('publishing', item)
                db.publish(item, function (err) {
                  if (err) throw err
                  console.log('published')
                })
              })
            })
          })
        })
      })
    })
  })
}

function togglePlay (audio) {
  if (currentlyPlaying === audio || !audio) {
    if (audio.state() !== 'paused') {
      audioElement.pause()
    } else {
      audioElement.play()
    }
  } else {
    if (currentlyPlaying) {
      audioElement.pause()
    }

    if (lastServer) {
      lastServer.close()
    }

    audio.state.set('waiting')

    var torrent = torrentClient.get(audio.audioSrc())
    var server = torrent.createServer()
    server.listen(0, function () {
      var port = server.address().port
      var url = 'http://localhost:' + port + '/0'
      audioElement.src = url
      audioElement.ontimeupdate = function (e) {
        audio.position.set(e.target.currentTime)
      }
      audioElement.onwaiting = () => audio.state.set('waiting')
      audioElement.onplaying = () => audio.state.set('playing')
      audioElement.onpause = () => audio.state.set('paused')
      audioElement.onended = () => {
        currentlyPlaying.position.set(0)
        playNext()
      }
      audioElement.currentTime = audio.position() || 0
      audioElement.play()
      currentlyPlaying = audio
    })
  }
}

function playNext () {
  var index = feed.indexOf(currentlyPlaying)
  var next = feed.get(index + 1)
  if (next) {
    next.position.set(0)
    togglePlay(next)
  }
}

document.body.appendChild(
  h('Holder', [
    h('div.top', [
      h('span.appTitle', ['Ferment']),
      h('span', [
        h('a.upload', {href: '#'}, ['+ Upload'])
      ])
    ]),
    h('div.main', [
      h('Feed', [
        h('h1', 'Feed'),
        MutantMap(feed, function (item) {
          return h('AudioPost', {
            classList: [
              computed(item.state, (s) => `-${s}`)
            ]
          }, [
            h('div.artwork', { style: {
              'background-image': computed(item.artworkSrc, (src) => `url("${src}")`)
            }}),
            h('div.main', [
              h('div.title', [
                h('a.play', { 'ev-click': send(togglePlay, item), href: '#' }, [
                  computed(item.state, (s) => playButtonIcons[s || 'paused'])
                ]),
                h('header', [
                  h('div.feedTitle', [item.feedTitle]),
                  h('div.title', [item.title])
                ])
              ]),
              h('div.display', {
                hooks: [
                  SetPositionHook(item)
                ]
              }, [
                svg('svg', {
                  viewBox: '0 0 600 100',
                  preserveAspectRatio: 'none',
                  hooks: [
                    ComputedInnerHtmlHook([item.overview, 600, 100], drawSvgOverview)
                  ]
                }),
                h('div.progress', {
                  style: {
                    width: computed([item.position, item.duration], (pos, dur) => Math.round(pos / dur * 1000) / 10 + '%')
                  }
                }),
                when(item.position, h('span.position', computed(item.position, formatTime))),
                h('span.duration', computed(item.duration, formatTime))
              ]),
              h('div.options', [
                h('a.like', {href: '#'}, '💚 Like'),
                h('a.repost', {href: '#'}, '📡 Repost'),
                h('a.download', {href: '#'}, '⬇️ Download')
              ])
            ])
          ])
        })
      ])

    ]),
    h('div.bottom', [
      audioElement
    ])
  ])

)

function FeedArray (stream) {
  var result = MutantArray()
  pull(
    stream,
    pull.drain(function (item) {
      if (!item.sync) {
        if (item.value.content.type === 'ferment/audio') {
          result.push(AudioPost(item.value))
        }
      }
    })
  )
  return result
}

function AudioPost (item) {
  var result = Struct({
    title: Value(),
    description: Value(),
    license: Value(),
    overview: Value(),
    duration: Value(0, {defaultValue: 0}),
    audioSrc: Value(),
    artworkSrc: Value()
  })

  result.feedTitle = Value('DESTROY WITH SCIENCE')
  result.position = Value(0)
  result.state = Value()

  if (item) {
    result.set(item.content)
  }

  return result
}

function ComputedInnerHtmlHook (args, fn) {
  return function (element) {
    return watch(computed(args, fn), value => element.innerHTML = value)
  }
}

function SetPositionHook (item) {
  return function (element) {
    element.onmousemove = element.onmousedown = function (ev) {
      if (ev.buttons && ev.button === 0) {
        var box = ev.currentTarget.getBoundingClientRect()
        var x = ev.clientX - box.left
        if (x < 5) {
          x = 0
        }
        setPosition(x / box.width * item.duration())
      }
    }
  }

  function setPosition (position) {
    if (currentlyPlaying === item) {
      audioElement.currentTime = position
    }

    item.position.set(position)
  }
}

function formatTime (value) {
  var minutes = Math.floor(value / 60)
  var seconds = Math.round(value % 60)
  return minutes + ':' + ('0' + seconds).slice(-2)
}
