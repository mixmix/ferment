var h = require('../lib/h')
var renderAudioPost = require('../widgets/audio-post')
var MutantMap = require('@mmckegg/mutant/map')
var computed = require('@mmckegg/mutant/computed')
var when = require('@mmckegg/mutant/when')
var renderMiniProfile = require('../widgets/mini-profile')

module.exports = FollowingFeed

function FollowingFeed (context) {
  var profile = context.api.getProfile(context.api.id)
  var followingCount = computed(profile.following, (list) => list.length)

  var profiles = MutantMap(profile.following, id => context.api.getProfile(id))

  return h('Feed', [
    h('div.main', [
      h('h1', [
        h('strong', 'Latest Posts'),
        ' from people you follow'
      ]),
      computed(followingCount, (count) => {
        if (count === 0) {
          return h('div.info', [
            `You're not following anyone 😞 ... once you do, you'll start seeing their latest posts on this page!`
          ])
        } else {
          var feed = context.api.getFollowingFeed()
          context.player.currentFeed.set(feed)
          return when(feed.sync,
            MutantMap(feed, (item) => renderAudioPost(context, item), {
              unlisten: feed.destroy
            }),
            h('div.loading')
          )
        }
      })
    ]),
    h('div.side', [
      h('h2', 'Following'),
      MutantMap(profiles, (item) => renderMiniProfile(context, item)),
      h('button -full -pub', {href: '#', 'ev-click': context.actions.openJoinPubWindow}, ['+ Join Pub'])
    ])
  ])
}
