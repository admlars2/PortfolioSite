import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/sidebar';
import Home from './pages/Home';
import { getProjectRoutes } from './utils/routeUtils';
import './i18n/config';

// Main App
function AppContent() {
  const { t } = useTranslation();
  const projectRoutes = useMemo(() => 
    getProjectRoutes().map(({ route, component: ComponentLoader }) => ({
      route,
      Component: lazy(() => ComponentLoader().then(mod => ({ default: mod.default }))),
    }))
  , []);

  return (
    <div className="h-[100svh] w-full max-w-full overflow-hidden bg-app text-primary transition-colors duration-300">
      <Sidebar />
      <main className="app-scroll-container h-full w-full max-w-full transition-all duration-300 will-change-auto bg-app overflow-y-auto overflow-x-hidden">
        <Suspense fallback={<div className="flex items-center justify-center h-full">{t('common.loading')}</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            {projectRoutes.map(({ route, Component }) => (
              <Route
                key={route}
                path={route}
                element={<Component />}
              />
            ))}
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
