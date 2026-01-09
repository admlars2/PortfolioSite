import ProjectLayout from '@/components/ProjectLayout';
import { useTranslation } from 'react-i18next';

export default function HerbSearchProject() {
  const { t } = useTranslation();
  return (
    <ProjectLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-primary">
          {t('projects.herbSearch.title')}
        </h1>
        
        <div className="prose dark:prose-invert max-w-none">
          <div className="mb-8 bg-card rounded-lg p-6 border border-default">
            <p className="text-lg text-secondary mb-4">
              {t('projects.herbSearch.intro1')}
            </p>
            <p className="text-lg text-secondary mb-4">
              <span className="font-semibold text-secondary">
                {t('projects.herbSearch.playLink')}
              </span>
              {' '}
              {t('projects.herbSearch.intro2')}
            </p>
          </div>

          <h2 className="text-2xl font-bold mb-4 text-primary mt-8">
            {t('projects.herbSearch.gameplayHeading')}
          </h2>
          <p className="text-lg text-secondary mb-4">
            {t('projects.herbSearch.gameplayBody1')}
          </p>
          <p className="text-lg text-secondary mb-4">
            {t('projects.herbSearch.gameplayBody2')}
          </p>

          <h2 className="text-2xl font-bold mb-4 text-primary mt-8">
            {t('projects.herbSearch.technicalHeading')}
          </h2>
          <p className="text-lg text-secondary mb-4">
            {t('projects.herbSearch.technicalBody1')}
          </p>
          <p className="text-lg text-secondary mb-4">
            {t('projects.herbSearch.technicalBody2')}
          </p>

          <h2 className="text-2xl font-bold mb-4 text-primary mt-8">
            {t('projects.herbSearch.featuresHeading')}
          </h2>
          <ul className="list-disc list-inside space-y-2 text-lg text-secondary mb-4">
            <li>{t('projects.herbSearch.feature1')}</li>
            <li>{t('projects.herbSearch.feature2')}</li>
            <li>{t('projects.herbSearch.feature3')}</li>
            <li>{t('projects.herbSearch.feature4')}</li>
            <li>{t('projects.herbSearch.feature5')}</li>
            <li>{t('projects.herbSearch.feature6')}</li>
          </ul>

          <h2 className="text-2xl font-bold mb-4 text-primary mt-8">
            {t('projects.herbSearch.backendHeading')}
          </h2>
          <p className="text-lg text-secondary mb-4">
            {t('projects.herbSearch.backendBody1')}
          </p>
          <p className="text-lg text-secondary mb-6">
            {t('projects.herbSearch.backendBody2')}
          </p>

          <div className="mt-8 p-6 bg-card rounded-lg border border-default">
            <p className="text-lg text-secondary mb-4">
              {t('projects.herbSearch.conclusion')}
            </p>
            <div className="inline-block px-6 py-3 rounded-lg font-semibold shadow-md mt-4 bg-surface-muted text-secondary">
              {t('projects.herbSearch.playButton')}
            </div>
          </div>
        </div>
      </div>
    </ProjectLayout>
  );
}

