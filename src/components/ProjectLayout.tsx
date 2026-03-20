import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';

interface ProjectLayoutProps {
  children: ReactNode;
}

export default function ProjectLayout({ children }: ProjectLayoutProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Scroll to top when project page mounts
  useEffect(() => {
    const mainElement = document.querySelector('main');
    if (!mainElement) return;

    requestAnimationFrame(() => {
      mainElement.scrollTop = 0;
    });
  }, []);

  const handleBack = useCallback(() => {
    navigate('/', { replace: false });
  }, [navigate]);

  return (
    <div className="h-full w-full flex flex-col bg-app text-primary">
      <div className="sticky top-0 z-50 bg-sidebar border-b border-sidebar flex-shrink-0 transition-colors">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 p-4 text-secondary hover:text-accent transition-colors font-medium"
          aria-label={t('project.back')}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span>{t('project.back')}</span>
        </button>
      </div>
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}