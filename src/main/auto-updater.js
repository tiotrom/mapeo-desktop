const { autoUpdater } = require('electron-updater')
const logger = require('../logger')

module.exports = function () {
  // Check for updates every four hours
  const FOUR_HOURS = 1000 * 60 * 60 * 4
  setInterval(async () => {
    autoUpdater.checkForUpdatesAndNotify()
  }, FOUR_HOURS)

  // Settings
  autoUpdater.autoDownload = false
  autoUpdater.logger.transports.file.level = 'info'
  autoUpdater.logger = logger
  autoUpdater.autoInstallOnAppQuit = false
  autoUpdater.allowDowngrade = true

  // Handlers
  autoUpdater.on('error', console.log)
  autoUpdater.on('update-available', console.log)
  autoUpdater.on('update-not-available', console.log)
  autoUpdater.on('download-progress', console.log)
  autoUpdater.on('update-downloaded', console.log)

  // Go.
  autoUpdater.checkForUpdatesAndNotify()
}
