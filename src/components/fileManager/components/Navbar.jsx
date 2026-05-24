import { useMemo } from 'react';
import { useFileManager } from '../context/FileManagerContext';

const Navbar = () => {
  const { fs, setCurrentFolder, onRefresh, onLogout } = useFileManager();

  const initialFolders = useMemo(() => {
    return fs.filter((f) => f.isDir && f.parentId === '0');
  }, [fs]);

  const handleClick = async (id) => {
    setCurrentFolder(id);
    if (onRefresh !== undefined) {
      try {
        await onRefresh(id);
      } catch (e) {
        throw new Error('Error during refresh');
      }
    }
  };

  return (
    <section className="rfm-navbar">
      <span onClick={() => setCurrentFolder('0')} className="rfm-navbar-root-link">
        Root
      </span>
      <ul className="rfm-navbar-list">
        {initialFolders.map((f) => (
          <li
            key={f.id}
            onClick={() => handleClick(f.id)}
            className="rfm-navbar-list-element"
          >
            {f.name}
          </li>
        ))}
      </ul>

      {/* Logout pinned to the bottom of the sidebar */}
      {onLogout && (
        <div className="rfm-navbar-footer">
          <button
            className="rfm-navbar-logout"
            type="button"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      )}
    </section>
  );
};

export default Navbar;
