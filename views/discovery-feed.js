var h = require('../lib/h')
var renderAudioPost = require('../widgets/audio-post')
var MutantMap = require('@mmckegg/mutant/map')

module.exports = DiscoveryFeed

function DiscoveryFeed (context) {
  var feed = context.api.getGlobalFeed()
  context.player.currentFeed.set(feed)

  return h('Feed', {
    hooks: [ UnlistenHook(feed.destroy) ]
  }, [
    h('h1', 'Discovery Feed'),
    MutantMap(feed, (item) => renderAudioPost(context, item))
  ])
}

function UnlistenHook (cb) {
  return function (element) {
    return cb
  }
}
