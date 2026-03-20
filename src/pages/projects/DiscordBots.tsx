import ProjectLayout from '@/components/ProjectLayout';
import DiscordTwitterImage from '@/assets/images/DiscordTwitter.png';
import { useTranslation } from 'react-i18next';

export default function DiscordBots() {
  const { t } = useTranslation();
  return (
    <ProjectLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-primary">
          {t('projects.discordBots.title')}
        </h1>
        
        <div className="max-w-none">
          <div className="mb-8">
            <img 
              src={DiscordTwitterImage} 
              alt={t('projects.discordBots.coverAlt')} 
              className="w-full h-auto rounded-lg shadow-lg"
              loading="lazy"
              decoding="async"
            />
          </div>

          <p className="text-lg text-secondary mb-4">
            {t('projects.discordBots.intro1')}
          </p>
          
          <p className="text-lg text-secondary mb-4">
            {t('projects.discordBots.intro2')}
          </p>
          
          <p className="text-lg text-secondary mb-6">
            {t('projects.discordBots.intro3')}
          </p>
        </div>
      </div>
    </ProjectLayout>
  );
}

