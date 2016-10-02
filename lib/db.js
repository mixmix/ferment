var createClient = require('ssb-client')
var pull = require('pull-stream')
var MutantArray = require('@mmckegg/mutant/array')
var Value = require('@mmckegg/mutant/value')
var AudioPost = require('../models/audio-post')
var Reconnect = require('pull-reconnect')

module.exports = function (config) {
  var itemCache = new Map()
  var connectionStatus = Value()

  var ssbClient = null

  var rec = Reconnect(function (isConn) {
    createClient(config.keys, config, (err, client) => {
      if (err) return notify(err)
      ssbClient = client
      ssbClient.on('closed', function () {
        ssbClient = null
        notify(new Error('closed'))
      })
      notify(null, true)
    })

    // scoped
    function notify (err, value) {
      isConn(err)
      connectionStatus.set(value || err)
    }
  })

  var createFeedStream = rec.source(opts => ssbClient.createFeedStream(opts))

  return {
    connectionStatus,
    getGlobalFeed (context) {
      var result = MutantArray()
      pull(
        createFeedStream({live: true}),
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
    publish: rec.async(function (content, cb) {
      ssbClient.publish(content, function (err, msg) {
        if (err) console.error(err)
        else if (!cb) console.log(msg)
        cb && cb(err, msg)
      })
    })
  }
}
