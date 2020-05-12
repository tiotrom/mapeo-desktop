import { ipcRenderer } from 'electron'
import logger from '../logger'

export default Api(ipcRenderer)

function Api (ipcRenderer) {
  return {
    addUpdateAvailableListener: function (handler) {
      function onupdate (ev, info) {
        logger.log('in frontend, got update-available', info)
        handler(info)
      }
      ipcRenderer.on('update-available', onupdate)
      return {
        remove: () => ipcRenderer.removeListener('update-available', onupdate)
      }
    }
  }
}
