import ProjectLayout from '@/components/ProjectLayout';
import { useTranslation } from 'react-i18next';

const SECTIONS = [
  { heading: 'problemHeading', bodies: ['problemBody1', 'problemBody2'] },
  { heading: 'architectureHeading', bodies: ['architectureBody1', 'architectureBody2', 'architectureBody3'] },
  { heading: 'studyModelHeading', bodies: ['studyModelBody1', 'studyModelBody2', 'studyModelBody3'] },
  { heading: 'contentPipelineHeading', bodies: ['contentPipelineBody1', 'contentPipelineBody2'] },
  { heading: 'dailyOutputHeading', bodies: ['dailyOutputBody1', 'dailyOutputBody2'] },
  { heading: 'qualityHeading', bodies: ['qualityBody1', 'qualityBody2'] },
  { heading: 'roadmapHeading', bodies: ['roadmapBody1', 'roadmapBody2'] },
] as const;

export default function LangLift() {
  const { t } = useTranslation();

  return (
    <ProjectLayout>
      <article className="max-w-4xl mx-auto">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent mb-3">
          {t('projects.langLift.caseStudyLabel')}
        </p>

        <h1 className="text-4xl font-bold mb-6 text-primary">
          {t('projects.langLift.title')}
        </h1>

        <p className="text-xl text-secondary leading-relaxed mb-8">
          {t('projects.langLift.summary')}
        </p>

        <dl className="grid gap-4 sm:grid-cols-3 border-y border-sidebar py-5 mb-10">
          <div>
            <dt className="text-sm font-semibold text-primary">{t('projects.langLift.stackLabel')}</dt>
            <dd className="text-secondary mt-1">{t('projects.langLift.stackValue')}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-primary">{t('projects.langLift.roleLabel')}</dt>
            <dd className="text-secondary mt-1">{t('projects.langLift.roleValue')}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-primary">{t('projects.langLift.focusLabel')}</dt>
            <dd className="text-secondary mt-1">{t('projects.langLift.focusValue')}</dd>
          </div>
        </dl>

        <div className="space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-bold mb-4 text-primary">
                {t(`projects.langLift.${section.heading}`)}
              </h2>
              <div className="space-y-4">
                {section.bodies.map((bodyKey) => (
                  <p key={bodyKey} className="text-lg text-secondary leading-relaxed">
                    {t(`projects.langLift.${bodyKey}`)}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-10">
          <h2 className="text-2xl font-bold mb-4 text-primary">
            {t('projects.langLift.conclusionHeading')}
          </h2>
          <p className="text-lg text-secondary leading-relaxed">
            {t('projects.langLift.conclusion')}
          </p>
        </section>
      </article>
    </ProjectLayout>
  );
}

