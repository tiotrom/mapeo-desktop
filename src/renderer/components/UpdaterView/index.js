import React from 'react'
import { LinearProgress, Typography, makeStyles } from '@material-ui/core'
import { defineMessages, useIntl } from 'react-intl'
import Button from '@material-ui/core/Button'
import FormattedDuration from 'react-intl-formatted-duration'

import electronIpc from '../../electron-ipc'

export const STATES = {
  IDLE: 0,
  AVAILABLE: 1,
  DOWNLOADING: 2,
  PROGRESS: 3,
  READY_FOR_RESTART: 4
}

const m = defineMessages({
  // Title on sync screen when searching for devices
  updateAvailable: 'Update Available',
  updateNotAvailable: 'Mapeo is up to date! You are on the latest version.',
  downloadButtonText: 'Download now',
  calculatingProgress: 'Estimating...',
  downloadProgress: 'Download Progress',
  restartMapeoText: 'An update to Mapeo has been downloaded. Restart Mapeo to update.',
  restartMapeoButton: 'Restart Mapeo'
})

export const MiniUpdaterView = ({ update }) => {
  const cx = useStyles()
  const { formatMessage: t } = useIntl()

  var internal = function () {
    switch (update.state) {
      case STATES.AVAILABLE:
        return <Typography>{t(m.updateAvailable)}</Typography>
      case STATES.DOWNLOADING:
        return <Typography>{t(m.calculatingProgress)}</Typography>
      case STATES.PROGRESS:
        return <DownloadProgressView cx={cx} percent={update.progress.percent} update={update} />
      case STATES.READY_FOR_RESTART:
        return <Typography>{t(m.restartMapeoButton)}</Typography>
      default: // STATES.IDLE, STATES.UPDATE_NOT_AVAILABLE:
        return null
    }
  }

  return <div className={cx.miniUpdaterView}>{internal()}</div>
}

export const UpdaterView = ({ update, setUpdate }) => {
  const cx = useStyles()
  const { formatMessage: t } = useIntl()

  const downloadUpdateClick = () => {
    setUpdate({
      state: STATES.DOWNLOADING
    })
    electronIpc.downloadUpdate()
  }

  var internal = function () {
    switch (update.state) {
      case STATES.AVAILABLE:
        return (
          <UpdateAvailableView cx={cx}>
            <Button
              onClick={downloadUpdateClick}
              variant='contained'
              size='large'
              color='primary'>
              {t(m.downloadButtonText)}
            </Button>
          </UpdateAvailableView>
        )
      case STATES.DOWNLOADING:
        return <Typography>{t(m.calculatingProgress)}</Typography>
      case STATES.PROGRESS:
        return <DownloadProgressView cx={cx} percent={update.progress.percent} update={update} />
      case STATES.READY_FOR_RESTART:
        return <RestartView cx={cx} />
      case STATES.UPDATE_NOT_AVAILABLE:
        return <UpdateNotAvailableView cx={cx} />
      default: // STATES.IDLE
        return null
    }
  }

  return (
    <div className={cx.root}>
      <div className={cx.searchingWrapper}>
        <div className={cx.searching}>
          {internal()}
        </div>
      </div>
    </div>
  )
}

const RestartView = ({ cx }) => {
  const { formatMessage: t } = useIntl()
  return (
    <div className={cx.searchingText}>
      <Typography gutterBottom variant='h2' className={cx.searchingTitle}>
        {t(m.restartMapeoText)}
      </Typography>
    </div>
  )
}

const DownloadProgressView = ({ cx, update, percent }) => {
  /*
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
    estimatedTimeLeft = progress.total ? (progress.total - progress.transferred) / progress.bytesPerSecond : 0
  }

  return (
    <div className={cx.searchingText}>
      <LinearProgress variant='determinate' value={percent} color='secondary' />
      <Typography>
        {estimatedTimeLeft && <FormattedDuration seconds={estimatedTimeLeft} />}
      </Typography>
    </div>
  )
}

const UpdateAvailableView = ({ cx, update, children }) => {
  const { formatMessage: t } = useIntl()
  return (
    <div className={cx.searchingText}>
      <Typography gutterBottom variant='h2' className={cx.searchingTitle}>
        {t(m.updateAvailable)}
      </Typography>
      {children}
    </div>
  )
}

const UpdateNotAvailableView = ({ cx, update, downloadUpdateClick }) => {
  const { formatMessage: t } = useIntl()
  return (
    <div className={cx.searchingText}>
      <Typography gutterBottom variant='h2' className={cx.searchingTitle}>
        {t(m.updateNotAvailable)}
      </Typography>
    </div>
  )
}

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
  },
  root: {
    height: '100%',
    width: '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#F5F5F5'
  }
}))
