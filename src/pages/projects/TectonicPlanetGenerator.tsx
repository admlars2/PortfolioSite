import ProjectLayout from '@/components/ProjectLayout';
import SurfaceMapImage from '@/assets/images/TectonicPlanetGenerator/seed-1337-surface-map.png';
import GeneratorInterfaceImage from '@/assets/images/TectonicPlanetGenerator/seed-1337-globe.png';
import BoundaryImage from '@/assets/images/TectonicPlanetGenerator/motion-boundary-view.png';

const LIVE_URL = 'https://planet.adam-larson.com';
const SOURCE_URL = 'https://github.com/admlars2/procedural-planet-generator';

const ActionLink = ({ href, children, secondary = false }: { href: string; children: React.ReactNode; secondary?: boolean }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={secondary
      ? 'inline-flex rounded-lg border border-default bg-card px-5 py-3 font-semibold text-primary transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]'
      : 'btn-primary inline-flex rounded-lg px-5 py-3 font-semibold shadow-md'}
  >
    {children}
  </a>
);

export default function TectonicPlanetGenerator() {
  return (
    <ProjectLayout>
      <article className="mx-auto max-w-6xl pb-16">
        <header className="grid gap-8 py-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-accent">Featured case study</p>
            <h1 className="text-4xl font-bold leading-tight text-primary sm:text-5xl">Tectonic Planet Generator</h1>
            <p className="mt-5 text-xl leading-relaxed text-secondary">A deterministic, tectonics-inspired planet generator built on spherical graphs. It produces an inspectable seeded surface using procedural plate regions and boundary-driven terrain rules, but it does not yet reproduce geological evolution.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ActionLink href={LIVE_URL}>Launch live generator</ActionLink>
              <ActionLink href={SOURCE_URL} secondary>View source on GitHub</ActionLink>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl bg-card shadow-lg">
            <img src={SurfaceMapImage} alt="Equirectangular shaded surface map generated from seed 1337" className="h-auto w-full" width="1024" height="512" decoding="async" />
            <figcaption className="px-5 py-4 text-sm leading-relaxed text-secondary">A shaded 2:1 surface map generated from seed 1337 before it is wrapped onto the interactive globe.</figcaption>
          </figure>
        </header>

        <section className="mt-16 grid gap-8 lg:grid-cols-[0.65fr_1.35fr]">
          <h2 className="text-3xl font-bold text-primary">The question behind it</h2>
          <div className="space-y-5 text-lg leading-relaxed text-secondary">
            <p>I started with a straightforward goal: build a visually interesting planet generator where whole-planet organization was represented explicitly instead of emerging from a collection of independent terrain patches.</p>
            <p>The predecessor, TopoSphereGen, began with topographic data and experiments in learned continuation between neighboring terrain tiles. That path exposed a difficult tradeoff: large quantities of data offered limited local detail, while smaller higher-quality datasets provided less coverage. More importantly, neither mapped cleanly into the continuous spherical 3D workflow I wanted.</p>
            <p>The continuation experiments did not provide enough global structure, so I changed the order of the problem. The current generator establishes whole-planet topology, regions, boundaries, crust, and broad terrain before producing local surface detail.</p>
          </div>
        </section>

        <section className="mt-16 rounded-2xl bg-surface-muted p-7 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Current implementation</p>
          <h2 className="mt-3 text-3xl font-bold text-primary">From one seed to inspectable output</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <li className="border-t-2 border-default pt-4"><strong className="block text-primary">1. Spherical topology</strong><span className="mt-2 block text-secondary">Fibonacci-sphere samples and approximate neighbor graphs define the model surface independently of the exported texture resolution.</span></li>
            <li className="border-t-2 border-default pt-4"><strong className="block text-primary">2. Plate regions</strong><span className="mt-2 block text-secondary">Seeded construction creates connected procedural regions and repairs disconnected or thin artifacts.</span></li>
            <li className="border-t-2 border-default pt-4"><strong className="block text-primary">3. Boundary rules</strong><span className="mt-2 block text-secondary">Procedural motion vectors assigned to plate regions are compared across contacts and classified into heuristic boundary types.</span></li>
            <li className="border-t-2 border-default pt-4"><strong className="block text-primary">4. Heuristic surface fields</strong><span className="mt-2 block text-secondary">Rule-based crust, continent, terrain-influence, and volcanic fields assemble the broad surface.</span></li>
            <li className="border-t-2 border-default pt-4"><strong className="block text-primary">5. Elevation and sea level</strong><span className="mt-2 block text-secondary">A composed elevation field and selected datum target the requested ocean-area fraction.</span></li>
            <li className="border-t-2 border-default pt-4"><strong className="block text-primary">6. Render and export</strong><span className="mt-2 block text-secondary">The result becomes a texture-wrapped WebGL globe plus texture, 16-bit height-map, and settings exports.</span></li>
          </ol>
          <figure className="mt-10 overflow-hidden rounded-xl bg-card shadow-lg">
            <img src={GeneratorInterfaceImage} alt="Tectonic Planet Generator showing seed 1337 on a WebGL globe beside focused controls" className="h-auto w-full" loading="lazy" decoding="async" width="1440" height="900" />
            <figcaption className="px-5 py-4 text-sm leading-relaxed text-secondary">The focused Generator view keeps the live result and common controls together; Algorithm and Diagnostics provide deeper inspection separately.</figcaption>
          </figure>
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
          <figure className="overflow-hidden rounded-2xl bg-card shadow-lg">
            <img src={BoundaryImage} alt="Algorithm view comparing procedural motion vectors assigned to plate regions, boundary classification, and downstream terrain influence" className="h-auto w-full" loading="lazy" decoding="async" width="1440" height="900" />
            <figcaption className="px-5 py-4 text-sm leading-relaxed text-secondary">The Algorithm view connects assigned boundary intent, solved procedural motion vectors for plate regions, measured class, and the terrain feature used downstream.</figcaption>
          </figure>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Engineering decisions</p>
            <h2 className="mt-3 text-3xl font-bold text-primary">Reproducibility is part of the interface</h2>
            <ul className="mt-6 space-y-4 text-lg leading-relaxed text-secondary">
              <li><strong className="text-primary">Deterministic regression coverage:</strong> fixed seeds protect the output while the implementation changes.</li>
              <li><strong className="text-primary">Stage-level semantic hashes:</strong> failures identify whether topology, plates, boundaries, elevation, or rendering changed.</li>
              <li><strong className="text-primary">Stage contracts:</strong> Typed contracts expose named inputs and outputs for major stages, while some coupled surface-model work remains in the larger generation module.</li>
              <li><strong className="text-primary">Responsive execution:</strong> module workers, progress reporting, cancellation, and bounded cache reuse keep the interface usable during generation.</li>
              <li><strong className="text-primary">Separate surfaces:</strong> Generator, Algorithm, and Diagnostics views serve different levels of inspection without placing the full WebGL application inside this portfolio.</li>
            </ul>
          </div>
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-default p-7 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Software status</p>
            <h2 className="mt-3 text-3xl font-bold text-primary">An end-to-end software pipeline built around an experimental geological abstraction</h2>
            <p className="mt-5 text-lg leading-relaxed text-secondary">The application reliably turns a seed and settings into spherical graphs, procedural plate regions, classified boundaries, terrain fields, a rendered globe, and exportable data. That pipeline is complete enough to inspect and test, but the geology-inspired behavior inside it remains experimental.</p>
          </div>
          <div className="rounded-2xl border border-default p-7 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Visible limitations</p>
            <h2 className="mt-3 text-3xl font-bold text-primary">What the current surfaces still get wrong</h2>
            <p className="mt-5 text-lg leading-relaxed text-secondary">Generated planets can have overly uniform interiors, repeated shelf-like rims, and terrain shapes that reveal the influence masks used to construct them. Procedural boundaries create recognizable large-scale features, but the relationship between a boundary rule and the terrain it produces still needs substantial refinement.</p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-surface-muted p-7 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Geological scope</p>
          <h2 className="mt-3 text-3xl font-bold text-primary">Tectonics-inspired, not a tectonic simulation</h2>
          <p className="mt-5 max-w-4xl text-lg leading-relaxed text-secondary">The software borrows tectonic vocabulary and relationships to organize procedural terrain. It does not reproduce the physical processes that create and reshape planetary crust.</p>
          <ul className="mt-8 grid gap-x-10 gap-y-5 text-lg leading-relaxed text-secondary md:grid-cols-2">
            <li className="border-t-2 border-default pt-4">It generates a static result rather than evolving plates through geological time.</li>
            <li className="border-t-2 border-default pt-4">Plate-motion vectors are procedural, not driven by mantle convection, physical forces, or calibrated velocities.</li>
            <li className="border-t-2 border-default pt-4">Continents, crust, volcanism, and elevation are assembled from rules and influence fields.</li>
            <li className="border-t-2 border-default pt-4">Sea level is selected to reach a requested ocean-area fraction rather than emerging from water volume and basin geometry.</li>
            <li className="border-t-2 border-default pt-4">Erosion, sediment transport, isostasy, crustal deformation, and other long-term processes are not modeled.</li>
            <li className="border-t-2 border-default pt-4">Outputs have not been calibrated or validated against terrestrial or planetary observations.</li>
          </ul>
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-[0.65fr_1.35fr]">
          <h2 className="text-3xl font-bold text-primary">Next direction</h2>
          <div className="space-y-5 text-lg leading-relaxed text-secondary">
            <p>The immediate goal is to make the tectonics-inspired foundation more convincing: improve procedural plate and boundary structure, create more varied plate interiors, reduce visible influence-mask artifacts, and define clearer tests for whether terrain matches the behavior each rule intended.</p>
            <p>Climate, hydrology, biomes, and diffusion-guided detail should follow only after that foundation is more dependable. None of those later systems are implemented today, and any learned refinement would need to be evaluated against the deterministic procedural baseline.</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <ActionLink href={LIVE_URL}>Launch live generator</ActionLink>
              <ActionLink href={SOURCE_URL} secondary>View source on GitHub</ActionLink>
            </div>
          </div>
        </section>
      </article>
    </ProjectLayout>
  );
}
