import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../app/AppProviders';
import { templates, savePlan } from './plan-service';
import type { StudyPlan, PlanGoal, QuestionMode, PlanSource } from '../../shared/domain/types';
import { StatusPanel } from '../../shared/ui/StatusPanel';
export const modeLabels: Record<QuestionMode, string> = {
  flashcards: 'Flashcards',
  matching: 'Emparejar',
  quiz: 'Quiz',
  written_recall: 'Memoria y escritura',
  audio_detective: 'Audio Detective',
  sentence_gap: 'Completa la frase',
};
export function PlanEditorPage() {
  const { id } = useParams();
  const { plans, profile, repos, lists, verbs, refresh } = useApp();
  const original = plans.find((p) => p.id === id) || templates.find((p) => p.id === id);
  const [plan, setPlan] = useState<StudyPlan>(() => ({
    ...structuredClone(original ?? templates[0]),
    id: original && !original.isTemplate ? original.id : crypto.randomUUID(),
    profileId: profile.id,
    isTemplate: false,
    createdAt: new Date().toISOString(),
  }));
  const [error, setError] = useState('');
  const navigate = useNavigate();
  if (id !== 'new' && !original) return <StatusPanel title="Plan no encontrado" />;
  function source(type: PlanSource['type']) {
    setPlan({
      ...plan,
      source:
        type === 'course'
          ? { type, course: 'eso1' }
          : type === 'saved_list'
            ? { type, listId: lists[0]?.id ?? '' }
            : type === 'filter'
              ? { type, filter: {} }
              : { type, verbIds: [] },
    });
  }
  return (
    <>
      <Link className="back-link" to="/plans">
        ← Planes de estudio
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">TU RITMO, TUS OBJETIVOS</span>
          <h1>
            Dale forma a tu plan<span className="dot">.</span>
          </h1>
          <p>Priorizamos repasos pendientes, errores y habilidades por reforzar.</p>
        </div>
      </div>
      <section className="panel">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              if (plan.source.type === 'saved_list' && !plan.source.listId)
                throw Error('Crea o elige una lista.');
              await savePlan(repos, plan);
              await refresh();
              navigate('/study?plan=' + plan.id);
            } catch (e) {
              setError(String(e));
            }
          }}
        >
          <div className="form-grid">
            <label className="full">
              Nombre del plan
              <input
                required
                value={plan.name}
                onChange={(e) => setPlan({ ...plan, name: e.target.value })}
              />
            </label>
            <label>
              Origen de los verbos
              <select
                value={plan.source.type}
                onChange={(e) => source(e.target.value as PlanSource['type'])}
              >
                <option value="course">Curso</option>
                <option value="saved_list">Lista guardada</option>
                <option value="manual">Selección manual</option>
                <option value="filter">Filtros</option>
                <option value="imported">Selección importada</option>
              </select>
            </label>
            {plan.source.type === 'course' && (
              <label>
                Curso recomendado
                <select
                  value={plan.source.course}
                  onChange={(e) =>
                    setPlan({ ...plan, source: { type: 'course', course: e.target.value } })
                  }
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option value={`eso${n}`} key={n}>
                      {n}.º ESO
                    </option>
                  ))}
                </select>
              </label>
            )}
            {plan.source.type === 'saved_list' && (
              <label>
                Lista
                <select
                  value={plan.source.listId}
                  onChange={(e) =>
                    setPlan({ ...plan, source: { type: 'saved_list', listId: e.target.value } })
                  }
                >
                  <option value="">Selecciona</option>
                  {lists.map((l) => (
                    <option value={l.id} key={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {plan.source.type === 'filter' && (
              <label>
                Frecuencia
                <select
                  value={plan.source.filter.frequencies?.[0] ?? ''}
                  onChange={(e) =>
                    setPlan({
                      ...plan,
                      source: {
                        type: 'filter',
                        filter: e.target.value ? { frequencies: [e.target.value] } : {},
                      },
                    })
                  }
                >
                  <option value="">Todas</option>
                  <option value="essential">Esenciales</option>
                  <option value="common">Frecuentes</option>
                </select>
              </label>
            )}
            {(plan.source.type === 'manual' || plan.source.type === 'imported') && (
              <fieldset className="full">
                <legend>
                  Verbos del catálogo{' '}
                  {plan.source.type === 'imported' && '(importa primero desde la biblioteca)'}
                </legend>
                <div className="form-grid">
                  {verbs
                    .filter((v) => !v.archivedAt)
                    .map((v) => (
                      <label key={v.id}>
                        <input
                          type="checkbox"
                          checked={'verbIds' in plan.source && plan.source.verbIds.includes(v.id)}
                          onChange={(e) => {
                            if ('verbIds' in plan.source)
                              setPlan({
                                ...plan,
                                source: {
                                  ...plan.source,
                                  verbIds: e.target.checked
                                    ? [...plan.source.verbIds, v.id]
                                    : plan.source.verbIds.filter((id) => id !== v.id),
                                },
                              });
                          }}
                        />
                        {v.lemma} · {v.meanings[0]}
                      </label>
                    ))}
                </div>
              </fieldset>
            )}
            <label>
              Minutos por sesión
              <select
                value={plan.schedule.minutesPerSession}
                onChange={(e) =>
                  setPlan({
                    ...plan,
                    schedule: {
                      ...plan.schedule,
                      minutesPerSession: Number(e.target.value) as 5 | 10 | 15,
                    },
                  })
                }
              >
                {[5, 10, 15].map((n) => (
                  <option key={n} value={n}>
                    {n} minutos
                  </option>
                ))}
              </select>
            </label>
            <label>
              Verbos nuevos por sesión
              <input
                type="number"
                min="0"
                max="30"
                value={plan.schedule.newVerbsPerSession}
                onChange={(e) =>
                  setPlan({
                    ...plan,
                    schedule: { ...plan.schedule, newVerbsPerSession: Number(e.target.value) },
                  })
                }
              />
            </label>
            <label>
              Orden
              <select
                value={plan.order}
                onChange={(e) => setPlan({ ...plan, order: e.target.value as StudyPlan['order'] })}
              >
                <option value="adaptive">Adaptativo · lo que más necesitas</option>
                <option value="alphabetical">Alfabético</option>
              </select>
            </label>
            <label>
              Dificultad
              <select
                value={plan.difficulty}
                onChange={(e) =>
                  setPlan({ ...plan, difficulty: e.target.value as StudyPlan['difficulty'] })
                }
              >
                {[
                  ['all', 'Todas'],
                  ['introductory', 'Inicial'],
                  ['intermediate', 'Intermedia'],
                  ['advanced', 'Avanzada'],
                ].map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <fieldset>
            <legend>Objetivos</legend>
            <div className="form-grid">
              {(
                [
                  ['mixed', 'Aprender y repasar todas las habilidades'],
                  ['review', 'Repasar'],
                  ['listening', 'Escucha'],
                  ['spelling', 'Escritura'],
                  ['context', 'Frases'],
                ] as [PlanGoal, string][]
              ).map(([g, l]) => (
                <label key={g}>
                  <input
                    type="checkbox"
                    checked={plan.goals.includes(g)}
                    onChange={(e) =>
                      setPlan({
                        ...plan,
                        goals: e.target.checked
                          ? [...plan.goals, g]
                          : plan.goals.filter((x) => x !== g),
                      })
                    }
                  />
                  {l}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Modalidades</legend>
            <div className="form-grid">
              {Object.entries(modeLabels).map(([m, l]) => (
                <label key={m}>
                  <input
                    type="checkbox"
                    checked={plan.questionModes.includes(m as QuestionMode)}
                    onChange={(e) =>
                      setPlan({
                        ...plan,
                        questionModes: e.target.checked
                          ? [...plan.questionModes, m as QuestionMode]
                          : plan.questionModes.filter((x) => x !== m),
                      })
                    }
                  />
                  {l}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Días previstos · sin notificaciones</legend>
            <div className="actions">
              {[
                ['mon', 'L'],
                ['tue', 'M'],
                ['wed', 'X'],
                ['thu', 'J'],
                ['fri', 'V'],
                ['sat', 'S'],
                ['sun', 'D'],
              ].map(([d, l]) => (
                <label key={d}>
                  <input
                    type="checkbox"
                    checked={plan.schedule.daysPerWeek?.includes(d) ?? false}
                    onChange={(e) =>
                      setPlan({
                        ...plan,
                        schedule: {
                          ...plan.schedule,
                          daysPerWeek: e.target.checked
                            ? [...(plan.schedule.daysPerWeek ?? []), d]
                            : plan.schedule.daysPerWeek?.filter((x) => x !== d),
                        },
                      })
                    }
                  />
                  {l}
                </label>
              ))}
            </div>
          </fieldset>
          {error && <p role="alert">{error}</p>}
          <button>Guardar y preparar sesión</button>
        </form>
      </section>
    </>
  );
}
