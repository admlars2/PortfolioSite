import ProjectLayout from '@/components/ProjectLayout';
import InitialDesignImage from '@/assets/images/KanjiTrainer/initial_design.png';
import FrontImage from '@/assets/images/KanjiTrainer/front.png';
import BackImage from '@/assets/images/KanjiTrainer/back.png';
import KanjiTrainerExampleGif from '@/assets/images/KanjiTrainer/kanjitrainerexample.gif';
import { useTranslation } from 'react-i18next';

export default function KanjiTrainerForRaspberryPi() {
  const { t } = useTranslation();

  return (
    <ProjectLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
          {t('projects.kanjiTrainer.title')}
        </h1>
        
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            {t('projects.kanjiTrainer.intro')}
          </p>

          {/* Visual Overview */}
          <div className="my-8 not-prose">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              {t('projects.kanjiTrainer.visualOverviewHeading')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="rounded-lg overflow-hidden shadow-lg bg-gray-100 dark:bg-gray-800">
                <img
                  src={InitialDesignImage}
                  alt={t('projects.kanjiTrainer.altInitialDesign')}
                  className="w-full h-auto"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="rounded-lg overflow-hidden shadow-lg bg-gray-100 dark:bg-gray-800">
                <img
                  src={FrontImage}
                  alt={t('projects.kanjiTrainer.altFrontInterface')}
                  className="w-full h-auto"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-lg overflow-hidden shadow-lg bg-gray-100 dark:bg-gray-800">
                <img
                  src={BackImage}
                  alt={t('projects.kanjiTrainer.altBackInterface')}
                  className="w-full h-auto"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="rounded-lg overflow-hidden shadow-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <img
                  src={KanjiTrainerExampleGif}
                  alt={t('projects.kanjiTrainer.altExampleGif')}
                  className="w-full h-auto"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">
            {t('projects.kanjiTrainer.technicalHeading')}
          </h2>
          
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            {t('projects.kanjiTrainer.technicalBody')}
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">
            {t('projects.kanjiTrainer.developmentHeading')}
          </h2>
          
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            {t('projects.kanjiTrainer.developmentBody1')}
          </p>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            {t('projects.kanjiTrainer.developmentBody2')}
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">
            {t('projects.kanjiTrainer.performanceHeading')}
          </h2>
          
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            {t('projects.kanjiTrainer.performanceBody')}
          </p>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            {t('projects.kanjiTrainer.conclusion')}
          </p>
        </div>
      </div>
    </ProjectLayout>
  );
}

