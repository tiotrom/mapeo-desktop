import React, { useEffect, useState } from 'react'
import { makeStyles } from '@material-ui/core'
import electronIpc from '../electron-ipc'

function useUpdater () {
  const [update, setUpdate] = useState(null)

  useEffect(
    () => {
      const updateListener = electronIpc.addUpdateAvailableListener(({
        version, files, releaseDate
      }) => {
        setUpdate({
          version,
          releaseDate,
          size: files.map((file) => file.size).reduce((a, b) => a + b, 0)
        })
      })
      return () => {
        if (updateListener) updateListener.remove()
      }
    },
    []
  )

  return update
}

const UpdateAvailableView = () => {
  const cx = useStyles()
  const update = useUpdater()

  return (
    <div className={update ? cx.root : cx.hidden}>
      {!update ? 'No update available. All up to date!' : renderUpdateAvailableView(update)}
    </div>
  )
}

const renderUpdateAvailableView = (update) => {
  return <div>
    {update.version}, {update.releaseDate}, {update.size}
  </div>
}

export default UpdateAvailableView

const useStyles = makeStyles(theme => ({
  root: {
    height: '100%',
    width: '100%',
    position: 'relative',
    display: 'fixed',
    top: '0',
    left: '0',
    backgroundColor: '#F5F5F5',
    color: 'black'
  },
  hidden: {
    display: 'none'
  }
}))
