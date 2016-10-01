var h = require('../lib/h')
var MutantArray = require('@mmckegg/mutant/array')
var MutantMap = require('@mmckegg/mutant/map')

var pull = require('pull-stream')
var Player = require('../widgets/player')
var AudioPost = require('../models/audio-post')
var renderAudioPost = require('./audio-post')
var BackgroundRemote = require('../background-remote')

module.exports = function (parentContext) {
  var context = Object.create(parentContext)
  context.player = Player(context)
  context.background = BackgroundRemote(context)

  var feed = FeedArray(context, {feedTitle: 'DESTROY WITH SCIENCE'})
  context.player.currentFeed.set(feed)

  return h('Holder', [
    h('div.top', [
      h('span.appTitle', ['Ferment']),
      h('span', [
        h('a.upload', {href: '#'}, ['+ Upload'])
      ])
    ]),
    h('div.main', [
      h('Feed', [
        h('h1', 'Feed'),
        MutantMap(feed, renderAudioPost)
      ])
    ]),
    h('div.bottom', [
      context.player.audioElement
    ])
  ])
}

function FeedArray (context, opts) {
  var result = MutantArray()
  pull(
    context.db.createFeedStream({live: true}),
    pull.drain(function (item) {
      if (!item.sync) {
        if (item.value.content.type === 'ferment/audio') {
          result.insert(AudioPost(context, item.value, opts), 0)
        }
      }
    })
  )
  return result
}
