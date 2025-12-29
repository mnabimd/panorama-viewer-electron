import type { ProgressInfo } from 'electron-updater'
import { useCallback, useEffect, useState } from 'react'
import { Download, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import Modal from '@/components/update/Modal'
import Progress from '@/components/update/Progress'
import './update.css'

const Update = () => {
  const [checking, setChecking] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [versionInfo, setVersionInfo] = useState<VersionInfo>()
  const [updateError, setUpdateError] = useState<ErrorType>()
  const [progressInfo, setProgressInfo] = useState<Partial<ProgressInfo>>()
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [modalBtn, setModalBtn] = useState<{
    cancelText?: string
    okText?: string
    onCancel?: () => void
    onOk?: () => void
  }>({
    onCancel: () => setModalOpen(false),
    onOk: () => window.ipcRenderer.invoke('start-download'),
  })

  const checkUpdate = async () => {
    setChecking(true)
    /**
     * @type {import('electron-updater').UpdateCheckResult | null | { message: string, error: Error }}
     */
    const result = await window.ipcRenderer.invoke('check-update')
    setProgressInfo({ percent: 0 })
    setChecking(false)
    setModalOpen(true)
    if (result?.error) {
      setUpdateAvailable(false)
      setUpdateError(result?.error)
    }
  }

  const onUpdateCanAvailable = useCallback((_event: Electron.IpcRendererEvent, arg1: VersionInfo) => {
    setVersionInfo(arg1)
    setUpdateError(undefined)
    // Can be update
    if (arg1.update) {
      setModalBtn(state => ({
        ...state,
        cancelText: 'Cancel',
        okText: 'Update',
        onOk: () => window.ipcRenderer.invoke('start-download'),
      }))
      setUpdateAvailable(true)
    } else {
      setUpdateAvailable(false)
    }
  }, [])

  const onUpdateError = useCallback((_event: Electron.IpcRendererEvent, arg1: ErrorType) => {
    setUpdateAvailable(false)
    setUpdateError(arg1)
  }, [])

  const onDownloadProgress = useCallback((_event: Electron.IpcRendererEvent, arg1: ProgressInfo) => {
    setProgressInfo(arg1)
  }, [])

  const onUpdateDownloaded = useCallback((_event: Electron.IpcRendererEvent, ...args: any[]) => {
    setProgressInfo({ percent: 100 })
    setModalBtn(state => ({
      ...state,
      cancelText: 'Later',
      okText: 'Install now',
      onOk: () => window.ipcRenderer.invoke('quit-and-install'),
    }))
  }, [])

  useEffect(() => {
    // Get version information and whether to update
    window.ipcRenderer.on('update-can-available', onUpdateCanAvailable)
    window.ipcRenderer.on('update-error', onUpdateError)
    window.ipcRenderer.on('download-progress', onDownloadProgress)
    window.ipcRenderer.on('update-downloaded', onUpdateDownloaded)

    return () => {
      window.ipcRenderer.off('update-can-available', onUpdateCanAvailable)
      window.ipcRenderer.off('update-error', onUpdateError)
      window.ipcRenderer.off('download-progress', onDownloadProgress)
      window.ipcRenderer.off('update-downloaded', onUpdateDownloaded)
    }
  }, [])

  return (
    <>
      <Modal
        open={modalOpen}
        title={
          updateError 
            ? 'Update Error' 
            : updateAvailable 
              ? 'Update Available' 
              : 'Check for Updates'
        }
        cancelText={modalBtn?.cancelText}
        okText={modalBtn?.okText}
        onCancel={modalBtn?.onCancel}
        onOk={modalBtn?.onOk}
        footer={updateAvailable ? /* hide footer during download */null : undefined}
      >
        <div className='modal-slot'>
          {updateError ? (
            <div className='error-message'>
              <div className='error-title'>
                <AlertCircle size={18} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Error downloading the latest version
              </div>
              <p>{updateError.message}</p>
            </div>
          ) : updateAvailable ? (
            <div className='update-info'>
              <div className='version-display'>
                <Download size={20} style={{ display: 'inline', marginRight: '0.5rem', color: '#f97316' }} />
                New version available: <span className='version-highlight'>v{versionInfo?.newVersion}</span>
              </div>
              
              <div className='version-transition'>
                v{versionInfo?.version} <ArrowRight size={16} /> v{versionInfo?.newVersion}
              </div>
              
              <div className='update-progress-section'>
                <span className='progress-label'>Download progress:</span>
                <Progress percent={progressInfo?.percent} />
              </div>
              
              {progressInfo?.percent === 100 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', marginTop: '1rem' }}>
                  <CheckCircle size={18} />
                  <span>Download complete! Ready to install.</span>
                </div>
              )}
            </div>
          ) : (
            <div className='no-update-message'>
              <div className='no-update-title'>
                <CheckCircle size={20} style={{ display: 'inline', marginRight: '0.5rem', color: '#10b981' }} />
                You're up to date!
              </div>
              <p>
                Current version: <span className='current-version'>v{versionInfo?.version || '1.0.0'}</span>
              </p>
            </div>
          )}
        </div>
      </Modal>
      <button disabled={checking} onClick={checkUpdate}>
        {checking ? 'Checking...' : 'Check update'}
      </button>
    </>
  )
}

export default Update

