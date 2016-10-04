var pull = require('pull-stream')
var MutantArray = require('@mmckegg/mutant/array')
var MutantMap = require('@mmckegg/mutant/map')
var AudioPost = require('../models/audio-post')
var electron = require('electron')
var Profiles = require('./profiles')
var schemas = require('ssb-msg-schemas')
var Value = require('@mmckegg/mutant/value')
var Proxy = require('@mmckegg/mutant/proxy')
var mlib = require('ssb-msgs')

var callbacks = {}
electron.ipcRenderer.on('response', (ev, id, ...args) => {
  var cb = callbacks[id]
  if (cb) {
    delete callbacks[id]
    cb(...args)
  }
})

module.exports = function (ssbClient, config) {
  var itemCache = new Map()
  var windowId = Date.now()
  var seq = 0
  var profiles = null
  var profilesLoaded = Proxy()
  var requesting = new Map()

  return {
    id: ssbClient.id,

    getDiscoveryFeed (cb) {
      return toMutantArray(pull(
        getGlobalFeed(),
        ofType('ferment/audio')
      ), cb)
    },

    getFollowingFeed (cb) {
      checkProfilesLoaded()
      return toMutantArray(pull(
        getGlobalFeed(),
        ofType('ferment/audio'),
        byAuthor(profiles.get(ssbClient.id).following())
      ), cb)
    },

    getProfileFeed (id, cb) {
      return toMutantArray(pull(
        ssbClient.createHistoryStream({id, live: true}),
        ofType('ferment/audio')
      ), cb)
    },

    setOwnDisplayName (name, cb) {
      ssbClient.publish({
        type: 'about',
        about: ssbClient.id,
        name: name
      }, (err) => cb && cb(err))
    },

    getLikedFeedFor (id) {
      checkProfilesLoaded()
      var likes = profiles.get(id).likes
      return lookupItems(likes)
    },

    profilesLoaded,
    requestItem,

    getProfile (id) {
      checkProfilesLoaded()
      return profiles.get(id)
    },

    getOwnProfile () {
      checkProfilesLoaded()
      return profiles.get(ssbClient.id)
    },

    getSuggestedProfiles () {
      checkProfilesLoaded()
      return profiles.getSuggested()
    },

    publish,

    follow (id, cb) {
      publish(schemas.follow(id), cb)
    },

    unfollow (id, cb) {
      publish(schemas.unfollow(id), cb)
    },

    like (id, cb) {
      var likeLink = mlib.link(id)
      likeLink.value = true
      publish({
        type: 'ferment/like',
        like: likeLink
      }, cb)
    },

    getLikesFor (id) {
      checkProfilesLoaded()
      return profiles.getLikesFor(id)
    },

    unlike (id, cb) {
      var unlikeLink = mlib.link(id)
      unlikeLink.value = false
      publish({
        type: 'ferment/like',
        like: unlikeLink
      }, cb)
    },

    addBlob (path, cb) {
      var id = `${windowId}-${seq++}`
      callbacks[id] = cb
      electron.ipcRenderer.send('add-blob', id, path)
    },

    getBlobUrl (hash) {
      return `http://localhost:${config.blobsPort}/${hash}`
    }
  }

  // scoped
  function getGlobalFeed () {
    return ssbClient.createFeedStream({live: true})
  }

  function checkProfilesLoaded () {
    if (!profiles) {
      profiles = Profiles(ssbClient)
      profilesLoaded.set(profiles.sync)
    }
  }

  function publish (message, cb) {
    ssbClient.publish(message, function (err, msg) {
      if (!cb && err) throw err
      cb && cb(err, msg)
    })
  }

  function lookupItems (ids) {
    return MutantMap(ids, (id, invalidateOn) => {
      if (itemCache.has(id)) {
        return itemCache.get(id)
      } else {
        invalidateOn(requestItem(id))
      }
    })
  }

  function requestItem (id) {
    if (requesting.has(id)) {
      return requesting.get(id)
    } else {
      var marker = Proxy()
      requesting.set(id, marker)
      ssbClient.get(id, function (err, value) {
        if (!err) {
          var instance = AudioPost(id, profiles.get(value.author))
          instance.set(value.content)
          itemCache.set(id, instance)
          marker.set(instance)
          requesting.delete(id)
        }
      })
      return marker
    }
  }

  function toMutantArray (readStream, cb) {
    checkProfilesLoaded()
    var result = MutantArray()
    result.sync = Value(false)
    var processor = pull.drain(function (item) {
      if (item.sync) {
        cb && cb(result)
        result.sync.set(true)
      } else {
        if (item.value.content.type === 'ferment/audio') {
          var instance = itemCache.get(item.key)
          if (!instance) {
            instance = AudioPost(item.key, profiles.get(item.value.author))
            instance.set(item.value.content)
            itemCache.set(item.key, instance)
          }
          result.insert(instance, 0)
        }
      }
    })

    pull(readStream, processor)

    result.destroy = function () {
      processor.abort()
    }

    return result
  }
}

function ofType (types) {
  types = Array.isArray(types) ? types : [types]
  return pull.filter((item) => {
    if (item.value) {
      return types.includes(item.value.content.type)
    } else {
      return true
    }
  })
}

function byAuthor (authorIds) {
  authorIds = Array.isArray(authorIds) ? authorIds : [authorIds]
  return pull.filter((item) => {
    if (item.value) {
      return authorIds.includes(item.value.author)
    } else {
      return true
    }
  })
}
