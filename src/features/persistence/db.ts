import Dexie, { type Table } from 'dexie';
import type {
  Profile,
  AppSettings,
  CatalogEntry,
  VerbList,
  StudyPlan,
  StudySession,
  Attempt,
  SkillProgress,
  UserAchievement,
  XpEntry,
} from '../../shared/domain/types';
export class AppDatabase extends Dexie {
  profiles!: Table<Profile, string>;
  settings!: Table<AppSettings, string>;
  catalog!: Table<CatalogEntry, string>;
  lists!: Table<VerbList, string>;
  plans!: Table<StudyPlan, string>;
  sessions!: Table<StudySession, string>;
  attempts!: Table<Attempt, string>;
  progress!: Table<SkillProgress, [string, string, string]>;
  awards!: Table<UserAchievement, string>;
  xpLedger!: Table<XpEntry, string>;
  meta!: Table<{ id: string; value: string }, string>;
  constructor(name = 'verbquest') {
    super(name);
    this.version(1).stores({
      profiles: 'id',
      settings: 'profileId',
      catalog: 'verb.id,verb.lemma',
      lists: 'id,profileId',
      plans: 'id,profileId',
      sessions: 'id,profileId,status',
      attempts: 'attemptId,profileId,sessionId,verbId',
      progress: '[profileId+verbId+skill],profileId,verbId',
      awards: 'id,profileId',
      xpLedger: 'id,profileId,sessionId',
      meta: 'id',
    });
  }
}
