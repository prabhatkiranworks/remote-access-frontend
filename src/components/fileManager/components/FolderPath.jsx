import { useMemo } from 'react';
import { useFileManager } from '../context/FileManagerContext';
import { ViewStyle } from '../types/index';
import SvgIcon from './SvgIcon';

const FolderPath = ({ selectionMode, selectedIds, onToggleSelect, onDelete, onDownload }) => {
  const { fs, currentFolder, setCurrentFolder, viewStyle, setViewStyle } = useFileManager();

  const goUp = () => {
    const info = fs.find((f) => f.id === currentFolder);
    if (info?.parentId) setCurrentFolder(info.parentId);
  };

  const parentPath = useMemo(() => {
    const parentId = fs.find((f) => f.id === currentFolder)?.parentId;
    if (!parentId) return '';
    const parentDir = fs.find((f) => f.id === parentId);
    if (!parentDir?.path) return '';
    return parentDir.path.slice(-1) === '/' ? parentDir.path : `${parentDir.path}/`;
  }, [fs, currentFolder]);

  const currentPath = useMemo(() => {
    const info = fs.find((f) => f.id === currentFolder);
    return info ? info.name : '';
  }, [fs, currentFolder]);

  const hasSelection = selectedIds.length > 0;

  return (
    <div className="rfm-workspace-header">
      {/* Left: back arrow + breadcrumb */}
      <div className="rfm-folder-path-container">
        <SvgIcon svgType="arrow-up" onClick={goUp} className="rfm-folder-path-svg" />
        <span className="rfm-folder-path-span">
          {parentPath}<b>{currentPath}</b>
        </span>
      </div>

      {/* Right: action area */}
      <div className="rfm-header-right">
        {/* Selection action buttons — shown when items are selected */}
        {selectionMode && hasSelection && (
          <div className="rfm-selection-actions">
            <span className="rfm-selection-count">{selectedIds.length} selected</span>
            <button
              className="rfm-action-btn rfm-action-btn--download"
              onClick={onDownload}
              title="Download selected"
              type="button"
            >
              ↓ Download
            </button>
            <button
              className="rfm-action-btn rfm-action-btn--delete"
              onClick={onDelete}
              title="Delete selected"
              type="button"
            >
              🗑 Delete
            </button>
          </div>
        )}

        {/* Select toggle button */}
        <button
          className={`rfm-select-toggle ${selectionMode ? 'rfm-select-toggle--active' : ''}`}
          onClick={onToggleSelect}
          type="button"
          title={selectionMode ? 'Cancel selection' : 'Select items'}
        >
          {selectionMode ? 'Cancel' : 'Select'}
        </button>

        {/* View style switcher */}
        <div className="rfm-header-container">
          <SvgIcon
            svgType="list"
            className={`rfm-header-icon ${viewStyle === ViewStyle.List ? 'rfm-header-icon--selected' : ''}`}
            onClick={() => setViewStyle(ViewStyle.List)}
          />
          <SvgIcon
            svgType="icons"
            className={`rfm-header-icon ${viewStyle === ViewStyle.Icons ? 'rfm-header-icon--selected' : ''}`}
            onClick={() => setViewStyle(ViewStyle.Icons)}
          />
        </div>
      </div>
    </div>
  );
};

export default FolderPath;
