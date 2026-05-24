import { useRef } from 'react';
import { useFileManager } from '../context/FileManagerContext';
import CommonModal from './CommonModal';

const NewFolderModal = ({ isVisible, onClose }) => {
  const { onCreateFolder, currentFolder } = useFileManager();
  const folderName = useRef(null);

  const onConfirm = async () => {
    if (
      folderName.current &&
      folderName.current.value &&
      folderName.current.value.length > 0 &&
      onCreateFolder
    ) {
      await onCreateFolder(folderName.current.value, currentFolder);
      onClose();
    }
  };

  return (
    <CommonModal title="Create New Folder" isVisible={isVisible} onClose={onClose}>
      <div>
        <form className="rfm-new-folder-modal-form">
          <div>
            <input
              ref={folderName}
              type="text"
              className="rfm-new-folder-modal-input"
              placeholder="Folder Name"
              required
            />
          </div>
          <button
            onClick={onConfirm}
            type="submit"
            className="rfm-new-folder-modal-btn"
          >
            Create
          </button>
        </form>
      </div>
    </CommonModal>
  );
};

export default NewFolderModal;
