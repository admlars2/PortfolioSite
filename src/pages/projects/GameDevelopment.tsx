import ProjectLayout from '@/components/ProjectLayout';
import TalesOfTinyImage from '@/assets/images/TalesOfTiny.png';
import Gif1 from '@/assets/images/TalesOfTiny/2_O0eW.gif';
import Gif2 from '@/assets/images/TalesOfTiny/XHmufh.gif';
import Gif3 from '@/assets/images/TalesOfTiny/3APttx.gif';
import Gif4 from '@/assets/images/TalesOfTiny/3jgc+a.gif';
import Image1 from '@/assets/images/TalesOfTiny/ICCk7Y.png';
import { useTranslation } from 'react-i18next';

export default function GameDevelopment() {
  const { t } = useTranslation();
  return (
    <ProjectLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-primary">
          {t('projects.gameDevelopment.title')}
        </h1>
        
        <div className="max-w-none">
          <div className="mb-8">
            <img 
              src={TalesOfTinyImage} 
              alt={t('projects.gameDevelopment.coverAlt')} 
              className="w-full h-auto rounded-lg shadow-lg"
              loading="lazy"
              decoding="async"
            />
          </div>

          <p className="text-lg text-secondary mb-4">
            {t('projects.gameDevelopment.intro1BeforeLink')}
            <a
              href="https://pifopifo.itch.io/the-tales-of-tiny"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline transition-colors"
            >
              Tales of Tiny
            </a>
            {t('projects.gameDevelopment.intro1AfterLink')}
          </p>

          <p className="text-lg text-secondary mb-4">
            {t('projects.gameDevelopment.intro2')}
          </p>

          <p className="text-lg text-secondary mb-4">
            {t('projects.gameDevelopment.intro3')}
          </p>

          {/* Gameplay Gallery */}
          <div className="my-8">
            <h2 className="text-2xl font-bold mb-4 text-primary">
              {t('projects.gameDevelopment.gameplayHeading')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="rounded-lg overflow-hidden shadow-lg bg-card">
                <img 
                  src={Gif1} 
                  alt={t('projects.gameDevelopment.gifAlt1')} 
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
              <div className="rounded-lg overflow-hidden shadow-lg bg-card">
                <img 
                  src={Gif2} 
                  alt={t('projects.gameDevelopment.gifAlt2')} 
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
              <div className="rounded-lg overflow-hidden shadow-lg bg-card">
                <img 
                  src={Gif3} 
                  alt={t('projects.gameDevelopment.gifAlt3')} 
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
              <div className="rounded-lg overflow-hidden shadow-lg bg-card">
                <img 
                  src={Gif4} 
                  alt={t('projects.gameDevelopment.gifAlt4')} 
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="rounded-lg overflow-hidden shadow-lg bg-card">
              <img 
                src={Image1} 
                alt={t('projects.gameDevelopment.screenshotAlt')} 
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          </div>

          <p className="text-lg text-secondary mb-4">
            {t('projects.gameDevelopment.body1')}
          </p>

          <p className="text-lg text-secondary mb-4">
            {t('projects.gameDevelopment.body2')}{' '}
            <a
              href="https://pifopifo.itch.io/the-tales-of-tiny"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline transition-colors"
            >
              Tales of Tiny
            </a>
            .
          </p>

          <p className="text-lg text-secondary mb-6">
            {t('projects.gameDevelopment.conclusion')}
          </p>
        </div>
      </div>
    </ProjectLayout>
  );
}