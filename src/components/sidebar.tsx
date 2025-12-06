import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ThemeSwitch from './ThemeSwitch';

export default function Sidebar() {
  const [isHovered, setIsHovered] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string>('home');
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

  const navSections = useMemo(() => ([
    { id: 'home', label: t('nav.home'), href: '/', hash: '' },
    { id: 'about', label: t('nav.about'), href: '/', hash: 'about' },
    { id: 'projects', label: t('nav.projects'), href: '/', hash: 'projects' },
    { id: 'skills', label: t('nav.skills'), href: '/', hash: 'skills' },
    { id: 'contact', label: t('nav.contact'), href: '/', hash: 'contact' },
  ]), [t]);

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

      // If there's nothing to scroll, resolve immediately to avoid blocking user scroll
      if (Math.abs(distance) < 1) {
        scrollContainer.scrollTop = target;
        resolve();
        return;
      }

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

    // Check if we're restoring scroll position from a project page (non-blocking)
    let isRestoringScroll = false;
    try {
      isRestoringScroll = !!sessionStorage.getItem('homeScrollPosition');
    } catch {
      // Ignore storage errors
    }
    if (isRestoringScroll) {
      // Don't trigger scroll animation, let Home component handle scroll restoration
      // Just update the active section based on current scroll position
      const scrollContainer = document.querySelector('main') as HTMLElement | null;
      if (scrollContainer) {
        // Let the scroll restoration happen first, then update active section
        setTimeout(() => {
          const containerRect = scrollContainer.getBoundingClientRect();
          let closestSectionId = 'home';
          let closestDistance = Infinity;

          for (const section of navSections) {
            const element = document.getElementById(section.id);
            if (!element) continue;

            const rect = element.getBoundingClientRect();
            const offset = rect.top - containerRect.top;
            const distance = Math.abs(offset);

            if (distance < closestDistance) {
              closestDistance = distance;
              closestSectionId = section.id;
            }
          }

          setActiveSectionId(closestSectionId);
        }, 300);
      }
      return;
    }

    const hash = location.hash.slice(1); // Remove the '#' symbol

    // Keep active section in sync with URL hash when navigating
    setActiveSectionId(hash || 'home');
    
    // Small delay to ensure DOM is ready after route change
    const timeoutId = setTimeout(() => {
      if (hash) {
        scrollToSection(hash);
      } else {
        // Avoid animated scroll on initial load so user can scroll immediately
        const scrollContainer = document.querySelector('main') as HTMLElement | null;
        if (scrollContainer) {
          scrollContainer.scrollTop = 0;
        }
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [location.pathname, location.hash, navSections, scrollToSection, smoothScrollTo]);

  /**
   * Track scroll position inside the main container and update active section
   */
  useEffect(() => {
    if (location.pathname !== '/') return;

    const scrollContainer = document.querySelector('main') as HTMLElement | null;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const containerRect = scrollContainer.getBoundingClientRect();

      let closestSectionId = 'home';
      let closestDistance = Infinity;

      for (const section of navSections) {
        const element = document.getElementById(section.id);
        if (!element) continue;

        const rect = element.getBoundingClientRect();
        const offset = rect.top - containerRect.top;
        const distance = Math.abs(offset);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestSectionId = section.id;
        }
      }

      setActiveSectionId((prev) => (prev === closestSectionId ? prev : closestSectionId));
    };

    // Initialize once on mount
    handleScroll();

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname, navSections]);

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

  const isActive = useCallback(
    (section: typeof navSections[0]) => {
      if (location.pathname !== '/') return false;
      return section.id === activeSectionId;
    },
    [location.pathname, activeSectionId],
  );

  return (
    <>
      {/* Gradient indicator bar */}
      <div
        data-sidebar-trigger
        className={`fixed left-0 top-0 h-full z-50
          w-10 sm:w-12 md:w-10 lg:w-16
          transition-opacity duration-300 ${
          isHovered ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          background: 'linear-gradient(to right, rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0))',
          maxWidth: '100vw'
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
        className={`fixed left-0 top-0 h-full w-64 md:w-72 lg:w-80 bg-sidebar border-r border-sidebar shadow-lg z-40 transition-transform duration-300 ease-in-out will-change-transform text-primary ${
          isHovered ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          contain: 'layout style paint',
          maxWidth: '100vw'
        }}
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
                className={`w-full text-center block px-4 py-2 rounded-lg transition-colors border border-transparent ${
                  isActive(section)
                    ? 'bg-surface-muted text-primary font-semibold border-default'
                    : 'text-secondary hover:bg-surface-muted'
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
              <span className="text-sm text-secondary">
                {t('theme.toggle')}
              </span>
              <ThemeSwitch />
            </div>

            {/* Language selector */}
            <div className="flex items-center justify-between px-4 py-2">
              <label htmlFor="language-select" className="text-sm text-secondary">
                {t('language.select')}
              </label>
              <select
                id="language-select"
                name="language"
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                className="px-2 py-1 text-sm rounded bg-surface border border-default text-primary"
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