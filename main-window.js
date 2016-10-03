var h = require('./lib/h')
var Value = require('@mmckegg/mutant/value')
var computed = require('@mmckegg/mutant/computed')
var when = require('@mmckegg/mutant/when')
var send = require('@mmckegg/mutant/send')
var electron = require('electron')
var Player = require('./widgets/player')

var views = {
  discoveryFeed: require('./views/discovery-feed'),
  followingFeed: require('./views/following-feed'),
  profile: require('./views/profile')
}

module.exports = function (client, config) {
  var api = require('./api')(client, config)
  var background = require('./models/background-remote')(config)
  var currentView = Value(['discoveryFeed'])

  var backHistory = []
  var forwardHistory = []
  var canGoForward = Value(false)
  var canGoBack = Value(false)

  var actions = {
    viewProfile (id) {
      actions.setView('profile', id)
    },
    setView: function (view, ...args) {
      var newView = [view, ...args]
      if (!isSame(newView, currentView())) {
        canGoForward.set(false)
        canGoBack.set(true)
        forwardHistory.length = 0
        backHistory.push(currentView())
        currentView.set(newView)
      }
    }
  }

  var context = { config, api, background, actions }
  var player = context.player = Player(context)
  var profile = api.getOwnProfile()

  api.onProfilesLoaded(() => {
    if (!profile.displayName()) {
      // prompt use to set up profile the first time they open app
      openEditProfileWindow()
    }
  })

  var rootElement = computed(currentView, (data) => {
    if (Array.isArray(data) && views[data[0]]) {
      return views[data[0]](context, ...data.slice(1))
    }
  })

  return h('MainWindow', [
    h('div.top', [
      h('span.history', [
        h('a', {
          'ev-click': goBack,
          classList: [ when(canGoBack, '-active') ]
        }, '<'),
        h('a', {
          'ev-click': goForward,
          classList: [ when(canGoForward, '-active') ]
        }, '>')
      ]),
      h('span.nav', [
        h('a', {
          'ev-click': send(actions.setView, 'discoveryFeed'),
          classList: [ computed(currentView, (x) => x[0] === 'discoveryFeed' ? '-selected' : null) ]
        }, 'Discovery'),
        h('a', {
          'ev-click': send(actions.setView, 'followingFeed'),
          classList: [ computed(currentView, (x) => x[0] === 'followingFeed' ? '-selected' : null) ]
        }, 'Following')
      ]),
      h('span.appTitle', ['Ferment']),
      h('span', [
        h('a', {
          'ev-click': send(actions.viewProfile, api.id),
          title: 'Your Profile',
          classList: [ computed(currentView, (x) => x[0] === 'profile' && x[1] === api.id ? '-selected' : null) ]
        }, '😀'),
        h('a -profile', {href: '#', 'ev-click': openEditProfileWindow}, ['Edit Profile']),
        h('a -pub', {href: '#', 'ev-click': openJoinPubWindow}, ['Join Pub']),
        h('a -add', {href: '#', 'ev-click': openAddWindow}, ['+ Add Audio'])
      ])
    ]),
    h('div.main', [
      rootElement
    ]),
    h('div.bottom', [
      player.audioElement
    ])
  ])

  // scoped

  function goBack () {
    if (backHistory.length) {
      canGoForward.set(true)
      forwardHistory.push(currentView())
      currentView.set(backHistory.pop())
      canGoBack.set(backHistory.length > 0)
    }
  }

  function goForward () {
    if (forwardHistory.length) {
      backHistory.push(currentView())
      currentView.set(forwardHistory.pop())
      canGoForward.set(forwardHistory.length > 0)
      canGoBack.set(true)
    }
  }

  function openEditProfileWindow () {
    electron.ipcRenderer.send('open-edit-profile-window', {
      profile: profile.byMe(),
      id: api.id
    })
  }

  function openJoinPubWindow () {

  }
}

function openAddWindow () {
  electron.ipcRenderer.send('open-add-window')
}

function isSame (a, b) {
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
    for (var i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false
      }
    }
    return true
  } else if (a === b) {
    return true
  }
}
