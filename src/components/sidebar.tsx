import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ThemeSwitch from './ThemeSwitch';

export default function Sidebar() {
  const [isHovered, setIsHovered] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const scrollTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isHovered && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        // Also check if click is on the gradient bar (which should open sidebar)
        const target = event.target as HTMLElement;
        if (target.closest('[data-sidebar-trigger]')) {
          return; // Don't close if clicking on trigger
        }
        setIsHovered(false);
      }
    };

    if (isHovered) {
      // Use a small delay to avoid immediate closing when clicking inside
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isHovered]);

  const navSections = [
    { id: 'home', label: t('nav.home'), href: '/', hash: '' },
    { id: 'about', label: t('nav.about'), href: '/', hash: 'about' },
    { id: 'projects', label: t('nav.projects'), href: '/', hash: 'projects' },
    { id: 'contact', label: t('nav.contact'), href: '/', hash: 'contact' },
  ];

  /**
   * Custom smooth scroll function with ease-in-out cubic easing
   * Uses requestAnimationFrame for smooth 60fps animation
   */
  const smoothScrollTo = useCallback((target: number, duration: number = 800): Promise<void> => {
    return new Promise((resolve) => {
      const scrollContainer = document.querySelector('main') as HTMLElement;
      if (!scrollContainer) {
        resolve();
        return;
      }
      
      // Cancel any ongoing scroll animation
      if (scrollTimeoutRef.current) {
        cancelAnimationFrame(scrollTimeoutRef.current);
      }
      
      const start = scrollContainer.scrollTop;
      const distance = target - start;
      let startTime: number | null = null;

      // Ease-in-out cubic function for smooth acceleration/deceleration
      const easeInOutCubic = (t: number): number => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };

      const animation = (currentTime: number) => {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        const ease = easeInOutCubic(progress);
        
        scrollContainer.scrollTop = start + distance * ease;
        
        if (timeElapsed < duration) {
          scrollTimeoutRef.current = requestAnimationFrame(animation);
        } else {
          scrollTimeoutRef.current = null;
          resolve();
        }
      };

      scrollTimeoutRef.current = requestAnimationFrame(animation);
    });
  }, []);

  /**
   * Scrolls to a section by hash ID with retry logic
   * Handles cases where DOM might not be ready yet
   */
  const scrollToSection = useCallback((hash: string): Promise<void> => {
    return new Promise((resolve) => {
      const attemptScroll = (): boolean => {
        const element = document.getElementById(hash);
        const scrollContainer = document.querySelector('main') as HTMLElement;
        
        if (element && scrollContainer) {
          // Use requestAnimationFrame to ensure DOM is ready
          requestAnimationFrame(() => {
            // Get bounding rects relative to viewport
            const elementRect = element.getBoundingClientRect();
            const containerRect = scrollContainer.getBoundingClientRect();
            
            // Calculate scroll position: current scroll + (element top - container top)
            const targetPosition = scrollContainer.scrollTop + (elementRect.top - containerRect.top);
            
            smoothScrollTo(targetPosition).then(() => resolve());
          });
          return true;
        }
        return false;
      };

      // Try immediately first
      if (attemptScroll()) return;

      // If element not found, wait a bit and retry
      let attempts = 0;
      const maxAttempts = 20;
      const interval = setInterval(() => {
        attempts++;
        if (attemptScroll() || attempts >= maxAttempts) {
          clearInterval(interval);
          if (attempts >= maxAttempts) {
            resolve(); // Resolve even if element not found to prevent hanging
          }
        }
      }, 100);
    });
  }, [smoothScrollTo]);

  /**
   * Handles hash changes from URL (browser back/forward, direct navigation)
   */
  useEffect(() => {
    if (location.pathname !== '/') return;

    const hash = location.hash.slice(1); // Remove the '#' symbol
    
    // Small delay to ensure DOM is ready after route change
    const timeoutId = setTimeout(() => {
      if (hash) {
        scrollToSection(hash);
      } else {
        smoothScrollTo(0);
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [location.pathname, location.hash, scrollToSection, smoothScrollTo]);

  /**
   * Cleanup function to cancel any ongoing scroll animations
   */
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        cancelAnimationFrame(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleSectionClick = useCallback((e: React.MouseEvent, section: typeof navSections[0]) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Close sidebar after a short delay to allow navigation
    setTimeout(() => {
      setIsHovered(false);
    }, 100);
    
    if (section.hash) {
      // Navigate to home first if not already there
      if (location.pathname !== '/') {
        navigate(`/#${section.hash}`, { replace: false });
      } else {
        // Already on home page, update hash and scroll
        navigate(`/#${section.hash}`, { replace: true });
        // Scroll will be handled by useEffect watching location.hash
      }
    } else {
      // Home section - navigate to top
      if (location.pathname !== '/') {
        navigate('/', { replace: false });
        // Scroll will be handled by useEffect watching location.hash
      } else {
        navigate('/', { replace: true });
        // Small delay to ensure hash is cleared
        setTimeout(() => {
          smoothScrollTo(0);
        }, 50);
      }
    }
  }, [location.pathname, navigate, smoothScrollTo]);

  const isActive = useCallback((section: typeof navSections[0]) => {
    if (location.pathname !== '/') return false;
    // Use React Router's location.hash for consistency
    const currentHash = location.hash.slice(1);
    if (!section.hash) {
      return !currentHash || currentHash === '';
    }
    return currentHash === section.hash;
  }, [location.pathname, location.hash]);

  return (
    <>
      {/* Gradient indicator bar */}
      <div
        data-sidebar-trigger
        className={`fixed left-0 top-0 h-full z-50 w-10 transition-opacity duration-300 ${
          isHovered ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          background: 'linear-gradient(to right, rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0))'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onClick={() => setIsHovered(true)}
      >
        {/* Arrow indicator */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <svg
            className="w-3 h-3 text-white"
            fill="currentColor"
            viewBox="0 0 185.343 185.343"
          >
            <path d="M51.707 185.343a10.7 10.7 0 0 1-7.593-3.149 10.724 10.724 0 0 1 0-15.175l74.352-74.347L44.114 18.32c-4.194-4.194-4.194-10.987 0-15.175 4.194-4.194 10.987-4.194 15.18 0l81.934 81.934c4.194 4.194 4.194 10.987 0 15.175l-81.934 81.939a10.68 10.68 0 0 1-7.587 3.15"/>
          </svg>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-lg z-40 transition-transform duration-300 ease-in-out ${
          isHovered ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '280px' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex flex-col text-xl align-middle justify-center gap-y-2 h-full p-6">
          {/* Navigation sections */}
          <nav className="flex-1 flex flex-col items-center justify-center gap-4">
            {navSections.map((section) => (
              <button
                key={section.id}
                onClick={(e) => handleSectionClick(e, section)}
                className={`w-full text-center block px-4 py-2 rounded-lg transition-colors ${
                  isActive(section)
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>

          {/* Theme toggle and language selector */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 space-y-3 text-lg">
            {/* Theme toggle */}
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('theme.toggle')}
              </span>
              <ThemeSwitch />
            </div>

            {/* Language selector */}
            <div className="flex items-center justify-between px-4 py-2">
              <label htmlFor="language-select" className="text-sm text-gray-600 dark:text-gray-400">
                {t('language.select')}
              </label>
              <select
                id="language-select"
                name="language"
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                className="px-2 py-1 text-sm rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
              >
                <option value="en">{t('language.en')}</option>
              </select>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

