import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useFileManager } from '../context/FileManagerContext';
import { ViewStyle } from '../types/index';
import FileIcon from './FileIcon';
import FolderPath from './FolderPath';
import UploadFileModal from './UploadFileModal';
import SvgIcon from './SvgIcon';

// ─── Row action buttons (download icon + 3-dot menu) ─────────────────────────
const RowMenu = ({ item, onDelete, onDownload }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="rfm-row-actions" ref={ref}>
      {/* Download icon — always shown on row hover */}
      <button
        className="rfm-row-icon-btn"
        title="Download"
        type="button"
        onClick={(e) => { e.stopPropagation(); onDownload(item); }}
      >
        <SvgIcon svgType="download" className="rfm-row-icon" />
      </button>

      {/* 3-dot menu trigger */}
      <button
        className="rfm-row-menu-trigger"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        type="button"
        title="More options"
      >
        ···
      </button>

      {open && (
        <div className="rfm-row-menu-dropdown">
          <button
            className="rfm-row-menu-item rfm-row-menu-item--danger"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDelete(item);
            }}
            type="button"
          >
            🗑 Delete
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Inline new-folder row (list view) ───────────────────────────────────────
const NewFolderRow = ({ onCommit, onCancel, colSpan }) => {
  const [name, setName] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const commit = () => { const t = name.trim(); if (t) onCommit(t); else onCancel(); };
  const onKeyDown = (e) => {
    if (e.key === 'Enter')  commit();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <tr className="rfm-workspace-list-icon-row rfm-new-folder-row">
      <td className="rfm-workspace-list-align-txt" colSpan={colSpan}>
        <div className="rfm-workspace-list-icon-td">
          <SvgIcon svgType="folder" className="rfm-workspace-list-icon" />
          <input
            ref={inputRef}
            className="rfm-inline-folder-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commit}
            onKeyDown={onKeyDown}
            placeholder="Folder name — Enter to confirm, Esc to cancel"
          />
        </div>
      </td>
    </tr>
  );
};

// ─── Inline rename cell ───────────────────────────────────────────────────────
const RenameCell = ({ row, onRename, selectionMode, checked, onCheck }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue]     = useState(row.original.name);
  const inputRef              = useRef(null);

  const startEdit = (e) => { e.stopPropagation(); setEditing(true); setTimeout(() => inputRef.current?.select(), 0); };
  const commit = async () => {
    setEditing(false);
    const trimmed = value.trim();
    if (trimmed && trimmed !== row.original.name && onRename) {
      try { await onRename(row.original.id, trimmed); }
      catch { setValue(row.original.name); }
    } else { setValue(row.original.name); }
  };
  const onKeyDown = (e) => {
    if (e.key === 'Enter')  commit();
    if (e.key === 'Escape') { setValue(row.original.name); setEditing(false); }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="rfm-rename-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <div className="rfm-workspace-list-icon-td">
      {/* Checkbox — only visible in selection mode */}
      {selectionMode && (
        <input
          type="checkbox"
          className="rfm-checkbox"
          checked={checked}
          onChange={(e) => { e.stopPropagation(); onCheck(row.original.id); }}
          onClick={(e) => e.stopPropagation()}
        />
      )}
      <SvgIcon
        svgType={row.original.isDir ? 'folder' : 'file'}
        className="rfm-workspace-list-icon"
      />
      <p className="rfm-item-name">{row.original.name}</p>
      {!selectionMode && onRename && (
        <button className="rfm-rename-btn" title="Rename" onClick={startEdit} type="button">✎</button>
      )}
    </div>
  );
};

