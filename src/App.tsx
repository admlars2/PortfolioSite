import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
        <div className="h-screen w-full overflow-hidden bg-white dark:bg-gray-900">
          <Sidebar />
          <main className="h-full w-full overflow-y-auto transition-all duration-300">
            <Routes>
              <Route path="/" element={<Home />} />
              {projectRoutes.map(({ route, component: Component }) => (
                <Route
                  key={route}
                  path={route}
                  element={<Component.default />}
                />
              ))}
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
