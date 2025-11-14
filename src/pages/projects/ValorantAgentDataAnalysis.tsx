import ProjectLayout from '@/components/ProjectLayout';
import { useTranslation } from 'react-i18next';

export default function ValorantAgentDataAnalysis() {
  const { t } = useTranslation();
  return (
    <ProjectLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
          {t('projects.valorantAnalysis.title')}
        </h1>
        
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            {t('projects.valorantAnalysis.intro1')}
          </p>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            {t('projects.valorantAnalysis.intro2BeforeLink')}
            <a
              href="https://www.vlr.gg"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {t('projects.valorantAnalysis.intro2LinkText')}
            </a>
            {t('projects.valorantAnalysis.intro2AfterLink')}
          </p>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            {t('projects.valorantAnalysis.section2023Heading')}
          </p>

          <div className="mb-8 overflow-x-auto">
            <div className="inline-block min-w-full">
                <iframe 
                src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQSifwTDhEml9uobQXL9LWoXGl-S4yyOgJ6Xjwd2R7Mt15S5ZvnBhaVljkHXlWCHw/pubhtml?gid=93540032&single=true&widget=true&headers=false" 
                width="1175" 
                height="510" 
                  frameBorder="0" 
                scrolling="no" 
                  className="border-4 rounded-lg w-full max-w-full"
                  style={{ borderColor: '#5A4F72', minWidth: '1175px' }}
                  title={t('projects.valorantAnalysis.table2023Title')}
              />
            </div>
          </div>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            {t('projects.valorantAnalysis.body1')}
          </p>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            {t('projects.valorantAnalysis.section2022Heading')}
          </p>

          <div className="mb-8 overflow-x-auto">
            <div className="inline-block min-w-full">
                <iframe 
                src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQkIcYYSUHabUWeqkacEofvjTn63Nh4qxWFICiakZ025CsFgwKIxr71eO7qy3enUg/pubhtml?gid=1971645227&single=true&widget=true&headers=false" 
                width="1175" 
                height="510" 
                  frameBorder="0" 
                scrolling="no" 
                  className="border-4 rounded-lg w-full max-w-full"
                  style={{ borderColor: '#5A4F72', minWidth: '1175px' }}
                  title={t('projects.valorantAnalysis.table2022Title')}
              />
            </div>
          </div>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            {t('projects.valorantAnalysis.body2')}
          </p>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            {t('projects.valorantAnalysis.conclusion')}
          </p>
        </div>
      </div>
    </ProjectLayout>
  );
}

