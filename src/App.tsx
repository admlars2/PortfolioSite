import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/sidebar';
import Home from './pages/Home';
import { getProjectRoutes } from './utils/routeUtils';
import './i18n/config';

function App() {
  const projectRoutes = getProjectRoutes();

  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="h-screen w-full max-w-full overflow-hidden bg-white dark:bg-gray-900">
          <Sidebar />
          <main className="h-full w-full max-w-full overflow-y-auto overflow-x-hidden transition-all duration-300 will-change-auto">
            <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
              <Routes>
                <Route path="/" element={<Home />} />
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
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
