import ProjectLayout from '@/components/ProjectLayout';
import { useTranslation } from 'react-i18next';

const SHEET_EMBED_STYLE = { borderColor: 'var(--color-accent)', minWidth: '1175px' } as const;

interface GoogleSheetEmbedProps {
  src: string;
  title: string;
}

function GoogleSheetEmbed({ src, title }: GoogleSheetEmbedProps) {
  return (
    <div className="mb-8 overflow-x-auto">
      <div className="inline-block min-w-full">
        <iframe
          src={src}
          width="1175"
          height="510"
          frameBorder="0"
          scrolling="no"
          className="border-4 rounded-lg w-full max-w-full"
          style={SHEET_EMBED_STYLE}
          title={title}
        />
      </div>
    </div>
  );
}

export default function ValorantAgentDataAnalysis() {
  const { t } = useTranslation();
  return (
    <ProjectLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-primary">
          {t('projects.valorantAnalysis.title')}
        </h1>
        
        <div className="max-w-none">
          <p className="text-lg text-secondary mb-4">
            {t('projects.valorantAnalysis.intro1')}
          </p>

          <p className="text-lg text-secondary mb-4">
            {t('projects.valorantAnalysis.intro2BeforeLink')}
            <a
              href="https://www.vlr.gg"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline transition-colors"
            >
              {t('projects.valorantAnalysis.intro2LinkText')}
            </a>
            {t('projects.valorantAnalysis.intro2AfterLink')}
          </p>

          <p className="text-lg text-secondary mb-6">
            {t('projects.valorantAnalysis.section2023Heading')}
          </p>

          <GoogleSheetEmbed
            src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQSifwTDhEml9uobQXL9LWoXGl-S4yyOgJ6Xjwd2R7Mt15S5ZvnBhaVljkHXlWCHw/pubhtml?gid=93540032&single=true&widget=true&headers=false"
            title={t('projects.valorantAnalysis.table2023Title')}
          />

          <p className="text-lg text-secondary mb-4">
            {t('projects.valorantAnalysis.body1')}
          </p>

          <p className="text-lg text-secondary mb-6">
            {t('projects.valorantAnalysis.section2022Heading')}
          </p>

          <GoogleSheetEmbed
            src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQkIcYYSUHabUWeqkacEofvjTn63Nh4qxWFICiakZ025CsFgwKIxr71eO7qy3enUg/pubhtml?gid=1971645227&single=true&widget=true&headers=false"
            title={t('projects.valorantAnalysis.table2022Title')}
          />

          <p className="text-lg text-secondary mb-4">
            {t('projects.valorantAnalysis.body2')}
          </p>

          <p className="text-lg text-secondary mb-6">
            {t('projects.valorantAnalysis.conclusion')}
          </p>
        </div>
      </div>
    </ProjectLayout>
  );
}

