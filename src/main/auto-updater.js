const { autoUpdater } = require('electron-updater')
const winston = require('winston')
const events = require('events')
const logger = require('../logger')
const ping = require('domain-ping')

// MapeoUpdater emits the 'error' event when there is an internal error with
// updating. We wrap electron-updater to control the API surface.

const FEED_URL = 'https://downloads.mapeo.app/desktop'

class MapeoUpdater extends events.EventEmitter {
  constructor () {
    super()
    // Settings
    autoUpdater.setFeedURL(FEED_URL)
    autoUpdater.autoDownload = false
    autoUpdater.logger = winston
    autoUpdater.autoInstallOnAppQuit = false
    autoUpdater.allowDowngrade = true
    this._onerror = this._onerror.bind(this)

    autoUpdater.on('error', this._onerror)
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
    this.checkForUpdates()
  }

  downloadUpdate () {
    logger.log('downloading update')
    var promise = autoUpdater.downloadUpdate()
    promise.catch(this._onerror)
    return promise
  }

  checkForUpdates () {
    logger.log('checking for updates')
    ping('downloads.mapeo.app').then((res) => {
      logger.log('on the internet!', FEED_URL)
      try {
        var promise = autoUpdater.checkForUpdates()
        promise.catch(this._onerror)
      } catch (err) {
        this._onerror(err)
      }
    }).catch((err) => {
      // TODO: error codes for internationalization.
      console.error(err)
      this._onerror(new Error('Internet not available.'))
    })
  }

  _onerror (err) {
    logger.error(err)
    this.emit('error', err)
  }

  quitAndInstall () {
    autoUpdater.quitAndInstall()
  }
}

var updater
if (!updater) updater = new MapeoUpdater()

module.exports = updater
