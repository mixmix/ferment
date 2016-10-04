var h = require('../lib/h')
var when = require('@mmckegg/mutant/when')
var send = require('@mmckegg/mutant/send')
var computed = require('@mmckegg/mutant/computed')

module.exports = function (context, profileId) {
  var yourProfile = context.api.getProfile(context.api.id)
  var following = computed(yourProfile.following, list => list.includes(profileId))
  var followsYou = computed(yourProfile.followers, list => list.includes(profileId))

  if (profileId !== yourProfile.id) {
    return when(following,
      h('button', {
        'title': 'Click to unfollow',
        'ev-click': send(context.api.unfollow, profileId)
      }, when(followsYou, 'Friends', 'Following')),
      h('button -follow', {
        'ev-click': send(context.api.follow, profileId)
      }, when(followsYou, 'Follow Back', '+ Follow'))
    )
  }
}
