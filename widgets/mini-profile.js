var h = require('../lib/h')
var when = require('@mmckegg/mutant/when')
var send = require('@mmckegg/mutant/send')
var computed = require('@mmckegg/mutant/computed')

module.exports = function (context, profile) {
  return h('MiniProfile', {
    'ev-click': send(context.actions.viewProfile, profile.id),
    'tab-index': 0,
    style: {
      cursor: 'pointer'
    }
  }, [
    h('div.image', {
      style: {
        'background-image': computed(profile.image, url => url ? `url('${context.api.getBlobUrl(url)}')` : '')
      }
    }),
    h('div.main', [
      h('div.displayName', {
        href: '#'
      }, [ profile.displayName ]),
      h('div.info', [
        h('span', [
          h('strong', [profile.postCount]), ' posts'
        ]), ' // ',
        h('span', [
          h('strong', [computed(profile.followers, count)]), ' followers'
        ])
      ])
    ])
  ])
}

function count (items) {
  return items.length
}
