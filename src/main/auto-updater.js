const { autoUpdater } = require('electron-updater')
const winston = require('winston')
const events = require('events')
const ping = require('domain-ping')

const store = require('../store')
const logger = require('../logger')

// MapeoUpdater emits the 'error' event when there is an internal error with
// updating. We wrap electron-updater to control the API surface.

const PERSISTED_STORE_KEY = 'updater.channel'
const FEED_URL = 'https://downloads.mapeo.app/desktop'
const VALID_CHANNELS = ['beta', 'latest', 'alpha']

class MapeoUpdater extends events.EventEmitter {
  constructor () {
    super()
    // Settings
    autoUpdater.setFeedURL(FEED_URL)
    autoUpdater.channel = this.channel
    autoUpdater.autoDownload = false
    autoUpdater.logger = winston
    autoUpdater.autoInstallOnAppQuit = false
    autoUpdater.allowDowngrade = true
    this._onerror = this._onerror.bind(this)

    autoUpdater.on('error', this._onerror)
  }

  // Never use autoUpdater directly in downstream modules.
  get channel () {
    let channel
    try {
      channel = store.get(PERSISTED_STORE_KEY)
    } catch (err) {
      // library defaults to 'latest' when unset
      channel = autoUpdater.channel
    }
    if (channel !== autoUpdater.channel) autoUpdater.channel = channel
    return channel
  }

  set channel (value) {
    if (VALID_CHANNELS.indexOf(value) === -1) {
      logger.error('[UPDATER] Invalid channel', value)
      return
    }
    store.set(PERSISTED_STORE_KEY, value)
    autoUpdater.channel = value
    logger.log('[UPDATER] Channel updated to', updater.channel)
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
      logger.log('[UPDATER] Progress', progress)
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
    logger.log('[UPDATER] Download initiated.')
    var promise = autoUpdater.downloadUpdate()
    promise.catch(this._onerror)
    return promise
  }

  checkForUpdates (cb) {
    if (!cb) cb = () => {}
    logger.log('[UPDATER] Checking for updates on the channel', autoUpdater.channel)
    ping('downloads.mapeo.app').then(res => {
      logger.log('[UDATER] On the internet, checking for updates from', FEED_URL)
      try {
        var promise = autoUpdater.checkForUpdates()
        promise
          .then(update => cb(null, update))
          .catch(this._onerror)
      } catch (err) {
        this._onerror(err)
        cb(err)
      }
    }).catch((err) => {
      // TODO: error codes for internationalization.
      var error = new Error('Internet not available.', err)
      this._onerror(error)
      cb(error)
    })
  }

  _onerror (err) {
    logger.error('[UPDATER]', err)
    this.emit('error', err)
  }

  quitAndInstall () {
    autoUpdater.quitAndInstall()
  }
}

var updater
if (!updater) updater = new MapeoUpdater()

module.exports = updater
