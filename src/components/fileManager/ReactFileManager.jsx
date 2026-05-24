import { useState } from 'react';
import { FileManagerContext } from './context/FileManagerContext';
import { ViewStyle } from './types/index';
import Navbar from './components/Navbar';
import Workspace from './components/Workspace';

/**
 * ReactFileManager
 *
 * Props:
 *   fs            - FileSystemType (array of FileType objects)
 *   viewOnly      - boolean (optional)
 *   onDoubleClick - async (id: string) => void (optional)
 *   onRefresh     - async (id: string) => void (optional)
 *   onUpload      - async (fileData, folderId: string) => void (optional)
 *   onCreateFolder- async (folderName: string) => void (optional)
 *   onDelete      - async (fileId: string) => void (optional)
 *
 * FileType shape:
 *   { id: string, name: string, isDir: boolean, path?: string, parentId?: string, lastModified?: number }
 *
 * Root folder must have id "0".
 * Top-level items must have parentId "0".
 */
const ReactFileManager = ({
  fs,
  viewOnly,
  onDoubleClick,
  onRefresh,
  onUpload,
  onCreateFolder,
  onDelete,
  onDeleteMany,
  onDownloadMany,
  onDownloadItem,
  onRename,
  onLogout,
}) => {
  const [currentFolder, setCurrentFolder] = useState('0');
  const [uploadedFileData, setUploadedFileData] = useState(undefined);
  const [viewStyle, setViewStyle] = useState(ViewStyle.List);

  return (
    <FileManagerContext.Provider
      value={{
        fs,
        viewStyle,
        setViewStyle,
        viewOnly,
        currentFolder,
        setCurrentFolder,
        onDoubleClick,
        onRefresh,
        onUpload,
        onCreateFolder,
        onDelete,
        onDeleteMany,
        onDownloadMany,
        onDownloadItem,
        onRename,
        onLogout,
        uploadedFileData,
        setUploadedFileData,
      }}
    >
      <div className="rfm-main-container" style={{ flex: 1, minHeight: 0 }}>
        <Navbar />
        <Workspace />
      </div>
    </FileManagerContext.Provider>
  );
};

export default ReactFileManager;
