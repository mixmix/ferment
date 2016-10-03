var h = require('../lib/h')
var renderAudioPost = require('../widgets/audio-post')
var MutantMap = require('@mmckegg/mutant/map')

module.exports = FollowingFeed

function FollowingFeed (context) {
  var feed = context.api.getFollowingFeed()
  context.player.currentFeed.set(feed)

  return h('Feed', {
    hooks: [ UnlistenHook(feed.destroy) ]
  }, [
    h('h1', [
      h('strong', 'Latest Posts'),
      ' from people you follow'
    ]),
    MutantMap(feed, (item) => renderAudioPost(context, item))
  ])
}

function UnlistenHook (cb) {
  return function (element) {
    return cb
  }
}