// ─── Workspace ────────────────────────────────────────────────────────────────
const Workspace = () => {
  const {
    currentFolder, fs, viewStyle, viewOnly,
    setCurrentFolder,
    onDoubleClick, onRefresh, onRename, onCreateFolder,
    onDelete, onDeleteMany, onDownloadMany, onDownloadItem,
  } = useFileManager();

  const [addingFolder,           setAddingFolder]           = useState(false);
  const [uploadFileModalVisible, setUploadFileModalVisible] = useState(false);
  const [selectionMode,          setSelectionMode]          = useState(false);
  const [selectedIds,            setSelectedIds]            = useState([]);

  // Reset selection when folder changes — navigating away cancels selection mode
  useEffect(() => {
    setAddingFolder(false);
    setSelectionMode(false);
    setSelectedIds([]);
    setUploadFileModalVisible(false);
  }, [currentFolder]);

  const toggleSelectionMode = () => {
    setSelectionMode((v) => !v);
    setSelectedIds([]);
  };

  const toggleItem = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === currentFolderFiles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentFolderFiles.map((f) => f.id));
    }
  };

  // ── Upload drop — drag files onto workspace opens the upload panel ───────
  const setUploadModalVisible = (v) => {
    if (!viewOnly) setUploadFileModalVisible(v);
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (!viewOnly && acceptedFiles.length > 0) {
      setUploadFileModalVisible(true);
    }
  }, [viewOnly]);

  const onCloseUploadFileModal = () => {
    setUploadFileModalVisible(false);
  };

  const { getRootProps, isDragAccept } = useDropzone({ noClick: true, noKeyboard: true, onDrop });

  // ── Data ───────────────────────────────────────────────────────────────────
  const currentFolderFiles = useMemo(
    () => fs.filter((f) => f.parentId === currentFolder),
    [fs, currentFolder]
  );

  const handleNewFolderCommit = useCallback(async (folderName) => {
    setAddingFolder(false);
    if (onCreateFolder) {
      try { await onCreateFolder(folderName, currentFolder); } catch { /* handled upstream */ }
    }
  }, [onCreateFolder, currentFolder]);

  // ── Selection bulk actions ─────────────────────────────────────────────────
  const handleBulkDelete = useCallback(async () => {
    if (!selectedIds.length) return;
    if (onDeleteMany) {
      await onDeleteMany(selectedIds);
      setSelectedIds([]);
      setSelectionMode(false);
    }
  }, [selectedIds, onDeleteMany]);

  const handleBulkDownload = useCallback(async () => {
    if (!selectedIds.length) return;
    if (onDownloadMany) {
      await onDownloadMany(selectedIds);
    }
  }, [selectedIds, onDownloadMany]);

  // ── Single-item delete (from 3-dot menu) ──────────────────────────────────
  const handleSingleDelete = useCallback(async (item) => {
    if (onDelete) await onDelete(item.id);
  }, [onDelete]);

  // ── Single-item download (from download icon) ──────────────────────────────
  const handleSingleDownload = useCallback(async (item) => {
    if (onDownloadItem) await onDownloadItem(item.id);
  }, [onDownloadItem]);

  // ── Table columns ──────────────────────────────────────────────────────────
  const allChecked = currentFolderFiles.length > 0 && selectedIds.length === currentFolderFiles.length;

  const columns = useMemo(() => {
    const ch = createColumnHelper();
    const cols = [
      ch.accessor('name', {
        header: () => (
          selectionMode
            ? <input type="checkbox" className="rfm-checkbox" checked={allChecked} onChange={toggleAll} />
            : 'Name'
        ),
        cell: (info) => (
          <RenameCell
            row={info.row}
            onRename={viewOnly ? null : onRename}
            selectionMode={selectionMode}
            checked={selectedIds.includes(info.row.original.id)}
            onCheck={toggleItem}
          />
        ),
      }),
      ch.accessor('lastModified', {
        header: () => 'Last Modified',
        cell: (info) =>
          info.getValue()
            ? new Date(info.getValue() * 1000).toLocaleString()
            : 'N/A',
      }),
    ];

    // 3-dot actions column (hidden in viewOnly)
    if (!viewOnly) {
      cols.push(
        ch.display({
          id: 'actions',
          header: () => '',
          cell: (info) => (
            <RowMenu
              item={info.row.original}
              onDelete={handleSingleDelete}
              onDownload={handleSingleDownload}
            />
          ),
        })
      );
    }

    return cols;
  }, [onRename, viewOnly, selectionMode, selectedIds, allChecked, handleSingleDelete, handleSingleDownload]);

  const table = useReactTable({
    data: currentFolderFiles,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { sorting: [{ id: 'name', desc: false }] },
  });

  const handleRowClick = async (file) => {
    if (selectionMode) {
      toggleItem(file.id);
      return;
    }
    if (file.isDir) {
      setCurrentFolder(file.id);
      if (onRefresh) {
        try { await onRefresh(file.id); } catch { /* ignore */ }
      }
    }
  };

  const handleDoubleClick = (id) => {
    if (!selectionMode && onDoubleClick) onDoubleClick(id);
  };

  return (
    <section
      id="react-file-manager-workspace"
      className={`rfm-workspace ${isDragAccept && !viewOnly ? 'rfm-workspace-dropzone' : ''}`}
      {...getRootProps()}
    >
      <FolderPath
        selectionMode={selectionMode}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelectionMode}
        onDelete={handleBulkDelete}
        onDownload={handleBulkDownload}
      />

      <div className="rfm-workspace-file-listing">

        {/* ── Icons view ── */}
        {viewStyle === ViewStyle.Icons && (
          <>
            {currentFolderFiles.length === 0 && !addingFolder && (
              <div className="rfm-empty-folder">
                <span className="rfm-empty-folder-icon">📂</span>
                <p className="rfm-empty-folder-text">This folder is empty</p>
              </div>
            )}
            {currentFolderFiles.map((f) => (
              <div
                key={f.id}
                className={`rfm-icon-tile ${selectionMode && selectedIds.includes(f.id) ? 'rfm-icon-tile--selected' : ''}`}
                onClick={() => selectionMode ? toggleItem(f.id) : null}
                onDoubleClick={() => handleDoubleClick(f.id)}
              >
                {selectionMode && (
                  <input
                    type="checkbox"
                    className="rfm-checkbox rfm-icon-checkbox"
                    checked={selectedIds.includes(f.id)}
                    onChange={() => toggleItem(f.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                <FileIcon id={f.id} name={f.name} isDir={f.isDir} />
              </div>
            ))}

            {!viewOnly && addingFolder && (
              <div className="rfm-new-folder-tile">
                <SvgIcon svgType="folder" className="rfm-file-icon-svg" />
                <input
                  autoFocus
                  className="rfm-inline-folder-input rfm-inline-folder-input--tile"
                  placeholder="Folder name"
                  onBlur={(e) => { const t = e.target.value.trim(); if (t) handleNewFolderCommit(t); else setAddingFolder(false); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter')  { const t = e.target.value.trim(); if (t) handleNewFolderCommit(t); else setAddingFolder(false); }
                    if (e.key === 'Escape') setAddingFolder(false);
                  }}
                />
              </div>
            )}

            {!viewOnly && !addingFolder && (
              <div className="rfm-folder-icon-container" onClick={() => setAddingFolder(true)} title="New folder">
                <span className="rfm-folder-icon-span">+</span>
              </div>
            )}

            {!viewOnly && (
              <div
                className="rfm-folder-icon-container rfm-upload-tile"
                onClick={() => setUploadFileModalVisible(true)}
                title="Upload files"
              >
                <SvgIcon svgType="upload" className="rfm-upload-tile-icon" />
                <span className="rfm-upload-tile-label">Upload</span>
              </div>
            )}
          </>
        )}

        {/* ── List view ── */}
        {viewStyle === ViewStyle.List && (
          <>
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        className="rfm-workspace-list-th"
                        onClick={header.column.getToggleSortingHandler()}
                        style={header.id === 'actions' ? { width: '5rem' } : undefined}
                      >
                        <div className="rfm-workspace-list-th-content">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === 'desc' && <SvgIcon svgType="arrow-down" className="rfm-header-sort-icon" />}
                          {header.column.getIsSorted() === 'asc'  && <SvgIcon svgType="arrow-up"   className="rfm-header-sort-icon" />}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`rfm-workspace-list-icon-row ${selectionMode && selectedIds.includes(row.original.id) ? 'rfm-row--selected' : ''}`}
                    onClick={() => handleRowClick(row.original)}
                    onDoubleClick={() => handleDoubleClick(row.original.id)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="rfm-workspace-list-align-txt"
                        style={cell.column.id === 'actions' ? { width: '5rem', textAlign: 'right' } : undefined}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}

                {!viewOnly && addingFolder && (
                  <NewFolderRow
                    onCommit={handleNewFolderCommit}
                    onCancel={() => setAddingFolder(false)}
                    colSpan={columns.length}
                  />
                )}
              </tbody>
            </table>

            {!viewOnly && !addingFolder && (
              <button className="rfm-workspace-list-add-folder" onClick={() => setAddingFolder(true)}>
                + New Folder
              </button>
            )}

            {currentFolderFiles.length === 0 && !addingFolder && (
              <div className="rfm-empty-folder rfm-empty-folder--list">
                <span className="rfm-empty-folder-icon">📂</span>
                <p className="rfm-empty-folder-text">This folder is empty</p>
              </div>
            )}

            {!viewOnly && (
              <button
                className="rfm-workspace-list-upload-btn"
                onClick={() => setUploadFileModalVisible(true)}
              >
                ↑ Upload
              </button>
            )}
          </>
        )}

        {!viewOnly && (
          <UploadFileModal isVisible={uploadFileModalVisible} onClose={onCloseUploadFileModal} />
        )}
      </div>
    </section>
  );
};

export default Workspace;
