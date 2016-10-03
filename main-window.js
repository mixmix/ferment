var h = require('./lib/h')
var MutantMap = require('@mmckegg/mutant/map')
var electron = require('electron')

var Player = require('./widgets/player')
var renderAudioPost = require('./widgets/audio-post')

module.exports = function (client, config) {
  var api = require('./api')(client, config)
  var background = require('./models/background-remote')(config)

  var context = { config, api, background }
  var player = context.player = Player(context)
  var profile = api.getOwnProfile()

  api.onProfilesLoaded(() => {
    if (!profile.displayName()) {
      // prompt use to set up profile the first time they open app
      openEditProfileWindow()
    }
  })

  var feed = api.getGlobalFeed(context, {feedTitle: 'DESTROY WITH SCIENCE'})
  player.currentFeed.set(feed)

  return h('MainWindow', [
    h('div.top', [
      h('span.appTitle', ['Ferment']),
      h('span', [
        h('a -profile', {href: '#', 'ev-click': openEditProfileWindow}, ['Edit Profile']),
        h('a -add', {href: '#', 'ev-click': openAddWindow}, ['+ Add Audio'])
      ])
    ]),
    h('div.main', [
      h('Feed', [
        h('h1', 'Feed'),
        MutantMap(feed, (item) => renderAudioPost(context, item))
      ])
    ]),
    h('div.bottom', [
      player.audioElement
    ])
  ])

  // scoped

  function openEditProfileWindow () {
    electron.ipcRenderer.send('open-edit-profile-window', {
      profile: profile.byMe(),
      id: api.id
    })
  }
}

function openAddWindow () {
  electron.ipcRenderer.send('open-add-window')
}
