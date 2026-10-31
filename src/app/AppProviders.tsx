import { useEffect, useState, type ReactNode } from 'react';
import { openAppDatabase, type AppRepositories } from '../features/persistence/repositories';
import { bootstrap } from '../features/persistence/bootstrap';
import { systemClock } from '../shared/time/clock';
import { dataset } from '../content/dataset';
import { AppContext, type AppData } from './app-context';
let connection: Promise<AppRepositories> | undefined;
export function AppProviders({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    let stop = () => {};
    async function init() {
      try {
        performance.mark('verbquest:open:start');
        connection ??= openAppDatabase();
        const repos = await connection;
        performance.mark('verbquest:open:ready');
        const profile = await bootstrap(repos, dataset, systemClock);
        performance.mark('verbquest:bootstrap:ready');
        async function refresh() {
          const [entries, lists, plans, sessions, progress, settings, awards, xp] =
            await Promise.all([
              repos.catalog.toArray(),
              repos.lists.where('profileId').equals(profile.id).toArray(),
              repos.plans.where('profileId').equals(profile.id).toArray(),
              repos.sessions.where('profileId').equals(profile.id).toArray(),
              repos.progress.where('profileId').equals(profile.id).toArray(),
              repos.settings.get(profile.id),
              repos.awards.where('profileId').equals(profile.id).toArray(),
              repos.xpLedger.where('profileId').equals(profile.id).toArray(),
            ]);
          if (active && settings)
            setData({
              repos,
              profile,
              entries,
              verbs: entries.map((e) => e.verb),
              lists,
              plans,
              sessions,
              progress,
              settings: { ...settings, strictIpa: settings.strictIpa === true },
              awards,
              xp,
              refresh,
            });
        }
        await refresh();
        performance.mark('verbquest:snapshot:ready');
        stop = repos.subscribe(() => void refresh().catch((e) => setError(String(e))));
      } catch (e) {
        if (active) {
          connection = undefined;
          setError(String(e));
        }
      }
    }
    void init();
    return () => {
      active = false;
      stop();
    };
  }, [retry]);
  useEffect(() => {
    if (!data) return;
    const s = data.settings;
    document.documentElement.dataset.theme = s.theme;
    document.documentElement.dataset.motion = s.reducedMotion ? 'reduced' : 'normal';
  }, [data?.settings]);
  if (error)
    return (
      <main className="startup">
        <h1>No hemos podido abrir tus datos</h1>
        <p role="alert">{error}</p>
        <p>
          No se ha borrado el almacenamiento. Cierra otras versiones de VerbQuest e inténtalo de
          nuevo.
        </p>
        <button
          onClick={() => {
            setError('');
            setRetry((x) => x + 1);
          }}
        >
          Reintentar
        </button>
      </main>
    );
  if (!data)
    return (
      <main className="startup" aria-busy="true">
        <div className="brand-mark">V</div>
        <h1>Preparando tu aventura…</h1>
        <p>Abriendo tu biblioteca local.</p>
      </main>
    );
  return <AppContext.Provider value={data}>{children}</AppContext.Provider>;
}
