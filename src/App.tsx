import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/sidebar';
import Home from './pages/Home';
import TreeAdjustment from './pages/TreeAdjustment';
import { getProjectRoutes } from './utils/routeUtils';
import './i18n/config';

function AppContent() {
  const location = useLocation();
  const projectRoutes = getProjectRoutes();
  const isTreePage = location.pathname === '/tree';

  return (
    <div className="h-screen w-full max-w-full overflow-hidden bg-app text-primary transition-colors duration-300">
      {!isTreePage && <Sidebar />}
      <main className={`h-full w-full max-w-full transition-all duration-300 will-change-auto bg-app ${isTreePage ? '' : 'overflow-y-auto overflow-x-hidden'}`}>
        <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tree" element={<TreeAdjustment />} />
            {projectRoutes.map(({ route, component: ComponentLoader }) => {
              const LazyComponent = lazy(() => ComponentLoader().then(mod => ({ default: mod.default })));
              return (
                <Route
                  key={route}
                  path={route}
                  element={<LazyComponent />}
                />
              );
            })}
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
