const { autoUpdater } = require('electron-updater')
const winston = require('winston')
const events = require('events')
const logger = require('../logger')

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

  updateAvailable (onupdate) {
    autoUpdater.on('update-available', ({
      version, files, path, sha512, releaseDate
    }) => {
      onupdate({
        version, files, path, sha512, releaseDate
      })
    })
  }

  updateNotAvailable (cb) {
    autoUpdater.on('update-not-available', cb)
  }

  downloadProgress (onprogress) {
    autoUpdater.on('download-progress', (progress) => {
      logger.log('progress', progress)
      onprogress({
        progress: progress
      })
    })
  }

  updateDownloaded (cb) {
    autoUpdater.on('update-downloaded', cb)
  }

  periodicUpdates (interval) {
    const FOUR_HOURS = 1000 * 60 * 60 * 4
    setInterval(async () => {
      this.checkForUpdates()
    }, interval || FOUR_HOURS)
  }

  downloadUpdate () {
    logger.log('downloading update')
    var promise = autoUpdater.downloadUpdate()
    promise.catch((err) => {
      this.emit('error', err)
    })
    return promise
  }

  checkForUpdates () {
    logger.log('checking for updates')
    var promise = autoUpdater.checkForUpdates()
    promise.catch((err) => {
      this.emit('error', err)
    })
    return promise
  }

  quitAndInstall () {
    autoUpdater.quitAndInstall()
  }
}

var updater
if (!updater) updater = new MapeoUpdater()

module.exports = updater
