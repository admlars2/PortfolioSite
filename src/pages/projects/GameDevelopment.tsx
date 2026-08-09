import ProjectLayout from '@/components/ProjectLayout';
import TalesOfTinyImage from '@/assets/images/TalesOfTiny.png';
import Gif1 from '@/assets/images/TalesOfTiny/2_O0eW.gif';
import Gif2 from '@/assets/images/TalesOfTiny/XHmufh.gif';
import Gif3 from '@/assets/images/TalesOfTiny/3APttx.gif';
import Gif4 from '@/assets/images/TalesOfTiny/3jgc+a.gif';
import Image1 from '@/assets/images/TalesOfTiny/ICCk7Y.png';

const GAME_URL = 'https://pifopifo.itch.io/the-tales-of-tiny';

export default function GameDevelopment() {
  return (
    <ProjectLayout>
      <article className="mx-auto max-w-6xl pb-12">
        <header>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-accent">Team project · Unity · Six weeks</p>
          <h1 className="text-4xl font-bold leading-tight text-primary sm:text-5xl">Tales of Tiny — Collaborative Unity Puzzle Game</h1>
          <p className="mt-5 max-w-4xl text-xl leading-relaxed text-secondary">A six-person team designed and delivered a compact Christmas-themed puzzle game. My primary responsibility was level design, with an additional HLSL contribution for the blacklight mechanic.</p>
          <a href={GAME_URL} target="_blank" rel="noopener noreferrer" className="btn-primary mt-7 inline-flex rounded-lg px-5 py-3 font-semibold shadow-md">Play Tales of Tiny</a>
        </header>

        <figure className="mt-10 overflow-hidden rounded-2xl bg-card shadow-lg">
          <img src={TalesOfTinyImage} alt="Tales of Tiny winter puzzle-game environment" className="h-auto w-full" decoding="async" />
        </figure>

        <section className="mt-14 grid gap-8 lg:grid-cols-[0.65fr_1.35fr]">
          <h2 className="text-3xl font-bold text-primary">Working as a team</h2>
          <div className="space-y-5 text-lg leading-relaxed text-secondary">
            <p>All six team members contributed to design discussions and designed parts of the game. Early ideas covered more mechanics and spaces than we could reasonably finish, so the group narrowed them into four connected rooms built around a multi-tool with a blacklight, wrench, fishing rod, and flute.</p>
            <p>My main responsibility was turning that shared direction into playable levels. I designed rooms and puzzles—including a hedge maze and a rotating train-track puzzle—while coordinating their dependencies with the rest of the team. The fixed six-week schedule made scope decisions as important as individual ideas.</p>
          </div>
        </section>

        <section className="mt-14 grid gap-8 lg:grid-cols-[0.65fr_1.35fr]">
          <h2 className="text-3xl font-bold text-primary">Implementation contribution</h2>
          <div className="space-y-5 text-lg leading-relaxed text-secondary">
            <p>I also worked on the blacklight effect. Unity's lighting behavior did not expose the interaction in the form the mechanic needed, so I implemented shader/HLSL code to make selected objects respond visually to the tool.</p>
            <p>The project gave me practical experience fitting level design, custom rendering work, and other teammates' systems into one finished build. It was collaborative delivery, not a solo or lead-development role.</p>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-3xl font-bold text-primary">Gameplay</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {[Gif1, Gif2, Gif3, Gif4].map((image, index) => (
              <div key={image} className="overflow-hidden rounded-lg bg-card shadow-lg">
                <img src={image} alt={`Tales of Tiny gameplay showing puzzle room ${index + 1}`} className="h-auto w-full" loading="lazy" decoding="async" />
              </div>
            ))}
          </div>
          <div className="mt-4 overflow-hidden rounded-lg bg-card shadow-lg">
            <img src={Image1} alt="Tales of Tiny completed room and character view" className="h-auto w-full" loading="lazy" decoding="async" />
          </div>
        </section>
      </article>
    </ProjectLayout>
  );
}
