var h = require('../lib/h')
var renderAudioPost = require('../widgets/audio-post')
var MutantMap = require('@mmckegg/mutant/map')
var computed = require('@mmckegg/mutant/computed')
var MarkdownHook = require('../lib/markdown-hook')

module.exports = DiscoveryFeed

function DiscoveryFeed (context, profileId) {
  var profile = context.api.getProfile(profileId)
  var feed = context.api.getProfileFeed(profileId)
  context.player.currentFeed.set(feed)

  return h('Profile', {
    hooks: [ UnlistenHook(feed.destroy) ]
  }, [
    h('header', [
      h('div.image', {
        style: {
          'background-image': computed(profile.image, url => url ? `url('${context.api.getBlobUrl(url)}')` : '')
        }
      }),
      h('div.main', [
        h('h1', [ profile.displayName ]),
        h('div.description', {
          hooks: [ MarkdownHook(profile.description) ]
        })
      ])
    ]),
    h('section', [
      MutantMap(feed, (item) => renderAudioPost(context, item))
    ])
  ])
}

function UnlistenHook (cb) {
  return function (element) {
    return cb
  }
}
