import { useRef, useState } from 'react';
import { useApp } from '../../app/app-context';
import { startSession } from '../learning-engine/session-service';
import { systemClock } from '../../shared/time/clock';
import type { StudyPlan } from '../../shared/domain/types';
export function usePlanStarter() {
  const { repos, profile, refresh } = useApp();
  const lock = useRef(false);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  async function start(plan: StudyPlan, listId?: string) {
    if (lock.current) return false;
    lock.current = true;
    setStartingId(plan.id);
    setError('');
    try {
      await startSession(
        repos,
        { kind: 'plan', profileId: profile.id, planId: plan.id, ...(listId ? { listId } : {}) },
        systemClock,
        Math.random,
      );
      await refresh();
      return true;
    } catch (error) {
      setError(`${plan.name}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    } finally {
      lock.current = false;
      setStartingId(null);
    }
  }
  return { start, startingId, error };
}
