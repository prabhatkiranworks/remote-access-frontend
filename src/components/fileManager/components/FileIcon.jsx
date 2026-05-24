import { useMemo } from 'react';
import { useFileManager } from '../context/FileManagerContext';
import SvgIcon from './SvgIcon';

const FileIcon = ({ id, name, isDir }) => {
  const { setCurrentFolder, onRefresh } = useFileManager();

  const handleClick = async () => {
    if (isDir) {
      setCurrentFolder(id);
      if (onRefresh !== undefined) {
        try {
          await onRefresh(id);
        } catch (e) {
          throw new Error('Error during refresh');
        }
      }
    }
  };

  const fileExtension = useMemo(() => {
    if (!name.includes('.')) return '';
    const parts = name.split('.');
    return `.${parts[parts.length - 1]}`;
  }, [id, name]);

  return (
    <div onClick={handleClick} className="rfm-file-icon-container">
      <SvgIcon svgType={isDir ? 'folder' : 'file'} className="rfm-file-icon-svg" />
      <span className="rfm-file-icon-extension">{fileExtension}</span>
      <span className="rfm-file-icon-name">{name}</span>
    </div>
  );
};

export default FileIcon;
