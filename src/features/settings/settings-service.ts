import type { AppRepositories } from '../persistence/repositories';
import type { AppSettings } from '../../shared/domain/types';
export async function updateSettings(
  repos: AppRepositories,
  profileId: string,
  patch: Partial<AppSettings>,
): Promise<AppSettings> {
  const current = await repos.settings.get(profileId);
  if (!current) throw Error('Preferencias no encontradas');
  const s = { ...current, ...patch, profileId };
  if (
    (s.strictIpa !== undefined && typeof s.strictIpa !== 'boolean') ||
    !Number.isFinite(s.volume) ||
    s.volume < 0 ||
    s.volume > 1 ||
    !Number.isFinite(s.rate) ||
    s.rate < 0.5 ||
    s.rate > 2 ||
    !['light', 'dark', 'system'].includes(s.theme) ||
    !['uk', 'us'].includes(s.dialect) ||
    ![5, 10, 15].includes(s.minutes) ||
    s.remindersEnabled !== false
  )
    throw Error('Preferencias fuera de rango');
  try {
    new Intl.DateTimeFormat('es', { timeZone: s.timeZone }).format();
  } catch {
    throw Error('Zona horaria no válida');
  }
  if (
    s.learning.intervalDays.length !== 4 ||
    s.learning.intervalDays.some(
      (n, i, a) => !Number.isInteger(n) || n < 1 || n > 365 || (i > 0 && n < a[i - 1]),
    ) ||
    s.learning.masteryMinAdvances < 4
  )
    throw Error('Intervalos no válidos');
  await repos.runAtomic(async () => {
    await repos.settings.put(s);
    const profile = await repos.profiles.get(profileId);
    if (profile) {
      profile.timeZone = s.timeZone;
      await repos.profiles.put(profile);
    }
  });
  return s;
}
export async function resetProgress(repos: AppRepositories, profileId: string) {
  await repos.runAtomic(async () => {
    for (const t of [repos.attempts, repos.sessions, repos.progress, repos.awards, repos.xpLedger])
      await t.where('profileId').equals(profileId).delete();
    await repos.meta.filter((e) => e.id.startsWith('audio:' + profileId + ':')).delete();
  });
}
export async function deleteAllLocalData(repos: AppRepositories) {
  await repos.runAtomic(async () => {
    for (const t of repos.tables) await t.clear();
  });
}
