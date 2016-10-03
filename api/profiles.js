var MutantDict = require('@mmckegg/mutant/dict')
var pull = require('pull-stream')
var Profile = require('../models/profile')
var MutantLookup = require('@mmckegg/mutant/lookup')
var toCollection = require('@mmckegg/mutant/dict-to-collection')
var mlib = require('ssb-msgs')

module.exports = function (ssbClient) {
  var lookup = MutantDict()
  var profilesList = toCollection(lookup)
  var lookupByName = MutantLookup(profilesList, 'displayName')

  pull(
    ssbClient.createFeedStream({ live: true }),
    pull.drain((data) => {
      if (data.value && data.value.content.type === 'about') {
        mlib.links(data.value.content.about, 'feed').forEach(function (link) {
          var profile = get(link.link)
          profile.updateFrom(data.value.author, data)
        })
      }
    })
  )

  return { get, lookup, lookupByName }

  function get (id) {
    if (id.id) {
      // already a profile?
      return id
    }

    var profile = lookup.get(id)
    if (!profile) {
      profile = Profile(id)
      lookup.put(id, profile)
    }

    return profile
  }
}
