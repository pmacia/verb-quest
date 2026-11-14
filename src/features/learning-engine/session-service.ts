import { createId } from '../../shared/identity/create-id';
import { computeXp, finishSessionXp } from '../gamification/xp';
import { computeAwards } from '../gamification/awards';
import type { AppRepositories } from '../persistence/repositories';
import type {
  Clock,
  StudySession,
  AnswerInput,
  Attempt,
  QuestionMode,
  EvaluatedSkill,
  StudyPlan,
  ReviewDraft,
} from '../../shared/domain/types';
import { toLocalDate } from '../../shared/time/calendar';
import { generateQuestions } from '../question-engine/generate';
import { getCoverageTargets } from '../question-engine/coverage';
import { learningRevision } from '../question-engine/revision';
import { evaluateAnswer } from '../question-engine/evaluate';
import {
  resolvePlanSelection,
  planSkills,
  validatePlanCompatibility,
  templates,
} from '../study-plans/plan-service';
import { buildSession } from './build-session';
import { applyAttempt, emptyProgress } from './progress';
export type SessionRequest =
  | { kind: 'plan'; profileId: string; planId: string; listId?: string }
  | {
      kind: 'free';
      reviewLanguage?: 'es' | 'en';
      profileId: string;
      verbIds: string[];
      planId?: string;
      modes: QuestionMode[];
      skills: EvaluatedSkill[];
    };
