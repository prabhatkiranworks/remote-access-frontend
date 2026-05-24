import { useState, useEffect, useCallback } from 'react'
import ReactFileManager from '../fileManager/ReactFileManager'
import '../fileManager/fileManager.css'
import {
  listDirectory,
  createFolder,
  uploadFile,
  downloadFile,
  downloadZip,
  deleteItems,
  renameItem,
  triggerBlobDownload,
} from '../../common/api'

// ─── helpers ──────────────────────────────────────────────────────────────────

function mapItems(items, parentId) {
  return items.map((item) => ({
    id:      item.path,
    name:    item.name,
    isDir:   item.type === 'DIRECTORY',
    path:    item.path,
    parentId,
  }))
}

function mergeFs(prevFs, newItems, parentId) {
  return [
    ...prevFs.filter((f) => f.parentId !== parentId),
    ...newItems,
  ]
}

// ─── component ────────────────────────────────────────────────────────────────

export default function Dashboard({ onLogout }) {
  const [fs,      setFs]      = useState([{ id: '0', name: 'Root', isDir: true, path: '', parentId: null }])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  // ── confirm dialog state ──────────────────────────────────────────────────
  // { ids: string[], names: string[], parentId: string } | null
  const [pendingDelete, setPendingDelete] = useState(null)

  const loadFolder = useCallback(async (apiPath, parentId) => {
    setError('')
    try {
      const items = await listDirectory(apiPath)
      setFs((prev) => mergeFs(prev, mapItems(items, parentId), parentId))
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load folder.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadFolder('', '0') }, [loadFolder])

  const handleRefresh = useCallback(async (id) => {
    await loadFolder(id === '0' ? '' : id, id)
  }, [loadFolder])

  const handleCreateFolder = useCallback(async (folderName, currentFolderId) => {
    const parentPath = currentFolderId === '0' ? '' : currentFolderId
    const newPath    = parentPath ? `${parentPath}/${folderName}` : folderName
    await createFolder(newPath)
    await loadFolder(parentPath, currentFolderId)
  }, [loadFolder])

  const handleUpload = useCallback(async (fileData, currentFolderId) => {
    const folderPath = currentFolderId === '0' ? '' : currentFolderId
    await uploadFile(fileData, folderPath)
    await loadFolder(folderPath, currentFolderId)
  }, [loadFolder])

  const handleDownloadItem = useCallback(async (itemId) => {
    const item = fs.find((f) => f.id === itemId)
    if (!item) return
    try {
      if (item.isDir) {
        const res = await downloadZip([item.path])
        triggerBlobDownload(res, `${item.name}.zip`)
      } else {
        const res = await downloadFile(item.path)
        triggerBlobDownload(res, item.name)
      }
    } catch (err) {
      console.error('[Dashboard] download error', err)
    }
  }, [fs])

  const handleDoubleClick = useCallback(async (itemId) => {
    const item = fs.find((f) => f.id === itemId)
    if (!item || item.isDir) return
    try {
      const res = await downloadFile(item.path)
      triggerBlobDownload(res, item.name)
    } catch (err) {
      console.error('[Dashboard] download error', err)
    }
  }, [fs])

  const handleRename = useCallback(async (itemId, newName) => {
    await renameItem(itemId, newName)
    const item = fs.find((f) => f.id === itemId)
    if (item) await loadFolder(item.parentId === '0' ? '' : item.parentId, item.parentId)
  }, [fs, loadFolder])

  // ── Delete — show confirm dialog first ───────────────────────────────────

  // Called by Workspace for single item (3-dot menu)
  const handleDelete = useCallback((itemId) => {
    const item = fs.find((f) => f.id === itemId)
    if (!item) return
    setPendingDelete({ ids: [itemId], names: [item.name], parentId: item.parentId })
  }, [fs])

  // Called by Workspace for bulk selection
  const handleDeleteMany = useCallback((ids) => {
    const items = ids.map((id) => fs.find((f) => f.id === id)).filter(Boolean)
    if (!items.length) return
    const parentId = items[0].parentId
    setPendingDelete({ ids, names: items.map((i) => i.name), parentId })
  }, [fs])

  // Confirmed — one API call for all paths
  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return
    const { ids, parentId } = pendingDelete
    setPendingDelete(null)

    const paths = ids.map((id) => fs.find((f) => f.id === id)?.path).filter(Boolean)
    try {
      await deleteItems(paths)
      // Remove deleted items and their children from local state immediately
      setFs((prev) => prev.filter((f) => !ids.includes(f.id) && !ids.includes(f.parentId)))
      // Reload the parent folder
      await loadFolder(parentId === '0' ? '' : parentId, parentId)
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Delete failed.')
    }
  }, [pendingDelete, fs, loadFolder])

  const cancelDelete = () => setPendingDelete(null)

  // ── Download many ─────────────────────────────────────────────────────────
  const handleDownloadMany = useCallback(async (ids) => {
    const paths = ids.map((id) => fs.find((f) => f.id === id)?.path).filter(Boolean)
    if (!paths.length) return
    try {
      const res = await downloadZip(paths)
      triggerBlobDownload(res, 'archive.zip')
    } catch (err) {
      console.error('[Dashboard] zip download error', err)
    }
  }, [fs])

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main style={shellStyle}>
        <div style={centerStyle}>Loading files…</div>
      </main>
    )
  }

  return (
    <main style={shellStyle}>
      {error && (
        <div style={errorBannerStyle}>
          {error}
          <button onClick={() => setError('')} style={errorCloseStyle}>×</button>
        </div>
      )}

      <ReactFileManager
        fs={fs}
        onRefresh={handleRefresh}
        onCreateFolder={handleCreateFolder}
        onUpload={handleUpload}
        onDoubleClick={handleDoubleClick}
        onDownloadItem={handleDownloadItem}
        onRename={handleRename}
        onDelete={handleDelete}
        onDeleteMany={handleDeleteMany}
        onDownloadMany={handleDownloadMany}
        onLogout={onLogout}
      />

      {/* ── Confirm delete dialog ── */}
      {pendingDelete && (
        <ConfirmDeleteDialog
          names={pendingDelete.names}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </main>
  )
}

// ─── Confirm delete dialog ────────────────────────────────────────────────────

function ConfirmDeleteDialog({ names, onConfirm, onCancel }) {
  const count = names.length
  const label = count === 1
    ? `"${names[0]}"`
    : `${count} items`

  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        <div style={dialogIconStyle}>🗑</div>
        <h3 style={dialogTitleStyle}>Delete {label}?</h3>
        <p style={dialogBodyStyle}>
          {count === 1
            ? 'This will permanently delete the item and all its contents.'
            : `This will permanently delete all ${count} selected items and their contents.`}
          <br />This action cannot be undone.
        </p>
        <div style={dialogActionsStyle}>
          <button style={cancelBtnStyle} onClick={onCancel} type="button">
            Cancel
          </button>
          <button style={deleteBtnStyle} onClick={onConfirm} type="button">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const shellStyle      = { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }
const centerStyle     = { margin: 'auto', fontSize: '0.95rem', color: '#6b7280' }
const errorBannerStyle = { background: '#fee2e2', color: '#b91c1c', padding: '0.5rem 1rem', fontSize: '0.875rem', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
const errorCloseStyle  = { background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c', fontSize: '1.1rem', lineHeight: 1 }

const overlayStyle = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.4)',
  zIndex: 2000,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}
const dialogStyle = {
  background: '#fff',
  borderRadius: '0.75rem',
  boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
  padding: '2rem',
  width: '380px',
  maxWidth: '90vw',
  textAlign: 'center',
}
const dialogIconStyle   = { fontSize: '2.5rem', marginBottom: '0.5rem' }
const dialogTitleStyle  = { margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700, color: '#111827' }
const dialogBodyStyle   = { margin: '0 0 1.5rem', fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.6 }
const dialogActionsStyle = { display: 'flex', gap: '0.75rem', justifyContent: 'center' }
const cancelBtnStyle = {
  padding: '0.5rem 1.25rem', borderRadius: '0.5rem',
  border: '1px solid #d1d5db', background: '#fff',
  color: '#374151', fontWeight: 600, fontSize: '0.875rem',
  cursor: 'pointer',
}
const deleteBtnStyle = {
  padding: '0.5rem 1.25rem', borderRadius: '0.5rem',
  border: 'none', background: '#ef4444',
  color: '#fff', fontWeight: 600, fontSize: '0.875rem',
  cursor: 'pointer',
}
