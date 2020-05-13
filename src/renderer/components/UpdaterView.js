import React, { useEffect, useState } from 'react'
import { LinearProgress, Typography, makeStyles } from '@material-ui/core'
import { defineMessages, useIntl } from 'react-intl'
import Button from '@material-ui/core/Button'
import electronIpc from '../electron-ipc'
import logger from '../../logger'
import FormattedDuration from 'react-intl-formatted-duration'

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
              updateInfo: null,
              progress: null,
              state: STATES.READY_FOR_RESTART
            })
            return
          case 'update-not-available':
            setUpdate({
              updateInfo: null,
              progress: null,
              state: STATES.IDLE
            })
            return
          case 'download-progress':
            setUpdate({
              progress: info.progress,
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

  console.log(update)

  switch (update.state) {
    case STATES.AVAILABLE:
      return <UpdateAvailableView cx={cx} downloadUpdateClick={downloadUpdateClick} />
    case STATES.DOWNLOADING:
      return <DownloadProgressView cx={cx} percent={0} update={update} />
    case STATES.PROGRESS:
      return <DownloadProgressView cx={cx} percent={update.progress.percent} update={update} />
    case STATES.READY_FOR_RESTART:
      return <div>Ready to restart</div> // TODO
    default: // STATES.IDLE
      return null
  }
}

const DownloadProgressView = ({ cx, update, percent }) => {
  const { formatMessage: t } = useIntl()

  /* TODO: TypeScript/Flow?
      {
        progress: {
          total: 141164463,
          delta: 1655048,
          transferred: 11384326,
          percent: 8.064583506402741,
          bytesPerSecond: 2244544
        }
      }
  */

  const progress = update.progress
  let estimatedTimeLeft

  if (progress) {
    estimatedTimeLeft = (progress.total - progress.transferred) / progress.bytesPerSecond
  } else {
    estimatedTimeLeft = Infinity
  }

  return (
    <div className={cx.searchingWrapper}>
      <div className={cx.searching}>
        <div className={cx.searchingText}>
          <Typography gutterBottom variant='h2' className={cx.searchingTitle}>
            {t(m.downloadProgress)}
          </Typography>
          <LinearProgress variant='determinate' value={percent} color='secondary' />
          <FormattedDuration seconds={estimatedTimeLeft} />
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
