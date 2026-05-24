const NewFolderIcon = ({ onClick }) => {
  return (
    <div onClick={onClick} className="rfm-folder-icon-container">
      <span className="rfm-folder-icon-span">+</span>
    </div>
  );
};

export default NewFolderIcon;
