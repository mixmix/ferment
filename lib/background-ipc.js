var electron = require('electron')

module.exports = function setupIpc (windows) {
  var messageQueueMainToBackground = []

  electron.ipcMain.once('ipcBackgroundReady', function (e) {
    electron.app.ipcBackgroundReady = true
    messageQueueMainToBackground.forEach(function (message) {
      windows.background.send(message.name, ...message.args)
    })
  })

  var oldEmit = electron.ipcMain.emit
  electron.ipcMain.emit = function (name, e, ...args) {
    // Relay messages between the main window and the background window
    if (name.startsWith('bg-') && !electron.app.isQuitting) {
      if (e.sender.browserWindowOptions.title === 'ferment-background-window') {
        // Send message to main window
        if (windows.main) {
          windows.main.send(name, ...args)
        }

        windows.dialogs.forEach(window => window.send(name, ...args))
      } else if (electron.app.ipcBackgroundReady) {
        // Send message to webtorrent window
        windows.background.send(name, ...args)
      } else {
        // Queue message for background window, it hasn't finished loading yet
        messageQueueMainToBackground.push({
          name: name,
          args: args
        })
      }
      return
    }

    // Emit all other events normally
    oldEmit.call(electron.ipcMain, name, e, ...args)
  }
}
