import { useTheme } from '@/contexts/ThemeContext';
import sunmoon from '@/assets/sunmoon.svg';

const ThemeSwitch = () => {
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  const handleKeyDown = (e: React.KeyboardEvent<HTMLLabelElement>) => {
    if (e.code === 'Space' || e.key === 'Enter') {
      e.preventDefault();
      toggleTheme();
    }
  };

  const handleLabelClick = (e: React.MouseEvent<HTMLLabelElement>) => {
    e.preventDefault();
    toggleTheme();
  };

  return (
    <label 
      className="relative inline-block w-14 h-7 transition-transform duration-300 ease-in-out hover:scale-110 focus-within:scale-110 focus-within:outline-none cursor-pointer"
      tabIndex={0} 
      onKeyDown={handleKeyDown}
      onClick={handleLabelClick}
      aria-label="Toggle theme"
    >
      <input 
        id="theme-toggle"
        name="theme-toggle"
        type="checkbox" 
        checked={isDarkMode} 
        onChange={toggleTheme} 
        onFocus={(e) => e.target.blur()}
        tabIndex={-1}
        readOnly
        className="sr-only"
        aria-label="Theme toggle checkbox"
      />
      <span className={`absolute inset-0 cursor-pointer rounded-full overflow-hidden select-none transition-colors duration-300 ease-in-out will-change-[background-color] ${
        isDarkMode ? 'bg-[#24305E]' : 'bg-[#A8D0E6]'
      }`}>
        <img 
          src={sunmoon} 
          alt="sunmoon" 
          width="56"
          height="56"
          className={`absolute w-14 h-14 pointer-events-none z-10 transition-transform duration-300 ease-in-out will-change-transform ${
            isDarkMode ? 'translate-x-[0.1rem] -translate-y-[2rem]' : 'translate-x-[0.2rem] -translate-y-[0.4rem]'
          }`}
          fetchPriority="high"
        />
        <span className={`absolute w-6 h-6 bg-white rounded-full top-1/2 left-0 transition-transform duration-300 ease-in-out z-10 will-change-transform ${
          isDarkMode ? 'translate-x-[115%] -translate-y-1/2' : 'translate-x-[15%] -translate-y-1/2'
        }`} />
      </span>
    </label>
  );
};

export default ThemeSwitch;