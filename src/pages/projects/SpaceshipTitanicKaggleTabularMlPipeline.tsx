import ProjectLayout from '@/components/ProjectLayout';
import { useTranslation } from 'react-i18next';

export default function SpaceshipTitanicKaggleTabularMlPipeline() {
  const { t } = useTranslation();

  return (
    <ProjectLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-primary">
          {t('projects.spaceshipTitanic.title')}
        </h1>

        <div className="max-w-none">
          <p className="text-lg text-secondary mb-6">
            {t('projects.spaceshipTitanic.summary')}
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-primary">
            {t('projects.spaceshipTitanic.pipelineHeading')}
          </h2>
          <p className="text-lg text-secondary mb-4">
            {t('projects.spaceshipTitanic.pipelineBody1')}
          </p>
          <p className="text-lg text-secondary mb-6">
            {t('projects.spaceshipTitanic.pipelineBody2')}
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-primary">
            {t('projects.spaceshipTitanic.featuresHeading')}
          </h2>
          <ul className="list-disc list-inside space-y-2 text-lg text-secondary mb-6">
            <li>{t('projects.spaceshipTitanic.feature1')}</li>
            <li>{t('projects.spaceshipTitanic.feature2')}</li>
            <li>{t('projects.spaceshipTitanic.feature3')}</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-primary">
            {t('projects.spaceshipTitanic.modelsHeading')}
          </h2>
          <p className="text-lg text-secondary mb-4">
            {t('projects.spaceshipTitanic.modelsBody1')}
          </p>
          <p className="text-lg text-secondary mb-6">
            {t('projects.spaceshipTitanic.modelsBody2')}
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-primary">
            {t('projects.spaceshipTitanic.resultsHeading')}
          </h2>
          <p className="text-lg text-secondary mb-6">
            {t('projects.spaceshipTitanic.resultsBody')}
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-primary">
            {t('projects.spaceshipTitanic.reproHeading')}
          </h2>
          <p className="text-lg text-secondary mb-6">
            {t('projects.spaceshipTitanic.reproBody')}
          </p>
        </div>
      </div>
    </ProjectLayout>
  );
}
