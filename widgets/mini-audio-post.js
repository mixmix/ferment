var h = require('../lib/h')
var when = require('@mmckegg/mutant/when')
var computed = require('@mmckegg/mutant/computed')

module.exports = function (context, item) {
  var likes = context.api.getLikesFor(item.id)
  var likeCount = computed(likes, x => x.length)

  var url = computed(item.artworkSrc, (src) => {
    if (src && src.startsWith('blobstore:')) {
      return `http://localhost:${context.config.blobsPort}/${src.slice(10)}`
    } else {
      return src
    }
  })

  return h('MiniAudioPost', {
    'ev-click': (ev) => context.actions.viewProfile(item.author.id, item.id),
    'tab-index': 0,
    classList: [
      computed(item.state, (s) => s ? `-${s}` : null)
    ],
    style: {
      cursor: 'pointer'
    }
  }, [
    h('div.image', {
      style: {
        'background-image': computed(url, url => url ? `url('${url}')` : '')
      }
    }, [
      h('a.play', {
        'ev-click': (ev) => {
          ev.stopPropagation()
          context.player.togglePlay(item)
        },
        href: '#'
      })
    ]),
    h('div.main', [
      h('div.displayName', [ item.author.displayName ]),
      h('div.title', [ item.title ]),
      h('div.info', [
        when(likeCount, h('span', [
          h('strong', [likeCount]), ' likes'
        ]))
      ])
    ])
  ])
}
