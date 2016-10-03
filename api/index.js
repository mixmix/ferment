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

module.exports = function (ssbClient) {
  var itemCache = new Map()
  var connectionStatus = Value()
  var windowId = Date.now()
  var seq = 0
  var profiles = null

  return {
    connectionStatus,
    getGlobalFeed (context) {
      checkProfilesLoaded()
      var result = MutantArray()
      var sync = false
      var readStream = ssbClient.createFeedStream({live: true, reverse: true})
      pull(
        readStream,
        pull.drain(function (item) {
          if (item.sync) {
            sync = true
          } else {
            if (item.value.content.type === 'ferment/audio') {
              var instance = itemCache.get(item.key)
              if (!instance) {
                instance = AudioPost(item.key, profiles.get(item.value.author))
                instance.set(item.value.content)
                itemCache.set(item.key, instance)
              }
              if (sync) {
                result.insert(instance, 0)
              } else {
                result.push(instance)
              }
            }
          }
        })
      )
      result.destroy = function () {
        readStream.end()
      }
      return result
    },

    setOwnDisplayName (name, cb) {
      ssbClient.publish({
        type: 'about',
        about: ssbClient.id,
        name: name
      }, (err) => cb && cb(err))
    },

    getProfile (id) {
      checkProfilesLoaded()
      return profiles.get(id)
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
    }
  }

  // scoped
  function checkProfilesLoaded () {
    if (!profiles) {
      profiles = Profiles(ssbClient)
    }
  }
}
