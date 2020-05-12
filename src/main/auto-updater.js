const { autoUpdater } = require('electron-updater')
const winston = require('winston')
const events = require('events')

// const logger = require('../logger')

// MapeoUpdater emits the 'error' event when there is an internal error with
// updating. We wrap electron-updater to control the API surface.

class MapeoUpdater extends events.EventEmitter {
  constructor () {
    super()
    // Settings
    autoUpdater.autoDownload = false
    autoUpdater.logger = winston
    autoUpdater.autoInstallOnAppQuit = false
    autoUpdater.allowDowngrade = true

    autoUpdater.on('error', (err) => {
      this.emit('error', err)
    })
  }

  updateAvailable (cb) {
    autoUpdater.on('update-available', ({
      version, files, path, sha512, releaseDate
    }) => {
      cb({
        version, files, path, sha512, releaseDate
      })
    })
  }

  updateNotAvailable (cb) {
    autoUpdater.on('update-not-available', cb)
  }

  downloadProgress (cb) {
    autoUpdater.on('download-progress', cb)
  }

  updateDownloaded (cb) {
    autoUpdater.on('update-downloaded', cb)
  }

  periodicUpdates (interval) {
    const FOUR_HOURS = 1000 * 60 * 60 * 4
    setInterval(async () => {
      autoUpdater.checkForUpdates()
    }, interval || FOUR_HOURS)
  }

  checkForUpdates () {
    console.log('checking for updates')
    var promise = autoUpdater.checkForUpdates()
    return promise
  }
}

var updater
if (!updater) updater = new MapeoUpdater()

module.exports = updater
