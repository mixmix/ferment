var h = require('../lib/h')
var Proxy = require('@mmckegg/mutant/proxy')
var ProxyCollection = require('@mmckegg/mutant/proxy-collection')

module.exports = Player

function Player (context) {
  var currentItem = Proxy()
  var currentFeed = ProxyCollection()
  var audioElement = h('audio', { controls: true })
  var itemReleases = []

  var self = {
    context,
    currentItem,
    currentFeed,
    audioElement,

    togglePlay (item) {
      if (currentItem.get() === item || !item) {
        if (item.state() !== 'paused') {
          audioElement.pause()
        } else {
          audioElement.play()
        }
      } else {
        if (currentItem.get()) {
          audioElement.pause()
        }

        while (itemReleases.length) {
          itemReleases.pop()()
        }

        item.state.set('waiting')

        itemReleases.push(context.background.stream(item.audioSrc(), (err, url) => {
          if (err) throw err
          audioElement.src = url
          audioElement.ontimeupdate = function (e) {
            item.position.set(e.target.currentTime)
          }
          audioElement.onwaiting = () => item.state.set('waiting')
          audioElement.onplaying = () => item.state.set('playing')
          audioElement.onpause = () => item.state.set('paused')
          audioElement.onended = () => {
            currentItem.get().position.set(0)
            self.playNext()
          }
          audioElement.currentTime = item.position() || 0
          audioElement.play()
          currentItem.set(item)
        }))
      }
    },

    playNext () {
      var index = currentFeed.indexOf(currentItem.get())
      var next = currentFeed.get(index + 1)
      if (next) {
        next.position.set(0)
        self.togglePlay(next)
      }
    }
  }

  return self
}
