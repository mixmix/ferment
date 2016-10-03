var pull = require('pull-stream')
var MutantArray = require('@mmckegg/mutant/array')
var Value = require('@mmckegg/mutant/value')
var AudioPost = require('../models/audio-post')
var electron = require('electron')
var feedProcessor = require('./feed-processor')

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

  //var patchworkdb = ssbClient.sublevel('ferment')

  return {
    connectionStatus,
    getGlobalFeed (context) {
      var result = MutantArray()
      pull(
        ssbClient.createFeedStream({live: true}),
        pull.drain(function (item) {
          if (!item.sync) {
            if (item.value.content.type === 'ferment/audio') {
              var instance = itemCache.get(item.key)
              if (!instance) {
                instance = AudioPost(context, item.value, { feedTitle: 'DESTROY WITH SCIENCE' })
                itemCache.set(item.key, instance)
              }
              result.insert(instance, 0)
            }
          }
        })
      )
      return result
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
}
