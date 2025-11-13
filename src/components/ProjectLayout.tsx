import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';

interface ProjectLayoutProps {
  children: ReactNode;
}

export default function ProjectLayout({ children }: ProjectLayoutProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="h-full w-full flex flex-col">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 p-4 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
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
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}

