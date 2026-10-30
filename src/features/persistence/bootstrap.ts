import type { AppSettings, Clock, Dataset, Profile } from '../../shared/domain/types';
import type { AppRepositories } from './repositories';
import { reconcileSeed } from './seed-sync';
export const defaultLearning = {
  version: '1',
  intervalDays: [1, 3, 7, 14] as [number, number, number, number],
  masteryMinAdvances: 4,
  maxAdvancePerDay: 1 as const,
  maxRetryPerQuestion: 1 as const,
};
export function defaultSettings(p: Profile): AppSettings {
  return {
    profileId: p.id,
    volume: 0.8,
    rate: 0.9,
    dialect: 'uk',
    voiceURI: null,
    sounds: true,
    theme: 'system',
    reducedMotion: false,
    minutes: 10,
    timeZone: p.timeZone,
    remindersEnabled: false,
    learning: defaultLearning,
  };
}
export async function bootstrap(
  repos: AppRepositories,
  seed: Dataset,
  clock: Clock,
): Promise<Profile> {
  return repos.runAtomic(async () => {
    let profile = await repos.profiles.toCollection().first();
    if (!profile) {
      profile = {
        id: crypto.randomUUID(),
        name: 'Mi aventura',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Madrid',
        createdAt: clock.now(),
      };
      await repos.profiles.put(profile);
      await repos.settings.put(defaultSettings(profile));
    }
    const merged = reconcileSeed(await repos.catalog.toArray(), seed);
    await repos.catalog.bulkPut(merged.entries);
    await repos.meta.put({ id: 'datasetVersion', value: seed.version });
    await repos.meta.put({ id: 'datasetKind', value: seed.kind });
    return profile;
  });
}
