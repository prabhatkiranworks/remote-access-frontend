import { useState, useRef, useCallback } from 'react';
import { useFileManager } from '../context/FileManagerContext';
import SvgIcon from './SvgIcon';

const UploadFileModal = ({ isVisible, onClose }) => {
  const { onUpload, currentFolder } = useFileManager();

  const [files,     setFiles]     = useState([]); // [{ file, status, error }]
  const [uploading, setUploading] = useState(false);
  const [dragOver,  setDragOver]  = useState(false);
  const inputRef = useRef(null);

  // ── Add files (dedup by name) ─────────────────────────────────────────────
  const addFiles = useCallback((incoming) => {
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.file.name));
      const fresh = Array.from(incoming)
        .filter((f) => !existing.has(f.name))
        .map((f) => ({ file: f, status: 'pending', error: null }));
      return [...prev, ...fresh];
    });
  }, []);

  // ── Browse button ─────────────────────────────────────────────────────────
  const handleBrowseClick = (e) => {
    e.stopPropagation();
    inputRef.current.value = '';   // reset so same file can be picked again
    inputRef.current.click();
  };

  const handleInputChange = (e) => {
    if (e.target.files?.length) addFiles(e.target.files);
  };

  // ── Drag-and-drop onto the drop zone ─────────────────────────────────────
  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = ()  => setDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  // ── Remove a file from the list ───────────────────────────────────────────
  const removeFile = (index) =>
    setFiles((prev) => prev.filter((_, i) => i !== index));

  // ── Upload all pending files one by one ───────────────────────────────────
  const handleUpload = async () => {
    if (!files.length || uploading) return;
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'done') continue;

      setFiles((prev) =>
        prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f)
      );

      try {
        await onUpload(files[i].file, currentFolder);
        setFiles((prev) =>
          prev.map((f, idx) => idx === i ? { ...f, status: 'done' } : f)
        );
      } catch (err) {
        const msg = err?.response?.data?.message || err.message || 'Upload failed';
        setFiles((prev) =>
          prev.map((f, idx) => idx === i ? { ...f, status: 'error', error: msg } : f)
        );
      }
    }

    setUploading(false);
  };

  // ── Close ─────────────────────────────────────────────────────────────────
  const handleClose = () => {
    if (uploading) return;
    setFiles([]);
    setDragOver(false);
    onClose();
  };

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const doneCount    = files.filter((f) => f.status === 'done').length;
  const allDone      = files.length > 0 && doneCount === files.length;

  if (!isVisible) return null;

  return (
    /* Overlay — click outside to close */
    <div className="rfm-upload-overlay" onClick={handleClose}>

      {/* Panel — stop propagation so clicks inside don't close */}
      <div className="rfm-upload-panel" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="rfm-upload-panel-header">
          <span className="rfm-upload-panel-title">Upload Files</span>
          <button
            className="rfm-upload-panel-close"
            onClick={handleClose}
            type="button"
            disabled={uploading}
            aria-label="Close"
          >
            <SvgIcon svgType="close" className="rfm-upload-close-icon" />
          </button>
        </div>

        {/* ── Drop zone ── */}
        <div
          className={`rfm-upload-dropzone${dragOver ? ' rfm-upload-dropzone--active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Single hidden input — used for both browse and drop */}
          <input
            ref={inputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={handleInputChange}
          />

          <SvgIcon svgType="upload" className="rfm-upload-dropzone-icon" />

          <p className="rfm-upload-dropzone-text">
            {dragOver ? 'Drop files here…' : 'Drag & drop files here, or'}
          </p>

          {!dragOver && (
            <button
              className="rfm-upload-browse-btn"
              type="button"
              onClick={handleBrowseClick}
            >
              Browse files
            </button>
          )}
        </div>

        {/* ── File list ── */}
        {files.length > 0 && (
          <ul className="rfm-upload-file-list">
            {files.map((entry, i) => (
              <li
                key={i}
                className={`rfm-upload-file-item rfm-upload-file-item--${entry.status}`}
              >
                <SvgIcon svgType="file" className="rfm-upload-file-icon" />

                <span className="rfm-upload-file-name" title={entry.file.name}>
                  {entry.file.name}
                </span>

                <span className="rfm-upload-file-size">
                  {formatBytes(entry.file.size)}
                </span>

                {entry.status === 'pending'   && <span className="rfm-upload-badge rfm-upload-badge--pending">Pending</span>}
                {entry.status === 'uploading' && <span className="rfm-upload-badge rfm-upload-badge--uploading">Uploading…</span>}
                {entry.status === 'done'      && <span className="rfm-upload-badge rfm-upload-badge--done">✓ Done</span>}
                {entry.status === 'error'     && (
                  <span className="rfm-upload-badge rfm-upload-badge--error" title={entry.error}>
                    ✗ Error
                  </span>
                )}

                {entry.status !== 'uploading' && entry.status !== 'done' && (
                  <button
                    className="rfm-upload-remove-btn"
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                    title="Remove"
                  >
                    <SvgIcon svgType="close" className="rfm-upload-remove-icon" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* ── Footer ── */}
        <div className="rfm-upload-panel-footer">
          {files.length === 0 && !uploading && (
            <span className="rfm-upload-hint">No files selected yet</span>
          )}

          {files.length > 0 && !allDone && (
            <button
              className="rfm-upload-submit-btn"
              type="button"
              onClick={handleUpload}
              disabled={uploading || pendingCount === 0}
            >
              {uploading
                ? `Uploading… (${doneCount} / ${files.length})`
                : `Upload ${pendingCount} file${pendingCount !== 1 ? 's' : ''}`}
            </button>
          )}

          {allDone && (
            <button
              className="rfm-upload-done-btn"
              type="button"
              onClick={handleClose}
            >
              ✓ Done — Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default UploadFileModal;
