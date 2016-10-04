var MutantDict = require('@mmckegg/mutant/dict')
var pull = require('pull-stream')
var Profile = require('../models/profile')
var MutantLookup = require('@mmckegg/mutant/lookup')
var toCollection = require('@mmckegg/mutant/dict-to-collection')
var mlib = require('ssb-msgs')
var computed = require('@mmckegg/mutant/computed')
var MutantMap = require('@mmckegg/mutant/map')
var Value = require('@mmckegg/mutant/value')
var SetDict = require('../lib/set-dict')

module.exports = function (ssbClient) {
  var lookup = MutantDict()
  var profilesList = toCollection(lookup)
  var lookupByName = MutantLookup(profilesList, 'displayName')
  var sync = Value(false)
  var postLikes = SetDict()

  pull(
    ssbClient.createFeedStream({ live: true }),
    pull.drain((data) => {
      if (data.sync) {
        sync.set(true)
      } else if (data.value.content.type === 'about') {
        mlib.links(data.value.content.about, 'feed').forEach(function (link) {
          const profile = get(link.link)
          profile.updateFrom(data.value.author, data)
        })
      } else if (data.value.content.type === 'contact') {
        const following = data.value.content.following
        const author = get(data.value.author)

        mlib.links(data.value.content.contact, 'feed').forEach(function (link) {
          if (typeof following === 'boolean') {
            const target = get(link.link)
            if (following) {
              author.following.add(link.link)
              target.followers.add(data.value.author)
            } else {
              author.following.delete(link.link)
              target.followers.delete(data.value.author)
            }
          }
        })
      } else if (data.value.content.type === 'ferment/audio') {
        const author = get(data.value.author)
        author.postCount.set(author.postCount() + 1)
      } else if (data.value.content.type === 'ferment/like') {
        const profile = get(data.value.author)
        const like = mlib.link(data.value.content.like, 'msg')
        if (like.value) {
          postLikes.addValue(like.link, data.value.author)
          profile.likes.add(like.link)
        } else {
          postLikes.deleteValue(like.link, data.value.author)
          profile.likes.delete(like.link)
        }
      }
    })
  )

  return {
    get,
    getSuggested,
    getLikesFor: postLikes.getValue,
    lookup,
    lookupByName,
    sync
  }

  function get (id) {
    if (id.id) {
      // already a profile?
      return id
    }

    var profile = lookup.get(id)
    if (!profile) {
      profile = Profile(id, ssbClient.id)
      lookup.put(id, profile)
    }

    return profile
  }

  function getSuggested () {
    var yourProfile = get(ssbClient.id)
    var ids = computed([sync, lookup], (sync, profiles) => {
      if (sync) {
        var result = []
        for (var id in profiles) {
          var profile = get(id)
          if (!yourProfile.following.has(id) && id !== yourProfile.id && profile.postCount() > 0) {
            result.push(id)
            if (result.length > 10) {
              break
            }
          }
        }
        return result
      }
    }, { nextTick: true })
    return MutantMap(ids, get)
  }
}
