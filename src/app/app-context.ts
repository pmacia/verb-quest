import { createContext, useContext, type Context as ReactContext } from 'react';
import type { AppRepositories } from '../features/persistence/repositories';
import type {
  Profile,
  Verb,
  VerbList,
  StudyPlan,
  StudySession,
  SkillProgress,
  AppSettings,
  UserAchievement,
  XpEntry,
  CatalogEntry,
} from '../shared/domain/types';
export interface AppData {
  repos: AppRepositories;
  profile: Profile;
  verbs: Verb[];
  entries: CatalogEntry[];
  lists: VerbList[];
  plans: StudyPlan[];
  sessions: StudySession[];
  progress: SkillProgress[];
  settings: AppSettings;
  awards: UserAchievement[];
  xp: XpEntry[];
  refresh: () => Promise<void>;
}
// Keep the same channel when Vite replaces this module; existing providers and
// consumers must never end up reading different Context instances.
const hot = import.meta.hot;
export const AppContext =
  (hot?.data.appContext as ReactContext<AppData | null> | undefined) ??
  createContext<AppData | null>(null);
if (hot) hot.data.appContext = AppContext;
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw Error('Aplicación no preparada');
  return value;
}
