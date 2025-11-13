import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="h-full w-full">
      {/* Home Section */}
      <section id="home" className="h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            {t('nav.home')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Welcome to my portfolio
          </p>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
            {t('nav.about')}
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            About section content goes here...
          </p>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="h-screen flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
            {t('nav.projects')}
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Projects section content goes here...
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
            {t('nav.contact')}
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Contact section content goes here...
          </p>
        </div>
      </section>
    </div>
  );
}

