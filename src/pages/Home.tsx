import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import TectonicPlanetImage from '@/assets/images/TectonicPlanetGenerator/seed-1337-surface-map.png';
import TalesOfTinyImage from '@/assets/images/TalesOfTiny.png';
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
  imageFit?: 'cover' | 'contain' | 'map';
}

const GitHubIcon = () => (
  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

const LinkedInIcon = () => (
  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const SECTION_SPACING = 'px-4 py-20 sm:px-6 sm:py-24';
const SECTION_CONTAINER = 'mx-auto max-w-6xl';

const FEATURED_PROJECTS: Project[] = [
  {
    id: 'tectonic-planet-generator',
    title: 'Tectonic Planet Generator',
    description: 'A deterministic, tectonics-inspired planet generator built on spherical graphs. It produces inspectable seeded worlds through procedural plate regions and boundary-driven terrain rules. The software path works end to end, while the geology-inspired abstraction remains experimental.',
    route: '/tectonic-planet-generator',
    image: TectonicPlanetImage,
    imageAlt: 'Equirectangular shaded surface map generated from seed 1337',
    imageFit: 'map',
  },
  {
    id: 'tales-of-tiny',
    title: 'Tales of Tiny — Collaborative Unity Puzzle Game',
    description: 'A finished puzzle game made by a six-person team in six weeks. My primary responsibility was level design; I also contributed an HLSL-based blacklight effect and helped the group narrow its ideas to a scope we could deliver.',
    route: '/game-development',
    image: TalesOfTinyImage,
    imageAlt: 'Tales of Tiny winter puzzle-game scene',
  },
  {
    id: 'iot-simulator',
    title: 'IoT Sensor Simulator with Azure IoT Hub',
    description: 'Python sensor simulation and MQTT data delivery for a team-built monitoring system using Azure IoT Hub, threshold alerts, and dashboard visualization.',
    route: '/iot-sensor-simulator-with-azure-iot-hub',
    image: AzureIoTHubImage,
    imageAlt: 'Azure IoT Hub project architecture and sensor visualization',
  },
  {
    id: 'spaceship-titanic',
    title: 'Spaceship Titanic — Tabular ML Pipeline',
    description: 'A reproducible Kaggle pipeline using group-aware validation, consistent train/test transformations, and engineered cabin and spending features to reduce leakage and make model comparisons more trustworthy.',
    route: '/spaceship-titanic-kaggle-tabular-ml-pipeline',
    image: SpaceshipTitanicCoverImage,
    imageAlt: 'Spaceship Titanic drifting through a cosmic anomaly',
  },
  {
    id: 'lang-lift',
    title: 'LangLift — Language Learning Platform',
    description: 'A full-stack learning project connecting daily writing, vocabulary capture, spaced-repetition study sets, and accountability features with Python, FastAPI, React, TypeScript, MongoDB, and Redis.',
    route: '/lang-lift',
    image: LangLiftLibraryMockupImage,
    imageAlt: 'LangLift library-card interface mockup',
    imageFit: 'contain',
  },
];

const EARLIER_PROJECTS = [
  { title: 'Kanji Trainer', detail: 'Raspberry Pi, Python, SDL2, SQLite, spaced repetition', route: '/kanji-trainer-for-raspberry-pi' },
  { title: 'Valorant Analysis', detail: 'Python data collection and tournament-level comparison', route: '/valorant-agent-data-analysis' },
  { title: 'Herb Search', detail: 'React and TypeScript text adventure', route: '/herb-search-project' },
  { title: 'Discord Bots', detail: 'API integration and message automation', route: '/discord-bots' },
];

const SKILL_GROUPS = [
  {
    title: 'Scientific and data work',
    detail: 'Python, OpenPyXL, data analysis, deterministic pipelines, regression testing',
  },
  {
    title: 'Software engineering',
    detail: 'TypeScript, React, Git, API development, C++, C#, testing',
  },
  {
    title: 'Visualization and simulation',
    detail: 'WebGL, Three.js, procedural modeling, Unity, HLSL',
  },
  {
    title: 'Measurement and physical systems',
    detail: 'Metrology, blueprint reading, CMM Manager, precision measurement',
  },
  {
    title: 'Tools and platforms',
    detail: 'FastAPI, MQTT, Azure IoT Hub, MongoDB, Redis, Linux, Docker',
  },
  {
    title: 'Earth-science interests',
    detail: 'Tectonics, geodesy, seismology, geological modeling, Earth and geospatial data',
  },
];

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const socialLinks = useMemo(
    () => t('home.contact.socialLinks', { returnObjects: true }) as { name: string; url: string }[],
    [t],
  );

  useEffect(() => {
    if (location.pathname !== '/') return;
    const mainElement = document.querySelector('main');
    const savedScroll = sessionStorage.getItem('homeScrollPosition');
    if (!mainElement || !savedScroll) return;

    const scrollValue = Number.parseInt(savedScroll, 10);
    if (Number.isNaN(scrollValue)) {
      sessionStorage.removeItem('homeScrollPosition');
      return;
    }

    let attempts = 0;
    let frameId = 0;
    const restoreScroll = () => {
      attempts += 1;
      const maxScrollable = Math.max(mainElement.scrollHeight - mainElement.clientHeight, 0);
      if (maxScrollable >= scrollValue || attempts >= 60) {
        mainElement.scrollTop = Math.min(scrollValue, maxScrollable);
        sessionStorage.removeItem('homeScrollPosition');
        return;
      }
      frameId = requestAnimationFrame(restoreScroll);
    };

    frameId = requestAnimationFrame(restoreScroll);
    return () => cancelAnimationFrame(frameId);
  }, [location.pathname]);

  const openProject = useCallback((route: string) => {
    const mainElement = document.querySelector('main');
    if (mainElement) {
      try {
        sessionStorage.setItem('homeScrollPosition', mainElement.scrollTop.toString());
      } catch {
        // Navigation still works when storage is unavailable.
      }
    }
    navigate(route);
  }, [navigate]);

  return (
    <div className="w-full overflow-x-hidden bg-app text-primary">
      <section id="home" className="hero-overlay relative min-h-[100svh] overflow-hidden px-4 py-12">
        <HeroStarfieldOverlay className="z-0" />
        <HeroBackgroundModel className="absolute inset-0 z-[1]" />
        <div className="hero-gradient-overlay pointer-events-none absolute inset-0 z-10" />

        <div className="relative z-20 mx-auto flex min-h-[calc(100svh-6rem)] max-w-6xl items-center">
          <div className="max-w-3xl space-y-6 text-left sm:pl-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-200">Adam Larson · Computer science graduate</p>
            <h1 className="text-5xl font-bold leading-tight text-slate-100 drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)] sm:text-6xl lg:text-7xl">
              Software for physical systems.
            </h1>
            <p className="max-w-2xl text-xl leading-relaxed text-slate-200 drop-shadow-[0_1px_10px_rgba(0,0,0,0.35)] sm:text-2xl">
              I combine simulation, data tools, and precision measurement, with interests in Earth science, geospatial data, and research software.
            </p>
            <a href="#projects" className="btn-primary inline-flex rounded-lg px-6 py-3 font-semibold shadow-md">
              See selected work
            </a>
          </div>
        </div>
      </section>

      <section id="about" className={`${SECTION_SPACING} bg-surface-muted`}>
        <div className={`${SECTION_CONTAINER} grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-start`}>
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-accent">Direction</p>
            <h2 className="text-4xl font-bold text-primary">Software, data, and the physical world</h2>
          </div>
          <div className="space-y-5 text-lg leading-relaxed text-secondary">
            <p>I am a computer science graduate interested in applying software, data analysis, and simulation to Earth science and other physical systems.</p>
            <p>My current work spans a procedural planetary surface generator and precision manufacturing inspection. Together, those experiences have pushed me toward problems involving measurement, reproducibility, visualization, and the gap between a computational model and the system it represents.</p>
            <p>I am looking for scientific software, research software, Earth or geospatial data, modeling and simulation, or scientific-instrumentation roles where I can build dependable tools alongside scientists and engineers.</p>
          </div>
        </div>
      </section>

      <section id="experience" className={SECTION_SPACING}>
        <div className={`${SECTION_CONTAINER} grid gap-8 lg:grid-cols-[0.7fr_1.3fr]`}>
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-accent">Current work</p>
            <h2 className="text-4xl font-bold text-primary">Experience</h2>
          </div>
          <article className="border-l-2 border-default pl-6 sm:pl-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <div>
                <h3 className="text-2xl font-bold text-primary">Inspector / Programmer</h3>
                <p className="text-lg font-medium text-secondary">Phoenix Precision Machining</p>
              </div>
              <p className="shrink-0 text-sm font-semibold uppercase tracking-wider text-secondary">June 2026 – Present</p>
            </div>
            <ul className="mt-6 space-y-3 text-lg leading-relaxed text-secondary">
              <li>Inspect precision-machined components with micrometers, calipers, bore micrometers, pin gauges, CMM Manager, and coordinate-measuring equipment.</li>
              <li>Read engineering drawings and work with tolerances commonly measured in thousandths and, at times, ten-thousandths of an inch while learning blueprint interpretation and CMM operation.</li>
              <li>Developing an internal Python/OpenPyXL tool for inspection-data aggregation.</li>
            </ul>
          </article>
        </div>
      </section>

      <section id="projects" className={`${SECTION_SPACING} bg-surface-muted`}>
        <div className="mx-auto max-w-screen-2xl space-y-12">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-accent">Selected work</p>
            <h2 className="text-4xl font-bold text-primary">Projects</h2>
            <p className="mt-4 text-lg text-secondary">Simulation, data, visualization, and collaborative delivery—ordered by relevance to the work I want to do next.</p>
          </div>

          <div className="space-y-10">
            {FEATURED_PROJECTS.map((project, index) => (
              <article key={project.id} className={`flex flex-col overflow-hidden rounded-2xl bg-card shadow-lg md:items-stretch ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
                <div className={`flex min-h-64 w-full items-center justify-center overflow-hidden md:w-1/2 ${project.imageFit === 'map' ? 'bg-[#365d91]' : 'bg-surface'} ${index === 0 ? 'md:min-h-[460px]' : 'md:min-h-[360px]'}`}>
                  <img
                    src={project.image}
                    alt={project.imageAlt}
                    className={project.imageFit === 'contain'
                      ? 'h-full max-h-[420px] w-full object-contain p-6'
                      : project.imageFit === 'map'
                        ? 'h-auto w-full object-contain'
                        : 'h-full w-full object-cover'}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                    width="1200"
                    height="675"
                  />
                </div>
                <div className="flex w-full flex-col justify-center space-y-5 p-7 sm:p-10 md:w-1/2">
                  {index === 0 && <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Primary case study</p>}
                  <h3 className="text-2xl font-bold text-primary sm:text-3xl">{project.title}</h3>
                  <p className="text-lg leading-relaxed text-secondary">{project.description}</p>
                  <button type="button" onClick={() => openProject(project.route)} className="btn-primary self-start rounded-lg px-6 py-3 font-semibold shadow-md">
                    Read case study
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="pt-8">
            <h3 className="text-2xl font-bold text-primary">Earlier projects</h3>
            <p className="mt-2 text-secondary">Additional experiments and learning projects remain available in the portfolio.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {EARLIER_PROJECTS.map((project) => (
                <button key={project.title} type="button" onClick={() => openProject(project.route)} className="rounded-xl border border-default bg-app p-5 text-left transition-colors hover:bg-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]">
                  <span className="block font-bold text-primary">{project.title}</span>
                  <span className="mt-2 block text-sm leading-relaxed text-secondary">{project.detail}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="skills" className={SECTION_SPACING}>
        <div className={SECTION_CONTAINER}>
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-accent">Working toolkit</p>
            <h2 className="text-4xl font-bold text-primary">Skills grounded in projects and practice</h2>
            <p className="mt-4 text-lg text-secondary">Earth science is an active area of study and application interest. The tools below reflect work I can discuss concretely.</p>
          </div>
          <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
            {SKILL_GROUPS.map((group) => (
              <article key={group.title} className="border-t-2 border-default pt-5">
                <h3 className="text-xl font-bold text-primary">{group.title}</h3>
                <p className="mt-3 leading-relaxed text-secondary">{group.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className={`${SECTION_SPACING} bg-surface-muted`}>
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-accent">Get in touch</p>
            <h2 className="text-4xl font-bold text-primary">Contact</h2>
            <p className="mt-4 text-lg text-secondary">I am interested in scientific software, Earth data, modeling, simulation, and instrumentation-adjacent roles.</p>
          </div>
          <div className="rounded-2xl bg-card p-7 shadow-lg sm:p-8">
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold text-primary">Email</h3>
                <a href={`mailto:${t('home.contact.emailValue')}?subject=Portfolio inquiry`} className="mt-2 inline-block break-all text-lg text-accent hover:underline">{t('home.contact.emailValue')}</a>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary">Resume</h3>
                <a href={ResumePdf} download="AdamLarson_DataEngineer_Resume.pdf" className="mt-2 inline-block text-lg text-accent hover:underline">Download resume (PDF)</a>
              </div>
            </div>
            <div className="mt-8 border-t border-default pt-6">
              <h3 className="sr-only">Social profiles</h3>
              <ul className="flex gap-5">
                {socialLinks.map((link) => (
                  <li key={link.name}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-secondary transition-colors hover:text-accent" aria-label={`${link.name} (opens in a new tab)`}>
                      <span className="sr-only">{link.name}</span>
                      {link.name.toLowerCase().includes('linkedin') ? <LinkedInIcon /> : <GitHubIcon />}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