export class ActiveSessionError extends Error {
  constructor(public readonly session: StudySession) {
    super('Ya tienes una sesión pendiente. Continúala o termínala antes de empezar otra.');
    this.name = 'ActiveSessionError';
  }
}
export async function startSession(
  repos: AppRepositories,
  input: SessionRequest,
  clock: Clock,
  rng: () => number,
): Promise<StudySession> {
  return repos.runAtomic(async () => {
    const profile = await repos.profiles.get(input.profileId);
    const settings = await repos.settings.get(input.profileId);
    if (!profile || !settings) throw Error('Perfil no disponible');
    const active = await repos.sessions
      .where('profileId')
      .equals(profile.id)
      .filter((s) => s.status !== 'completed')
      .first();
    if (active) throw new ActiveSessionError(active);
    const verbs = (await repos.catalog.toArray()).map((e) => e.verb);
    const lists = await repos.lists.where('profileId').equals(profile.id).toArray();
    const progress = await repos.progress.where('profileId').equals(profile.id).toArray();
    let plan: StudyPlan;
    if (input.kind === 'plan') {
      const existing =
        (await repos.plans.get(input.planId)) || templates.find((p) => p.id === input.planId);
      if (!existing || (existing.profileId !== profile.id && !existing.isTemplate))
        throw Error('Plan no encontrado');
      plan = structuredClone({ ...existing, profileId: profile.id });
      if (input.listId !== undefined) {
        if (!existing.isTemplate || existing.id !== 'template-exam')
          throw Error('La lista rápida solo se admite en el plan preparado de examen.');
        if (!lists.some((list) => list.id === input.listId))
          throw Error('Elige una lista de este perfil.');
        plan.source = { type: 'saved_list', listId: input.listId };
      }
    } else {
      const sourcePlan = input.planId ? await repos.plans.get(input.planId) : undefined;
      if (input.planId && (!sourcePlan || sourcePlan.profileId !== profile.id))
        throw Error('Plan no encontrado');
      plan = {
        ...templates[0],
        id: sourcePlan?.id ?? 'free',
        name: sourcePlan?.name ?? templates[0].name,
        difficulty: sourcePlan?.difficulty ?? 'all',
        profileId: profile.id,
        source: sourcePlan?.source ?? { type: 'manual', verbIds: input.verbIds },
        questionModes: input.modes,
        schedule: {
          minutesPerSession: sourcePlan?.schedule.minutesPerSession ?? settings.minutes,
          newVerbsPerSession: 30,
          remindersEnabled: false,
        },
        goals: ['mixed'],
        isTemplate: !sourcePlan,
      };
    }
    const today = toLocalDate(clock.now(), settings.timeZone);
    const selection = resolvePlanSelection(plan, {
      verbs,
      lists,
      progress,
      today,
      strictIpa: settings.strictIpa === true,
    });
    if (!selection.verbIds.length)
      throw Error('La selección no tiene verbos disponibles. Añade verbos o cambia los filtros.');
    const generated = generateQuestions(
      {
        verbs: verbs.filter((v) => selection.verbIds.includes(v.id)),
        skills: input.kind === 'free' ? input.skills : planSkills(plan),
        modes: plan.questionModes,
        dialect: settings.dialect,
        allowFixtures: (await repos.meta.get('datasetKind'))?.value === 'fixture',
        reviewLanguage:
          input.kind === 'free'
            ? (input.reviewLanguage ?? settings.reviewLanguage ?? 'es')
            : (settings.reviewLanguage ?? 'es'),
      },
      rng,
    );
    if (input.kind === 'plan') {
      const issues = validatePlanCompatibility(plan, generated);
      if (issues.length) throw Error(issues.map((i) => i.message).join(' '));
    }
    const session = buildSession(
      {
        profileId: profile.id,
        plan,
        selection,
        questions: generated.questions,
        progress,
        today,
        fullReview:
          input.kind === 'free' && input.modes.length === 1 && input.modes[0] === 'verb_review',
      },
      clock,
      rng,
    );
    if (!session.queue.length)
      throw Error(
        'No hay actividades aptas. Revisa el límite de nuevos, las modalidades o el contenido.',
      );
    if (input.kind === 'plan' || input.planId)
      session.planContext = {
        id: plan.id,
        name: plan.name,
        verbIds: [...selection.verbIds],
        ...(plan.source.type === 'saved_list' ? { listId: plan.source.listId } : {}),
      };
    await repos.sessions.put(session);
    return session;
  });
}
/** Replace only the confirmed session; a failed new start rolls the entire change back. */
export async function replaceSession(
  repos: AppRepositories,
  input: SessionRequest,
  previousSessionId: string,
  clock: Clock,
  rng: () => number,
): Promise<StudySession> {
  return repos.runAtomic(async () => {
    const previous = await repos.sessions.get(previousSessionId);
    if (!previous || previous.profileId !== input.profileId)
      throw Error('La sesión anterior no está disponible para este perfil.');
    const active = await repos.sessions
      .where('profileId')
      .equals(input.profileId)
      .filter((session) => session.status !== 'completed')
      .first();
    if (active && active.id !== previousSessionId) throw new ActiveSessionError(active);
    if (active) await completeSession(repos, previousSessionId, clock);
    return startSession(repos, input, clock, rng);
  });
}
export function pruneArchivedQuestions(session: StudySession, archived: string[]): StudySession {
  return {
    ...session,
    queue: [
      ...session.queue.slice(0, session.cursor),
      ...session.queue.slice(session.cursor).filter((q) => !archived.includes(q.verbId)),
    ],
  };
}
export async function submitAnswer(repos: AppRepositories, input: AnswerInput, clock: Clock) {
  return repos.runAtomic(async () => {
    const s = await repos.sessions.get(input.sessionId);
    if (!s) throw Error('Sesión no encontrada');
    const existing =
      (await repos.attempts.get(input.attemptId)) ||
      (await repos.attempts
        .where('sessionId')
        .equals(s.id)
        .filter((a) => a.questionId === input.questionId)
        .first());
    if (existing) {
      if (existing.sessionId !== s.id || existing.questionId !== input.questionId)
        throw Error('Identificador de intento incompatible');
      return {
        attempt: existing,
        session: s,
        progress: await repos.progress.get([s.profileId, existing.verbId, existing.skill]),
        alreadyApplied: true,
        feedback: existing.snapshot.explanation,
      };
    }
    if (s.status === 'completed') throw Error('La sesión ya ha terminado');
    const q = s.queue[s.cursor];
    if (!q || q.id !== input.questionId)
      throw Error('La pregunta ha cambiado en otra pestaña. Continúa la sesión actualizada.');
    const entry = await repos.catalog.get(q.verbId);
    if (!entry || entry.verb.archivedAt)
      throw Error('Este verbo ya no está disponible. Reanuda para actualizar la cola.');
    const settings = await repos.settings.get(s.profileId);
    if (!settings) throw Error('Preferencias no disponibles');
    const at = clock.now();
    const effective =
      input.visualFallback && q.skill === 'listening'
        ? {
            ...q,
            skill: 'spelling' as const,
            mode: 'written_recall' as const,
            audioText: undefined,
            prompt: q.visualPrompt ?? q.prompt,
          }
        : q;
    const result = evaluateAnswer(effective, input);
    const hasVoice =
      !!input.fieldMethods?.some((method) => method !== 'keyboard') ||
      (input.inputMethod !== undefined && input.inputMethod !== 'keyboard');
    if (q.mode === 'verb_review' && hasVoice && !result.correct && !input.voiceConfirmed)
      throw Error('Revisa lo que ha entendido el micrófono antes de comprobar.');
    const currentRevision = learningRevision(entry.verb, effective.skill);
    const superseded = effective.coverageVersion
      ? effective.coverageVersion !== currentRevision
      : effective.contentVersion !== entry.verb.contentVersion;
    const a: Attempt = {
      ...input,
      ...(q.mode === 'verb_review' && input.fieldMethods
        ? {
            inputMethod: input.fieldMethods.every((method) => method === 'keyboard')
              ? ('keyboard' as const)
              : input.fieldMethods.every((method) => method === 'voice')
                ? ('voice' as const)
                : ('mixed' as const),
          }
        : {}),
      superseded,
      at,
      profileId: s.profileId,
      verbId: q.verbId,
      questionVersion: q.version,
      contentVersion: q.contentVersion,
      skill: effective.skill,
      target: q.target,
      coverageTargetIds:
        q.mode === 'verb_review' && 'coverageTargetIds' in result
          ? (result.coverageTargetIds ?? [])
          : q.coverageTargetIds,
      mode: effective.mode,
      evidenceKind: effective.evidenceKind,
      correct: result.correct,
      hasOptions: q.options.length > 0,
      isWritten: q.mode === 'verb_review' ? !hasVoice : q.isWritten,
      assisted: result.assisted,
      localDate: toLocalDate(at, settings.timeZone),
      snapshot: structuredClone(effective),
    };
    let before =
      (await repos.progress.get([s.profileId, q.verbId, effective.skill])) ??
      emptyProgress(s.profileId, q.verbId, effective.skill);
    if (
      (before.coverageVersion && before.coverageVersion !== currentRevision) ||
      (before.started && !before.coverageVersion)
    )
      before = {
        ...emptyProgress(s.profileId, q.verbId, effective.skill),
        coverageVersion: currentRevision,
      };
    const after = applyAttempt(
      before,
      a,
      getCoverageTargets(entry.verb, effective.skill, settings.dialect),
      settings.learning,
    );
    await repos.attempts.add(a);
    await repos.progress.put(after);
    const ledger = await repos.xpLedger.where('profileId').equals(s.profileId).toArray();
    if (!superseded) await repos.xpLedger.bulkPut(computeXp({ attempt: a, session: s, ledger }));
    const existingAwards = await repos.awards.where('profileId').equals(s.profileId).toArray();
    await repos.awards.bulkPut(
      computeAwards({ previous: [before], next: [after], activity: [], existing: existingAwards }),
    );
    delete s.reviewDraft;
    s.attemptIds.push(a.attemptId);
    s.cursor++;
    s.status = 'active';
    const root = q.retryOf ?? q.id;
    if (
      !superseded &&
      a.correct === false &&
      (q.mode === 'verb_review' || !s.retriedQuestionIds.includes(root))
    ) {
      const retry = { ...q, id: createId(), retryOf: root };
      if (q.mode === 'verb_review')
        s.queue.splice(Math.min(s.cursor + 3, s.queue.length), 0, retry);
      else s.queue.push(retry);
      if (!s.retriedQuestionIds.includes(root)) s.retriedQuestionIds.push(root);
    }
    await repos.sessions.put(s);
    return {
      attempt: a,
      progress: after,
      session: s,
      alreadyApplied: false,
      feedback: superseded
        ? `${q.explanation} El verbo ha cambiado: esta respuesta se conserva en el historial, pero debes practicar las formas actuales para avanzar.`
        : q.explanation,
    };
  });
}
export async function pauseSession(repos: AppRepositories, id: string) {
  await repos.runAtomic(async () => {
    const s = await repos.sessions.get(id);
    if (s && s.status !== 'completed') {
      s.status = 'paused';
      await repos.sessions.put(s);
    }
  });
}
export async function resumeSession(
  repos: AppRepositories,
  profileId: string,
): Promise<StudySession | null> {
  return repos.runAtomic(async () => {
    const s = await repos.sessions
      .where('profileId')
      .equals(profileId)
      .filter((s) => s.status !== 'completed')
      .first();
    if (!s) return null;
    const archived = (await repos.catalog.toArray())
      .filter((e) => e.verb.archivedAt)
      .map((e) => e.verb.id);
    const next = pruneArchivedQuestions(s, archived);
    next.status = 'active';
    await repos.sessions.put(next);
    return next;
  });
}
export async function completeSession(repos: AppRepositories, id: string, clock: Clock) {
  return repos.runAtomic(async () => {
    const s = await repos.sessions.get(id);
    if (!s) throw Error('Sesión no encontrada');
    if (s.status !== 'completed') {
      s.status = 'completed';
      s.completedAt = clock.now();
      await repos.sessions.put(s);
    }
    const attempts = await repos.attempts.where('sessionId').equals(id).toArray();
    const bonus = finishSessionXp(
      s,
      await repos.xpLedger.where('profileId').equals(s.profileId).toArray(),
      attempts,
    );
    if (bonus) await repos.xpLedger.put(bonus);
    return {
      session: s,
      attempts,
      correct: attempts.filter((a) => a.correct === true).length,
      skills: [...new Set(attempts.map((a) => a.skill))],
    };
  });
}

export async function saveReviewDraft(
  repos: AppRepositories,
  sessionId: string,
  draft: ReviewDraft,
) {
  if (
    draft.values.length !== 3 ||
    draft.values.some((value) => typeof value !== 'string' || value.length > 100)
  )
    throw Error('Borrador de repaso no válido');
  await repos.runAtomic(async () => {
    const session = await repos.sessions.get(sessionId);
    if (
      !session ||
      session.status === 'completed' ||
      session.queue[session.cursor]?.id !== draft.questionId ||
      session.queue[session.cursor]?.mode !== 'verb_review'
    )
      return;
    session.reviewDraft = structuredClone(draft);
    await repos.sessions.put(session);
  });
}
