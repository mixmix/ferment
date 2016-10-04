var h = require('./lib/h')
var when = require('@mmckegg/mutant/when')
var Value = require('@mmckegg/mutant/value')
var electron = require('electron')
var ref = require('ssb-ref')
var markdown = require('./lib/markdown')

var info = `
## By default, **Ferment** will only see other users that are on the same local area network as you.

In order to share with users on the internet, you need to be [invited to a pub server](https://github.com/mmckegg/ferment).
`.trim()

module.exports = function (client, config, data) {
  var waiting = Value(false)
  var inviteCode = h('input -name', {
    placeholder: 'paste invite code here'
  })

  setTimeout(() => {
    inviteCode.focus()
  }, 50)

  return h('Dialog', [
    h('section JoinPub', [
      h('div.info', [
        markdown(info)
      ]),
      h('div', [
        inviteCode
      ])
    ]),
    h('footer', [
      when(waiting,
        h('button', { 'disabled': true }, ['Please wait...']),
        [ h('button -save', {'ev-click': save}, ['Redeem Invite']),
          h('button -cancel', {'ev-click': close}, ['Cancel'])
        ]
      )
    ])
  ])

  // scoped

  function save () {
    if (!inviteCode.value) {
      showDialog({
        type: 'info',
        buttons: ['OK'],
        message: 'You must specify an invite code.'
      })
    } else if (!ref.isInvite(inviteCode.value)) {
      showDialog({
        type: 'info',
        buttons: ['OK'],
        message: 'The invite code specified is not valid. Please check to make sure it was copied correctly.'
      })
    } else {
      waiting.set(true)
      client.invite.accept(inviteCode.value, (err) => {
        if (err) {
          waiting.set(false)
          showDialog({
            type: 'error',
            title: 'Error',
            buttons: ['OK'],
            message: 'An error occured while attempting to redeem invite.'
          })
        }
        close()
      })
    }
  }

  function close () {
    var window = electron.remote.getCurrentWindow()
    window.close()
  }
}

function showDialog (opts) {
  electron.remote.dialog.showMessageBox(electron.remote.getCurrentWindow(), opts)
}
