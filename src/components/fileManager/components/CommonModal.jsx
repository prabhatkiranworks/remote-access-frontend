import Draggable from 'react-draggable';
import SvgIcon from './SvgIcon';

const CommonModal = ({ children, title, isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <Draggable bounds="#react-file-manager-workspace">
      <div className="rfm-modal-container">
        <div>
          <h3 className="rfm-modal-title">{title}</h3>
          <SvgIcon onClick={onClose} svgType="close" className="rfm-modal-icon" />
        </div>
        {children}
      </div>
    </Draggable>
  );
};

export default CommonModal;
