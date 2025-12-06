import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import ValorantStatsImage from '@/assets/images/ValorantStats.png';
import TalesOfTinyImage from '@/assets/images/TalesOfTiny.png';
import DiscordTwitterImage from '@/assets/images/DiscordTwitter.png';
import KanjiTrainerFrontImage from '@/assets/images/KanjiTrainer/front.png';
import AzureIoTHubImage from '@/assets/images/AzureIoTHub.png';
import TreeBackground from '@/components/TreeBackground';

interface Project {
  id: string;
  title: string;
  description: string;
  route: string;
  image?: string;
  imageAlt?: string;
  emoji?: string;
  imagePosition?: 'left' | 'right';
  imageFit?: 'cover' | 'contain';
}

interface Skill {
  emoji: string;
  name: string;
  experience: string;
}

const GitHubIcon = () => (
  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

const LinkedInIcon = () => (
  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const SECTION_SPACING = 'px-4 py-20 sm:py-24';
const SECTION_CONTAINER = 'max-w-6xl mx-auto';
const PROJECT_IMAGE_HEIGHTS = 'h-64 sm:h-72 md:h-[360px] lg:h-[420px]';

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const projectMediaMap: Record<string, Pick<Project, 'image' | 'imageAlt' | 'imageFit'>> = useMemo(() => ({
    'kanji-trainer': { image: KanjiTrainerFrontImage },
    'tales-of-tiny': { image: TalesOfTinyImage },
    'iot-simulator': { image: AzureIoTHubImage },
    'valorant-analysis': { image: ValorantStatsImage },
    'discord-bots': { image: DiscordTwitterImage, imageFit: 'contain' },
  }), []);

  const projects = useMemo(() => {
    const items = t('home.projects.items', { returnObjects: true }) as Project[];
    return items.map((item) => ({
      ...item,
      ...projectMediaMap[item.id],
      imageAlt: item.imageAlt ?? projectMediaMap[item.id]?.imageAlt ?? item.title,
    }));
  }, [projectMediaMap, t]);

  const skills = useMemo(() => t('home.skills.items', { returnObjects: true }) as Skill[], [t]);
  const socialLinks = useMemo(() => t('home.contact.socialLinks', { returnObjects: true }) as { name: string; url: string }[], [t]);
  const resolvedSocialLinks = useMemo(
    () => socialLinks.map((link) => {
      const normalized = link.name.toLowerCase();
      const icon = normalized.includes('github')
        ? GitHubIcon
        : normalized.includes('linkedin')
          ? LinkedInIcon
          : undefined;
      return { ...link, icon };
    }),
    [socialLinks],
  );

  // Preload LCP image (first project image)
  React.useEffect(() => {
    // LangLift doesn't have an image, so skip preload for now
    // If an image is added later, update this
  }, []);

  // Restore scroll position when returning to home page
  // Use location.pathname as dependency to detect navigation back to home
  React.useEffect(() => {
    // Only restore if we're on the home page and have a saved scroll position
    if (location.pathname !== '/') return;

    const mainElement = document.querySelector('main');
    if (!mainElement) return;

    // Try to restore scroll position from sessionStorage
    const savedScroll = sessionStorage.getItem('homeScrollPosition');
    if (savedScroll) {
      const scrollValue = parseInt(savedScroll, 10);
      let attempts = 0;
      const maxAttempts = 100; // Increased attempts for more reliable restoration
      
      // Use multiple attempts to ensure scroll restoration works
      // This handles cases where content might still be loading
      const restoreScroll = () => {
        attempts++;
        const currentScrollHeight = mainElement.scrollHeight;
        
        if (currentScrollHeight >= scrollValue || attempts >= maxAttempts) {
          // Restore scroll position
          mainElement.scrollTop = Math.min(scrollValue, currentScrollHeight);
          // Clear the saved position after restoring
          sessionStorage.removeItem('homeScrollPosition');
        } else {
          // If content isn't tall enough yet, try again
          requestAnimationFrame(restoreScroll);
        }
      };
      
      // Start restoration after multiple animation frames to ensure DOM is ready
      // and React Router has finished rendering
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(restoreScroll);
        });
      });
    }
  }, [location.pathname]);

  const handleProjectClick = (route: string, e?: React.MouseEvent) => {
    // Prevent any default behavior
    e?.preventDefault();
    e?.stopPropagation();
    
    // Use pageshow event for back/forward cache compatibility
    const mainElement = document.querySelector('main');
    if (mainElement) {
      // Store scroll position but don't block cache
      try {
        sessionStorage.setItem('homeScrollPosition', mainElement.scrollTop.toString());
      } catch {
        // Ignore storage errors
      }
    }
    // Use replace: false to ensure proper navigation
    navigate(route, { replace: false });
  };

  const renderProjectImage = (project: Project, index: number) => {
    if (project.image) {
      const imageFit = project.imageFit || 'cover';
      const baseContainer = `w-full md:w-1/2 flex-shrink-0 overflow-hidden rounded-lg shadow-md ${PROJECT_IMAGE_HEIGHTS}`;
      const containerClass = imageFit === 'contain'
        ? `${baseContainer} flex items-center justify-center bg-surface-muted`
        : baseContainer;
      const imageClass = imageFit === 'contain'
        ? 'max-h-full w-full object-contain'
        : 'h-full w-full object-cover';
      
      // First image should have high priority for LCP
      const fetchPriority = index === 0 ? 'high' : 'auto';
      const loading = index === 0 ? 'eager' : 'lazy';
      
      // Use aspect ratio to prevent layout shift (16:9 is common for project images)
      // Height is controlled by PROJECT_IMAGE_HEIGHTS class
      return (
        <div className={containerClass} style={{ aspectRatio: '16/9' }}>
          <img 
            src={project.image} 
            alt={project.imageAlt || project.title} 
            className={imageClass}
            loading={loading}
            decoding="async"
            fetchPriority={fetchPriority}
            width="800"
            height="450"
            style={{ aspectRatio: '16/9' }}
          />
        </div>
      );
    }
    if (project.emoji) {
      return (
        <div className={`w-full md:w-1/2 ${PROJECT_IMAGE_HEIGHTS} bg-surface-muted flex items-center justify-center rounded-lg shadow-md`}>
          <span className="text-secondary text-4xl">{project.emoji}</span>
        </div>
      );
    }
    return null;
  };

  const renderProjectContent = (project: Project) => (
    <div className="w-full md:w-1/2 p-8 space-y-6 flex flex-col justify-center">
      <h3 className="text-2xl font-bold mb-4 text-primary">{project.title}</h3>
      <p className="text-lg text-secondary">{project.description}</p>
      <button
        onClick={(e) => handleProjectClick(project.route, e)}
        className="btn-primary inline-block px-6 py-3 rounded-lg font-semibold shadow-md"
        type="button"
      >
        {t('home.projects.learnMore')}
      </button>
    </div>
  );

  return (
    <div className="w-full overflow-x-hidden space-y-16 sm:space-y-20 bg-app text-primary">
      {/* Home Section */}
      <section
        id="home"
        className="min-h-screen flex items-center justify-center px-4 py-12 hero-overlay relative"
      >
        <TreeBackground seed={42} />
        <div className="text-center space-y-4 max-w-3xl mx-auto relative z-10">
          <h1 className="text-5xl font-bold text-primary">
            {t('home.hero.title')}
          </h1>
          <p className="text-xl text-secondary">
            {t('home.hero.subtitle')}
          </p>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className={`${SECTION_SPACING} bg-surface-muted`}>
        <div className={`${SECTION_CONTAINER} space-y-8`}>
          <h2 className="text-4xl font-bold text-center text-primary">
            {t('home.about.heading')}
          </h2>
          <div className="bg-card rounded-2xl shadow-lg p-8">
            <p className="text-lg text-secondary leading-relaxed">
              {t('home.about.body')}
            </p>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className={`${SECTION_SPACING} md:px-10`}>
        <div className="max-w-screen-2xl mx-auto space-y-12">
          <h2 className="text-4xl font-bold text-center text-primary">
            {t('home.projects.heading')}
          </h2>
          
          <div className="space-y-10">
            {projects.map((project, index) => (
              <div
                key={project.id}
                className={`flex flex-col gap-8 bg-card rounded-2xl shadow-lg overflow-hidden md:items-stretch transition-colors ${
                  project.imagePosition === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'
                }`}
              >
                {renderProjectImage(project, index)}
                {renderProjectContent(project)}
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Skills Section */}
      <section id="skills" className={`${SECTION_SPACING} bg-surface-muted`}>
        <div className={`${SECTION_CONTAINER}`}>
          <h2 className="text-4xl font-bold mb-4 text-center text-primary">
            {t('home.skills.heading')}
          </h2>
          <p className="text-center text-lg text-secondary mb-12">
            {t('home.skills.intro')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill) => (
              <div
                key={skill.name}
                className="bg-card rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow"
              >
                <div className="text-4xl mb-4">{skill.emoji}</div>
                <h3 className="text-xl font-bold mb-2 text-primary">{skill.name}</h3>
                <p className="text-secondary">{skill.experience}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className={`${SECTION_SPACING} bg-surface-muted`}>
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-4xl font-bold text-center text-primary">
            {t('home.contact.heading')}
          </h2>
          <p className="text-center text-lg text-secondary">
            {t('home.contact.intro')}
          </p>
          
          <div className="bg-card rounded-lg shadow-lg p-8">
            <ul className="space-y-6">
              <li>
                <h3 className="text-xl font-semibold mb-2 text-primary">{t('home.contact.emailLabel')}</h3>
                <a 
                  href={`mailto:${t('home.contact.emailValue')}?subject=Contact Request`} 
                  className="text-accent hover:underline text-lg transition-colors"
                >
                  {t('home.contact.emailValue')}
                </a>
              </li>
              <li>
                <h3 className="text-xl font-semibold mb-2 text-primary">{t('home.contact.discordLabel')}</h3>
                <span className="text-lg text-secondary">{t('home.contact.discordValue')}</span>
              </li>
              <li>
                <h3 className="text-xl font-semibold mb-4 text-primary">{t('home.contact.socialLabel')}</h3>
                <ul className="flex gap-4">
                  {resolvedSocialLinks.map((link) => {
                    const IconComponent = link.icon || GitHubIcon;
                    return (
                      <li key={link.name}>
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-secondary hover:text-accent transition-colors text-2xl"
                          aria-label={link.name}
                        >
                          <span className="sr-only">{link.name}</span>
                          <IconComponent />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

