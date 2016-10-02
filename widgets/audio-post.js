var h = require('../lib/h')
var Value = require('@mmckegg/mutant/value')
var send = require('@mmckegg/mutant/send')
var computed = require('@mmckegg/mutant/computed')
var when = require('@mmckegg/mutant/when')
var AudioOverview = require('./audio-overview')
var prettyBytes = require('prettier-bytes')

var playButtonIcons = {
  paused: '\u25B6',
  playing: '⏸',
  waiting: '📶'
}

module.exports = function (item) {
  var context = item.context
  var player = context.player
  var torrentStatus = TorrentStatus(item)

  return h('AudioPost', {
    hooks: [ torrentStatus.hook ],
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
        h('a.download', {href: '#'}, '⬇️ Download'),
        when(torrentStatus.downloading, h('span', [
          h('strong', 'Downloading: '),
          computed(torrentStatus.downloadProgress, percent), ' (', computed(torrentStatus.downloadSpeed, value => `${prettyBytes(value)}/s`), ')'
        ]))
      ])
    ])
  ])
}

function percent (value) {
  return Math.round(value * 100) + '%'
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

function TorrentStatus (item) {
  var info = Value({})
  return {
    downloadProgress: computed(info, (x) => x.progress || 0),
    downloadSpeed: computed(info, (x) => x.downloadSpeed || 0),
    downloading: computed(info, (x) => x.progress !== null && x.progress < 1),
    paused: computed(info, (x) => x.paused || false),
    hook: function (element) {
      if (item.context.background) {
        return item.context.background.subscribeProgress(item.audioSrc(), info.set)
      }
    }
  }
}
