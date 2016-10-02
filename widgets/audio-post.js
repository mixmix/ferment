var h = require('../lib/h')
var send = require('@mmckegg/mutant/send')
var computed = require('@mmckegg/mutant/computed')
var when = require('@mmckegg/mutant/when')
var AudioOverview = require('./audio-overview')

var playButtonIcons = {
  paused: '\u25B6',
  playing: '⏸',
  waiting: '📶'
}

module.exports = function (item) {
  var context = item.context
  var player = context.player

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
        h('a.play', { 'ev-click': send(player.togglePlay, item), href: '#' }, [
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
        AudioOverview(item.overview, 600, 100),
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
    if (item.context.player.currentItem.get() === item) {
      item.context.player.audioElement.currentTime = position
    }
    item.position.set(position)
  }
}

function formatTime (value) {
  var minutes = Math.floor(value / 60)
  var seconds = Math.round(value % 60)
  return minutes + ':' + ('0' + seconds).slice(-2)
}
