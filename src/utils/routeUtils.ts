import type { ComponentType } from 'react';

/**
 * Converts PascalCase string to kebab-case
 * Example: ValorantAgentDataAnalysis -> valorant-agent-data-analysis
 */
export function pascalToKebab(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Gets the route path from a PascalCase component filename
 * Example: ValorantAgentDataAnalysis.tsx -> valorant-agent-data-analysis
 */
export function getRouteFromFilename(filename: string): string {
  const nameWithoutExt = filename.replace(/\.(tsx|ts|jsx|js)$/, '');
  return pascalToKebab(nameWithoutExt);
}

/**
 * Scans the projects directory and returns route information
 * Uses Vite's import.meta.glob for lazy dynamic imports
 */
export function getProjectRoutes() {
  const modules = import.meta.glob<{ default: ComponentType }>('../pages/projects/*.tsx', { eager: false });
  
  return Object.keys(modules).map((path) => {
    const filename = path.split('/').pop() || '';
    const route = getRouteFromFilename(filename);
    return {
      filename,
      route: `/${route}`,
      component: modules[path],
    };
  });
}

