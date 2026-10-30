import type { AppRepositories } from './repositories';
import type {
  BackupV1,
  Clock,
  ValidationIssue,
  ValidationResult,
  Verb,
} from '../../shared/domain/types';
import { validate } from '../../shared/domain/validation';
export async function exportBackup(
  repos: AppRepositories,
  profileId: string,
  clock: Clock,
): Promise<BackupV1> {
  return repos.db.transaction('r', repos.tables, async () => {
    const profile = await repos.profiles.get(profileId);
    const settings = await repos.settings.get(profileId);
    if (!profile || !settings) throw Error('Perfil no disponible');
    const [verbs, lists, plans, sessions, attempts, progress, awards, xpLedger] = await Promise.all(
      [
        repos.catalog.toArray(),
        repos.lists.where('profileId').equals(profileId).toArray(),
        repos.plans.where('profileId').equals(profileId).toArray(),
        repos.sessions.where('profileId').equals(profileId).toArray(),
        repos.attempts.where('profileId').equals(profileId).toArray(),
        repos.progress.where('profileId').equals(profileId).toArray(),
        repos.awards.where('profileId').equals(profileId).toArray(),
        repos.xpLedger.where('profileId').equals(profileId).toArray(),
      ],
    );
    return {
      format: 'verbquest-backup',
      schemaVersion: 1,
      exportedAt: clock.now(),
      profile,
      settings,
      baseDatasetVersion: (await repos.meta.get('datasetVersion'))?.value ?? 'custom',
      verbs,
      lists,
      plans,
      sessions,
      attempts,
      progress,
      awards,
      xpLedger,
    };
  });
}
export function previewRestore(input: unknown): ValidationResult<BackupV1> {
  const r = validate<BackupV1>('backup', input);
  if (!r.ok) return r;
  const b = r.value;
  const issues: ValidationIssue[] = [];
  const fail = (path: string, message: string) => issues.push({ path, code: 'integrity', message });
  const owner = b.profile.id;
  const profileCheck = validate('profile', b.profile);
  if (!profileCheck.ok) issues.push(...profileCheck.issues);
  const settingsCheck = validate('settings', b.settings);
  if (!settingsCheck.ok) issues.push(...settingsCheck.issues);
  const schemaNames: Record<string, string> = {
    lists: 'list',
    plans: 'plan',
    sessions: 'session',
    attempts: 'attempt',
    progress: 'progress',
    awards: 'award',
    xpLedger: 'xp',
  };
  for (const [name, kind] of Object.entries(schemaNames)) {
    for (const row of (b as any)[name]) {
      const checked = validate(kind, row);
      if (!checked.ok)
        issues.push(...checked.issues.map((i) => ({ ...i, path: '/' + name + i.path })));
    }
  }
  if (issues.length) return { ok: false, issues };
  try {
    new Intl.DateTimeFormat('es', { timeZone: b.profile.timeZone }).format();
    if (
      !b.profile.name ||
      !b.profile.createdAt ||
      b.settings.profileId !== owner ||
      b.settings.timeZone !== b.profile.timeZone ||
      typeof b.settings.volume !== 'number' ||
      b.settings.volume < 0 ||
      b.settings.volume > 1 ||
      !b.settings.learning
    )
      fail('/settings', 'Preferencias no válidas');
  } catch {
    fail('/profile', 'Zona no válida');
  }
  const ids = new Set<string>();
  for (const e of b.verbs) {
    if (!e?.verb) {
      fail('/verbs', 'Entrada no válida');
      continue;
    }
    const v = validate<Verb>('verb', e.verb);
    if (!v.ok) issues.push(...v.issues);
    if (ids.has(e.verb.id)) fail('/verbs', 'Verbo duplicado');
    ids.add(e.verb.id);
  }
  const sessionIds = new Set(b.sessions.map((s) => s.id));
  const unique = new Set<string>();
  for (const [name, rows] of Object.entries({
    lists: b.lists,
    plans: b.plans,
    sessions: b.sessions,
    attempts: b.attempts,
    progress: b.progress,
    awards: b.awards,
    xpLedger: b.xpLedger,
  })) {
    for (const row of rows as any[]) {
      if (!row || row.profileId !== owner) fail('/' + name, 'Perfil inconsistente');
      const key = name === 'progress' ? `${row.verbId}:${row.skill}` : (row.id ?? row.attemptId);
      if (typeof key !== 'string' || !key || unique.has(`${name}:${key}`))
        fail('/' + name, 'Clave duplicada o no válida');
      unique.add(`${name}:${key}`);
      if (row.verbId && !ids.has(row.verbId)) fail('/' + name, 'Referencia de verbo rota');
      if (row.verbIds?.some((id: string) => !ids.has(id)))
        fail('/' + name, 'Referencia de verbo rota');
      if (row.sessionId && !sessionIds.has(row.sessionId))
        fail('/' + name, 'Referencia de sesión rota');
      if (name === 'plans' && !validate('plan', row).ok) fail('/plans', 'Plan no válido');
      if (
        name === 'sessions' &&
        (!Array.isArray(row.queue) ||
          !Number.isInteger(row.cursor) ||
          row.cursor < 0 ||
          row.cursor > row.queue.length ||
          row.queue.some((q: any) => !ids.has(q.verbId)))
      )
        fail('/sessions', 'Cola no válida');
      if (
        name === 'attempts' &&
        (!row.snapshot ||
          !row.localDate ||
          typeof row.assisted !== 'boolean' ||
          !['recognition', 'recall', 'listening', 'spelling', 'context'].includes(row.skill))
      )
        fail('/attempts', 'Intento no válido');
      if (
        name === 'progress' &&
        (!Number.isInteger(row.stage) ||
          row.stage < 0 ||
          row.stage > 4 ||
          !Array.isArray(row.coverage) ||
          !Array.isArray(row.eligibleDates))
      )
        fail('/progress', 'Progreso no válido');
      if (name === 'xpLedger' && (!Number.isFinite(row.points) || row.points < 0))
        fail('/xpLedger', 'Puntos no válidos');
    }
  }
  return issues.length ? { ok: false, issues } : { ok: true, value: b };
}
export async function restoreBackup(
  repos: AppRepositories,
  input: BackupV1,
  _mode: 'replace_local_profile',
): Promise<void> {
  const r = previewRestore(input);
  if (!r.ok) throw Error(r.issues.map((i) => i.message).join(' · '));
  const b = r.value;
  await repos.runAtomic(async () => {
    for (const t of repos.tables) await t.clear();
    await repos.profiles.put(b.profile);
    await repos.settings.put(b.settings);
    await repos.catalog.bulkPut(b.verbs);
    await repos.lists.bulkPut(b.lists);
    await repos.plans.bulkPut(b.plans);
    await repos.sessions.bulkPut(b.sessions);
    await repos.attempts.bulkPut(b.attempts);
    await repos.progress.bulkPut(b.progress);
    await repos.awards.bulkPut(b.awards);
    await repos.xpLedger.bulkPut(b.xpLedger);
    await repos.meta.put({ id: 'datasetVersion', value: b.baseDatasetVersion });
  });
}
