import type { UserAchievement, SkillProgress, FormKey } from '../../shared/domain/types';
import type { AppRepositories } from '../persistence/repositories';
import { emptyProgress } from '../learning-engine/progress';
export interface ActivityEvent {
  kind: 'opened' | 'audio_completed' | 'audio_completed_all' | 'audio_failed';
  profileId: string;
  verbId: string;
  form?: FormKey;
  at: string;
}
export function computeAwards(input: {
  previous: SkillProgress[];
  next: SkillProgress[];
  activity: ActivityEvent[];
  existing: UserAchievement[];
}): UserAchievement[] {
  const awards: UserAchievement[] = [];
  function add(profileId: string, verbId: string, kind: string, at: string) {
    const id = `${profileId}:${verbId}:${kind}`;
    if (!input.existing.some((x) => x.id === id) && !awards.some((x) => x.id === id))
      awards.push({ id, profileId, verbId, kind, earnedAt: at });
  }
  for (const e of input.activity)
    if (e.kind === 'opened' || e.kind === 'audio_completed_all')
      add(e.profileId, e.verbId, e.kind === 'opened' ? 'explorer' : 'listener', e.at);
  for (const p of input.next)
    if (p.state === 'mastered' && ['recall', 'spelling', 'context'].includes(p.skill))
      add(
        p.profileId,
        p.verbId,
        ({ recall: 'memory', spelling: 'spelling', context: 'context' } as Record<string, string>)[
          p.skill
        ],
        p.lastAdvanceDate + 'T12:00:00Z',
      );
  return awards;
}
export async function recordActivity(repos: AppRepositories, event: ActivityEvent) {
  await repos.runAtomic(async () => {
    let activity = event;
    if (event.kind === 'audio_completed' && event.form) {
      const key = `audio:${event.profileId}:${event.verbId}`;
      const value = (await repos.meta.get(key))?.value ?? '[]';
      const seen = [...new Set([...JSON.parse(value), event.form])];
      await repos.meta.put({ id: key, value: JSON.stringify(seen) });
      if (['base', 'pastSimple', 'pastParticiple'].every((f) => seen.includes(f)))
        activity = { ...event, kind: 'audio_completed_all' };
    }
    if (event.kind === 'opened') {
      const key: [string, string, 'recognition'] = [event.profileId, event.verbId, 'recognition'];
      const p = await repos.progress.get(key);
      if (!p) {
        const next = emptyProgress(...key);
        next.started = true;
        next.state = 'learning';
        await repos.progress.put(next);
      }
    }
    const existing = await repos.awards.where('profileId').equals(event.profileId).toArray();
    await repos.awards.bulkPut(
      computeAwards({ previous: [], next: [], activity: [activity], existing }),
    );
  });
}
