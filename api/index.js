var pull = require('pull-stream')
var MutantArray = require('@mmckegg/mutant/array')
var Value = require('@mmckegg/mutant/value')
var AudioPost = require('../models/audio-post')
var electron = require('electron')
var Profiles = require('./profiles')

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

  return {
    id: ssbClient.id,
    getGlobalFeed (cb) {
      return toMutantArray(ssbClient.createFeedStream({live: true}), cb)
    },

    getFollowingFeed (cb) {
      return toMutantArray(ssbClient.createFeedStream({live: true}), cb)
    },

    getProfileFeed (id, cb) {
      return toMutantArray(ssbClient.createHistoryStream({id, live: true}), cb)
    },

    setOwnDisplayName (name, cb) {
      ssbClient.publish({
        type: 'about',
        about: ssbClient.id,
        name: name
      }, (err) => cb && cb(err))
    },

    onProfilesLoaded (listener) {
      checkProfilesLoaded()
      profiles.onLoaded(listener)
    },

    getProfile (id) {
      checkProfilesLoaded()
      return profiles.get(id)
    },

    getOwnProfile () {
      checkProfilesLoaded()
      return profiles.get(ssbClient.id)
    },

    publish (content, cb) {
      ssbClient.publish(content, function (err, msg) {
        if (err) console.error(err)
        else if (!cb) console.log(msg)
        cb && cb(err, msg)
      })
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
  function checkProfilesLoaded () {
    if (!profiles) {
      profiles = Profiles(ssbClient)
    }
  }

  function toMutantArray (readStream, cb) {
    checkProfilesLoaded()
    var result = MutantArray()
    var processor = pull.drain(function (item) {
      if (item.sync) {
        cb && cb(result)
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
