import { HomePage } from './HomePage';
import { ProgressPage } from '../features/progress/ProgressPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { GamesPage } from '../features/games/GamesPage';
import { StudyPage } from '../features/games/StudyPage';
import { PlansPage } from '../features/study-plans/PlansPage';
import { PlanEditorPage } from '../features/study-plans/PlanEditorPage';
import { ImportExportPage } from '../features/catalog/ImportExportPage';
import { VerbEditorPage } from '../features/catalog/VerbEditorPage';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppShell } from './AppShell';
import { CatalogPage } from '../features/catalog/CatalogPage';
import { VerbDetailPage } from '../features/verb-detail/VerbDetailPage';
import { StatusPanel } from '../shared/ui/StatusPanel';
const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/verbs', element: <CatalogPage /> },
      { path: '/verbs/:id', element: <VerbDetailPage /> },
      { path: '/editor/verbs/new', element: <VerbEditorPage key="new" /> },
      { path: '/editor/verbs/:id', element: <VerbEditorPage /> },
      { path: '/editor/import-export', element: <ImportExportPage /> },
      { path: '/plans', element: <PlansPage /> },
      { path: '/plans/:id', element: <PlanEditorPage /> },
      { path: '/study', element: <StudyPage /> },
      { path: '/games', element: <GamesPage /> },
      { path: '/games/:mode', element: <GamesPage /> },
      { path: '/progress', element: <ProgressPage /> },
      { path: '/settings', element: <SettingsPage /> },
      {
        path: '*',
        element: (
          <StatusPanel title="Este camino no existe">
            <p>Vuelve a tu biblioteca para continuar.</p>
          </StatusPanel>
        ),
      },
    ],
  },
]);
export function AppRouter() {
  return <RouterProvider router={router} />;
}
