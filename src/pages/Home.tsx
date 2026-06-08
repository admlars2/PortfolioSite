import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import ValorantStatsImage from '@/assets/images/ValorantStats.png';
import TalesOfTinyImage from '@/assets/images/TalesOfTiny.png';
import DiscordTwitterImage from '@/assets/images/DiscordTwitter.png';
import KanjiTrainerFrontImage from '@/assets/images/KanjiTrainer/front.png';
import AzureIoTHubImage from '@/assets/images/AzureIoTHub.png';
import SpaceshipTitanicCoverImage from '@/assets/images/SpaceshipTitanic/cover.png';
import LangLiftLibraryMockupImage from '@/assets/images/LangLift/library-cards-figma.svg';
import ResumePdf from '@/assets/resumes/AdamLarson_DataEngineer_Resume.pdf';
import { HeroBackgroundModel } from '@/components/HeroModel';
import HeroStarfieldOverlay from '@/components/effects/HeroStarfieldOverlay';

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
const PROJECT_CARD_BASE_CLASSES = 'flex flex-col gap-8 bg-card rounded-2xl shadow-lg overflow-hidden md:items-stretch transition-colors';
const MEDIA_ASPECT_RATIO_STYLE = { aspectRatio: '16/9' } as const;
const PROJECT_ORDER = [
  'lang-lift',
  'spaceship-titanic',
  'kanji-trainer',
  'iot-simulator',
  'valorant-analysis',
  'herb-search',
  'tales-of-tiny',
  'discord-bots',
] as const;
const PROJECT_MEDIA_MAP: Record<string, Pick<Project, 'image' | 'imageAlt' | 'imageFit'>> = {
  'lang-lift': {
    image: LangLiftLibraryMockupImage,
    imageAlt: 'LangLift library cards Figma mockup',
  },
  'kanji-trainer': { image: KanjiTrainerFrontImage },
  'tales-of-tiny': { image: TalesOfTinyImage },
  'iot-simulator': { image: AzureIoTHubImage },
  'valorant-analysis': { image: ValorantStatsImage },
  'discord-bots': { image: DiscordTwitterImage, imageFit: 'contain' },
  'spaceship-titanic': { image: SpaceshipTitanicCoverImage },
};

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const projects = useMemo(() => {
    const items = t('home.projects.items', { returnObjects: true }) as Project[];
    const itemById = Object.fromEntries(items.map((item) => [item.id, item])) as Record<string, Project>;
    return PROJECT_ORDER
      .map((id) => itemById[id])
      .filter(Boolean)
      .map((item) => ({
        ...item,
        ...PROJECT_MEDIA_MAP[item.id],
        imageAlt: item.imageAlt ?? PROJECT_MEDIA_MAP[item.id]?.imageAlt ?? item.title,
      }));
  }, [t]);

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

  useEffect(() => {
    if (location.pathname !== '/') return;

    const mainElement = document.querySelector('main');
    if (!mainElement) return;

    const savedScroll = sessionStorage.getItem('homeScrollPosition');
    if (!savedScroll) return;

    const scrollValue = Number.parseInt(savedScroll, 10);
    if (Number.isNaN(scrollValue)) {
      sessionStorage.removeItem('homeScrollPosition');
      return;
    }

    let attempts = 0;
    const maxAttempts = 60;
    let frameId = 0;
    const restoreScroll = () => {
      attempts += 1;
      const maxScrollable = Math.max(mainElement.scrollHeight - mainElement.clientHeight, 0);
      if (maxScrollable >= scrollValue || attempts >= maxAttempts) {
        mainElement.scrollTop = Math.min(scrollValue, maxScrollable);
        sessionStorage.removeItem('homeScrollPosition');
        return;
      }
      frameId = requestAnimationFrame(restoreScroll);
    };

    frameId = requestAnimationFrame(restoreScroll);
    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [location.pathname]);

  const handleProjectClick = useCallback((route: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    const mainElement = document.querySelector('main');
    if (mainElement) {
      try {
        sessionStorage.setItem('homeScrollPosition', mainElement.scrollTop.toString());
      } catch {
        // Ignore storage errors.
      }
    }

    navigate(route, { replace: false });
  }, [navigate]);

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
      
      const fetchPriority = index === 0 ? 'high' : 'auto';
      const loading = index === 0 ? 'eager' : 'lazy';

      return (
        <div className={containerClass} style={MEDIA_ASPECT_RATIO_STYLE}>
          <img 
            src={project.image} 
            alt={project.imageAlt || project.title} 
            className={imageClass}
            loading={loading}
            decoding="async"
            fetchPriority={fetchPriority}
            width="800"
            height="450"
            style={MEDIA_ASPECT_RATIO_STYLE}
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
        className="min-h-[100svh] px-4 py-12 hero-overlay relative overflow-hidden"
      >
        {/* Stars furthest back */}
        <HeroStarfieldOverlay className="z-0" />

        {/* 3D model on top of stars */}
        <HeroBackgroundModel className="absolute inset-0 z-[1]" />

        {/* Contrast overlay (theme-aware sky / night tones, not sage surface-muted) */}
        <div className="hero-gradient-overlay absolute inset-0 z-10 pointer-events-none" />

        <div className="max-w-6xl mx-auto grid gap-10 items-center relative z-20">
          <div className="text-center space-y-6">
            <h1 className="text-5xl font-bold text-slate-100 drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)]">
              {t('home.hero.title')}
            </h1>
            <p className="text-xl text-slate-200/90 drop-shadow-[0_1px_10px_rgba(0,0,0,0.35)]">
              {t('home.hero.subtitle')}
            </p>
          </div>
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
                className={`${PROJECT_CARD_BASE_CLASSES} ${
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
                <h3 className="text-xl font-semibold mb-2 text-primary">Resume</h3>
                <a
                  href={ResumePdf}
                  download="AdamLarson_DataEngineer_Resume.pdf"
                  className="text-accent hover:underline text-lg transition-colors"
                >
                  Download Resume (PDF)
                </a>
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

