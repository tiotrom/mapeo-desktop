import React, { useEffect, useState } from 'react'
import { Typography, makeStyles } from '@material-ui/core'
import { defineMessages, useIntl } from 'react-intl'
import Button from '@material-ui/core/Button'
import electronIpc from '../electron-ipc'
import logger from '../../logger'

const STATES = {
  IDLE: 0,
  AVAILABLE: 1,
  DOWNLOADING: 2,
  PROGRESS: 3,
  READY_FOR_RESTART: 4
}

function useUpdater () {
  const [update, setUpdate] = useState(STATES.IDLE)

  useEffect(
    () => {
      const updateListener = electronIpc.addUpdateStatusListener(({ serverState, info }) => {
        logger.log('updateListener', serverState, info)
        switch (serverState) {
          case 'update-downloaded':
            setUpdate({
              updateInfo: info,
              state: STATES.READY_FOR_RESTART
            })
            return
          case 'update-not-available':
            setUpdate({
              updateInfo: null,
              state: STATES.IDLE
            })
            return
          case 'download-progress':
            setUpdate({
              updateInfo: info,
              state: STATES.PROGRESS
            })
            return
          case 'update-available':
            setUpdate({
              updateInfo: {
                version: info.version,
                releaseDate: info.releaseDate,
                size: info.files.map((file) => file.size).reduce((a, b) => a + b, 0)
              },
              state: STATES.AVAILABLE
            })
        }
      })
      return () => {
        if (updateListener) updateListener.remove()
      }
    }
    , [])

  return [update, setUpdate]
}

const m = defineMessages({
  // Title on sync screen when searching for devices
  updateAvailable: 'Update Available',
  downloadButtonText: 'Download now',
  downloadProgress: 'Download Progress'
})

const UpdaterView = () => {
  const cx = useStyles()
  const [update, setUpdate] = useUpdater()

  const downloadUpdateClick = () => {
    electronIpc.downloadUpdate()
    setUpdate({
      state: STATES.DOWNLOADING
    })
  }

  switch (update.state) {
    case STATES.AVAILABLE:
      return <UpdateAvailableView cx={cx} downloadUpdateClick={downloadUpdateClick} />
    case STATES.DOWNLOADING:
      return <DownloadProgressView cx={cx} />
    case STATES.PROGRESS:
      return <DownloadProgressView cx={cx} progress={update.updateInfo} />
    case STATES.READY_FOR_RESTART:
      return <div>Ready to restart</div> // TODO
    default: // STATES.IDLE
      return null
  }
}

const DownloadProgressView = ({ cx, progress }) => {
  const { formatMessage: t } = useIntl()

  return (
    <div className={cx.searchingWrapper}>
      <div className={cx.searching}>
        <div className={cx.searchingText}>
          <Typography gutterBottom variant='h2' className={cx.searchingTitle}>
            {t(m.downloadProgress)}
          </Typography>
          {progress}
        </div>
      </div>
    </div>
  )
}

const UpdateAvailableView = ({ cx, update, downloadUpdateClick }) => {
  const { formatMessage: t } = useIntl()
  return (
    <div className={cx.searchingWrapper}>
      <div className={cx.searching}>
        <div className={cx.searchingText}>
          <Typography gutterBottom variant='h2' className={cx.searchingTitle}>
            {t(m.updateAvailable)}
          </Typography>
          <Button
            onClick={downloadUpdateClick}
            variant='contained'
            size='large'
            color='primary'>
            {t(m.downloadButtonText)}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default UpdaterView

const useStyles = makeStyles(theme => ({
  searchingText: {
    maxWidth: 300,
    marginLeft: theme.spacing(2)
  },
  searchingWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    alignSelf: 'stretch',
    justifySelf: 'stretch'
  },
  searching: {
    color: '#00052b',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  searchingTitle: {
    fontSize: '2em',
    fontWeight: 400
  }
}))
