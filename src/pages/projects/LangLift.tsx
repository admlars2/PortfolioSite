import ProjectLayout from '@/components/ProjectLayout';
import { useTranslation } from 'react-i18next';

export default function LangLift() {
  const { t } = useTranslation();
  return (
    <ProjectLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
          {t('projects.langLift.title')}
        </h1>
        
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            {t('projects.langLift.summary')}
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">
            {t('projects.langLift.architectureHeading')}
          </h2>
          
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            {t('projects.langLift.architectureBody1')}
          </p>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            {t('projects.langLift.architectureBody2')}
          </p>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            {t('projects.langLift.architectureBody3')}
          </p>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            {t('projects.langLift.architectureBody4')}
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">
            {t('projects.langLift.studySystemHeading')}
          </h2>
          
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            {t('projects.langLift.studySystemBody1')}
          </p>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            {t('projects.langLift.studySystemBody2')}
          </p>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            {t('projects.langLift.studySystemBody3')}
          </p>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            {t('projects.langLift.studySystemBody4')}
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">
            {t('projects.langLift.quickStudyHeading')}
          </h2>
          
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            {t('projects.langLift.quickStudyBody1')}
          </p>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            {t('projects.langLift.quickStudyBody2')}
          </p>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            {t('projects.langLift.quickStudyBody3')}
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">
            {t('projects.langLift.moderationHeading')}
          </h2>
          
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            {t('projects.langLift.moderationBody1')}
          </p>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            {t('projects.langLift.moderationBody2')}
          </p>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            {t('projects.langLift.moderationBody3')}
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">
            {t('projects.langLift.verificationHeading')}
          </h2>
          
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            {t('projects.langLift.verificationBody1')}
          </p>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            {t('projects.langLift.verificationBody2')}
          </p>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            {t('projects.langLift.verificationBody3')}
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">
            {t('projects.langLift.resilienceHeading')}
          </h2>
          
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            {t('projects.langLift.resilienceBody1')}
          </p>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            {t('projects.langLift.resilienceBody2')}
          </p>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            {t('projects.langLift.resilienceBody3')}
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">
            {t('projects.langLift.conclusionHeading')}
          </h2>
          
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            {t('projects.langLift.conclusion')}
          </p>
        </div>
      </div>
    </ProjectLayout>
  );
}

