import ProjectLayout from '@/components/ProjectLayout';
import { useTranslation } from 'react-i18next';
import CoverImage from '@/assets/images/SpaceshipTitanic/cover.png';
import TargetBalanceImage from '@/assets/images/SpaceshipTitanic/01_target_balance.png';
import CryoSleepEffectImage from '@/assets/images/SpaceshipTitanic/02_cryosleep_effect.png';
import SpendDistributionImage from '@/assets/images/SpaceshipTitanic/03_spend_distribution.png';
import HomePlanetRateImage from '@/assets/images/SpaceshipTitanic/04_transport_by_homeplanet.png';
import GroupSizeRateImage from '@/assets/images/SpaceshipTitanic/05_transport_by_groupsize.png';
import CatBoostImportanceImage from '@/assets/images/SpaceshipTitanic/06_catboost_top20.png';
import HgbPermutationImage from '@/assets/images/SpaceshipTitanic/07_hgb_permutation_top20.png';

interface FigureProps {
  src: string;
  alt: string;
  caption: string;
}

function Figure({ src, alt, caption }: FigureProps) {
  return (
    <figure className="rounded-lg overflow-hidden shadow-lg bg-card">
      <img
        src={src}
        alt={alt}
        className="w-full h-auto bg-white"
        loading="lazy"
        decoding="async"
      />
      <figcaption className="px-4 py-3 text-sm text-secondary border-t border-sidebar">
        {caption}
      </figcaption>
    </figure>
  );
}

export default function SpaceshipTitanicKaggleTabularMlPipeline() {
  const { t } = useTranslation();

  return (
    <ProjectLayout>
      <div className="max-w-6xl mx-auto">
        <div className="rounded-lg overflow-hidden shadow-lg mb-8 bg-card">
          <img
            src={CoverImage}
            alt={t('projects.spaceshipTitanic.altCover')}
            className="w-full h-auto"
            loading="eager"
            decoding="async"
          />
        </div>

        <h1 className="text-4xl font-bold mb-6 text-primary">
          {t('projects.spaceshipTitanic.title')}
        </h1>

        <div className="max-w-none">
          <p className="text-lg text-secondary mb-4">
            {t('projects.spaceshipTitanic.summary')}
          </p>

          <p className="text-lg text-secondary mb-6">
            {t('projects.spaceshipTitanic.kaggleLinkBefore')}
            <a
              href="https://www.kaggle.com/competitions/spaceship-titanic"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline transition-colors"
            >
              {t('projects.spaceshipTitanic.kaggleLinkText')}
            </a>
            {t('projects.spaceshipTitanic.kaggleLinkAfter')}
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-primary">
            {t('projects.spaceshipTitanic.edaHeading')}
          </h2>
          <p className="text-lg text-secondary mb-6">
            {t('projects.spaceshipTitanic.edaIntro')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Figure
              src={TargetBalanceImage}
              alt={t('projects.spaceshipTitanic.altTargetBalance')}
              caption={t('projects.spaceshipTitanic.captionTargetBalance')}
            />
            <Figure
              src={CryoSleepEffectImage}
              alt={t('projects.spaceshipTitanic.altCryoSleep')}
              caption={t('projects.spaceshipTitanic.captionCryoSleep')}
            />
            <Figure
              src={SpendDistributionImage}
              alt={t('projects.spaceshipTitanic.altSpendDistribution')}
              caption={t('projects.spaceshipTitanic.captionSpendDistribution')}
            />
            <Figure
              src={HomePlanetRateImage}
              alt={t('projects.spaceshipTitanic.altHomePlanet')}
              caption={t('projects.spaceshipTitanic.captionHomePlanet')}
            />
          </div>

          <div className="mb-8">
            <Figure
              src={GroupSizeRateImage}
              alt={t('projects.spaceshipTitanic.altGroupSize')}
              caption={t('projects.spaceshipTitanic.captionGroupSize')}
            />
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Figure
              src={CatBoostImportanceImage}
              alt={t('projects.spaceshipTitanic.altCatBoostImportance')}
              caption={t('projects.spaceshipTitanic.captionCatBoostImportance')}
            />
            <Figure
              src={HgbPermutationImage}
              alt={t('projects.spaceshipTitanic.altHgbPermutation')}
              caption={t('projects.spaceshipTitanic.captionHgbPermutation')}
            />
          </div>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-primary">
            {t('projects.spaceshipTitanic.resultsHeading')}
          </h2>
          <p className="text-lg text-secondary mb-6">
            {t('projects.spaceshipTitanic.resultsBody')}
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-primary">
            {t('projects.spaceshipTitanic.takeawaysHeading')}
          </h2>
          <ul className="list-disc list-inside space-y-2 text-lg text-secondary mb-6">
            <li>{t('projects.spaceshipTitanic.takeaway1')}</li>
            <li>{t('projects.spaceshipTitanic.takeaway2')}</li>
            <li>{t('projects.spaceshipTitanic.takeaway3')}</li>
          </ul>

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
