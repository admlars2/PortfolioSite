import ProjectLayout from '@/components/ProjectLayout';
import { useTranslation } from 'react-i18next';

export default function IotSensorSimulatorWithAzureIotHub() {
  const { t } = useTranslation();
  return (
    <ProjectLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-primary">
          {t('projects.iotSimulator.title')}
        </h1>
        
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-lg text-secondary mb-4">
            {t('projects.iotSimulator.intro')}
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-primary">
            {t('projects.iotSimulator.devHeading')}
          </h2>
          
          <p className="text-lg text-secondary mb-4">
            {t('projects.iotSimulator.devBody')}
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-primary">
            {t('projects.iotSimulator.teamHeading')}
          </h2>
          
          <p className="text-lg text-secondary mb-4">
            {t('projects.iotSimulator.teamBody')}
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-primary">
            {t('projects.iotSimulator.featuresHeading')}
          </h2>
          
          <p className="text-lg text-secondary mb-4">
            {t('projects.iotSimulator.featuresBody')}
          </p>

          <p className="text-lg text-secondary mb-6">
            {t('projects.iotSimulator.conclusion')}
          </p>
        </div>
      </div>
    </ProjectLayout>
  );
}

