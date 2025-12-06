import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/sidebar';
import Home from './pages/Home';
import TreeAdjustment from './pages/TreeAdjustment';
import HerbSearch from './pages/HerbSearch';
import { getProjectRoutes } from './utils/routeUtils';
import './i18n/config';

function AppContent() {
  const location = useLocation();
  const { t } = useTranslation();
  const projectRoutes = useMemo(() => 
    getProjectRoutes().map(({ route, component: ComponentLoader }) => ({
      route,
      Component: lazy(() => ComponentLoader().then(mod => ({ default: mod.default }))),
    }))
  , []);
  const isTreePage = location.pathname === '/tree';
  const isHerbSearchPage = location.pathname === '/herb-search';

  return (
    <div className="h-screen w-full max-w-full overflow-hidden bg-app text-primary transition-colors duration-300">
      {!isTreePage && !isHerbSearchPage && <Sidebar />}
      <main className={`h-full w-full max-w-full transition-all duration-300 will-change-auto bg-app ${isTreePage || isHerbSearchPage ? '' : 'overflow-y-auto overflow-x-hidden'}`}>
        <Suspense fallback={<div className="flex items-center justify-center h-full">{t('common.loading')}</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tree" element={<TreeAdjustment />} />
            <Route path="/herb-search" element={<HerbSearch />} />
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
