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
        <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
          {t('projects.gameDevelopment.title')}
        </h1>
        
        <div className="prose dark:prose-invert max-w-none">
          <div className="mb-8">
            <img 
              src={TalesOfTinyImage} 
              alt={t('projects.gameDevelopment.coverAlt')} 
              className="w-full h-auto rounded-lg shadow-lg"
              loading="lazy"
              decoding="async"
            />
          </div>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            {t('projects.gameDevelopment.intro1BeforeLink')}
            <a
              href="https://pifopifo.itch.io/the-tales-of-tiny"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Tales of Tiny
            </a>
            {t('projects.gameDevelopment.intro1AfterLink')}
          </p>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            {t('projects.gameDevelopment.intro2')}
          </p>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            {t('projects.gameDevelopment.intro3')}
          </p>

          {/* Gameplay Gallery */}
          <div className="my-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              {t('projects.gameDevelopment.gameplayHeading')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="rounded-lg overflow-hidden shadow-lg bg-gray-100 dark:bg-gray-800">
                <img 
                  src={Gif1} 
                  alt={t('projects.gameDevelopment.gifAlt1')} 
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
              <div className="rounded-lg overflow-hidden shadow-lg bg-gray-100 dark:bg-gray-800">
                <img 
                  src={Gif2} 
                  alt={t('projects.gameDevelopment.gifAlt2')} 
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
              <div className="rounded-lg overflow-hidden shadow-lg bg-gray-100 dark:bg-gray-800">
                <img 
                  src={Gif3} 
                  alt={t('projects.gameDevelopment.gifAlt3')} 
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
              <div className="rounded-lg overflow-hidden shadow-lg bg-gray-100 dark:bg-gray-800">
                <img 
                  src={Gif4} 
                  alt={t('projects.gameDevelopment.gifAlt4')} 
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="rounded-lg overflow-hidden shadow-lg bg-gray-100 dark:bg-gray-800">
              <img 
                src={Image1} 
                alt={t('projects.gameDevelopment.screenshotAlt')} 
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          </div>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            For this project, my main role was the level designer. So for the beginning of the project, I ended up leading the discussion about what type of game everyone wanted to make. At first, we were all giving a large range of ideas, but I had to take all of those ideas and put them together to make a game that we could feasibly finish within the 6 week time frame that we had been given.
            After I collected everyone's ideas and came up with a solid idea of what we wanted to do, I got to work with creating the blacklight, which presented a couple of challenges because of the way that unity handles light. The main issue was that light in unity is that it does actually tell other objects that it is interacting with it, so I had to put together a solution using HLSL to get the effect that I wanted.
            Then I had to design all of the rooms including a hedge maze and a tiled train puzzle where the player has to rotate tracks and get the right solution. Finally, after putting everything together, you can find the game that my team produced at this link: <a href="https://pifopifo.itch.io/the-tales-of-tiny" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">Tales of Tiny</a>.
          </p>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            Overall, I had a lot of fun learning to code using HLSL and creating fun but difficult puzzles.
          </p>
        </div>
      </div>
    </ProjectLayout>
  );
}