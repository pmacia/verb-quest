import './verb-editor.css';
import { Icon } from '../../shared/ui/Icon';
import { useCatalogAudio } from './use-catalog-audio';
import { getVerbIcon } from './verb-icons';
import { VerbEditorFields, editorSections, type EditorSection } from './VerbEditorFields';
import { validate } from '../../shared/domain/validation';
import { StatusPanel } from '../../shared/ui/StatusPanel';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useBlocker, Link } from 'react-router-dom';
import { useApp } from '../../app/app-context';
import {
  saveVerb,
  archiveVerb,
  restoreVerb,
  getArchiveImpact,
  resolveSeedConflict,
} from './editor-service';
import { Dialog } from '../../shared/ui/Dialog';
import { systemClock } from '../../shared/time/clock';
import type { Variant, Verb } from '../../shared/domain/types';
const emptyVerb = (): Verb => ({
  id: '',
  lemma: '',
  forms: {
    base: { value: '' },
    pastSimple: { variants: [{ value: '', dialect: 'all' }] },
    pastParticiple: { variants: [{ value: '', dialect: 'all' }] },
  },
  meanings: [],
  classification: {
    formRelation: 'all_different',
    frequencyBand: 'common',
    patternGroups: [],
    recommendedCourses: ['eso1'],
    topics: [],
    difficulty: 'introductory',
  },
  examples: [],
  sources: [],
  editorialStatus: 'draft',
  archivedAt: null,
  contentVersion: 'new',
});
export function VerbEditorPage() {
  const { id } = useParams();
  const { entries, repos, refresh, settings } = useApp();
  const current = entries.find((e) => e.verb.id === id);
  const [verb, setVerb] = useState<Verb>(() => structuredClone(current?.verb ?? emptyVerb()));
  const draftAudio = useCatalogAudio([verb.id], { recordActivity: false });
  const [saving, setSaving] = useState(false);
  const [noticeVisible, setNoticeVisible] = useState(() => {
    try {
      return localStorage.getItem('verbquest.editor.hide-local-notice') !== 'true';
    } catch {
      return true;
    }
  });
  const [neverShowNotice, setNeverShowNotice] = useState(false);
  const variantMemory = useRef(
    new Map<'pastSimple' | 'pastParticiple', { baseline: Variant[]; lastOutput: Variant[] }>(),
  );
  function editedVariants(form: 'pastSimple' | 'pastParticiple', text: string) {
    const currentVariants = verb.forms[form].variants;
    let memory = variantMemory.current.get(form);
    // Keep one baseline throughout typing; an edit through a variant card or JSON starts a new one.
    if (!memory || memory.lastOutput !== currentVariants) {
      memory = { baseline: structuredClone(currentVariants), lastOutput: currentVariants };
      variantMemory.current.set(form, memory);
    }
    const occurrences = new Map<string, number>();
    const next = text.split('/').map((part, index) => {
      const value = part.trim();
      const occurrence = occurrences.get(value) ?? 0;
      occurrences.set(value, occurrence + 1);
      const samePosition = memory.baseline[index];
      const candidates = memory.baseline.filter((variant) => variant.value === value);
      const stored =
        samePosition?.value === value
          ? samePosition
          : candidates.length === 1
            ? candidates[0]
            : candidates[occurrence];
      return { ...stored, value, dialect: stored?.dialect ?? ('all' as const) };
    });
    memory.lastOutput = next;
    return next;
  }
  const initialRecord = useRef(JSON.stringify(verb));
  const [section, setSection] = useState<EditorSection>('identity');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [editorRevision, setEditorRevision] = useState(0);
  const expectedVersion = useRef(current?.verb.contentVersion ?? null);
  const [archiveDraft, setArchiveDraft] = useState(false);
  const [jsonPending, setJsonPending] = useState(false);
  const [error, setError] = useState('');
  const [ipaUpdating, setIpaUpdating] = useState(false);
  const [ipaUpdated, setIpaUpdated] = useState(false);
  const [saved, setSaved] = useState(false);
  const [archive, setArchive] = useState<{ lists: number; plans: number; sessions: number } | null>(
    null,
  );
  const [json, setJson] = useState('');
  const dirty =
    JSON.stringify(verb) !== initialRecord.current ||
    jsonPending ||
    Object.values(fieldErrors).some(Boolean);
  const navigate = useNavigate();
  const blocker = useBlocker(dirty && !saved);
  useEffect(() => {
    const f = (e: BeforeUnloadEvent) => {
      if (dirty && !saved) e.preventDefault();
    };
    window.addEventListener('beforeunload', f);
    return () => window.removeEventListener('beforeunload', f);
  }, [dirty, saved]);
  useEffect(() => {
    if (saved) navigate(`/verbs/${verb.id}`);
  }, [saved]);
  function change(value: Verb) {
    draftAudio.stop();
    setVerb(value);

    setError('');
  }
  async function persistDraft() {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const r = await saveVerb(repos, verb, expectedVersion.current);
      if (r.status === 'saved') {
        await refresh();

        setSaved(true);
      } else
        setError(
          r.status === 'invalid'
            ? r.issues.map((i) => `${i.path}: ${i.message}`).join(' · ')
            : r.status === 'duplicate'
              ? 'Ya existe un verbo con ese infinitivo. Revisa la ficha existente o cambia el identificador y el lema.'
              : 'La ficha ha cambiado en otra pestaña. Recarga antes de guardar.',
        );
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }
  useEffect(() => {
    const loaded = structuredClone(current?.verb ?? emptyVerb());
    initialRecord.current = JSON.stringify(loaded);
    setVerb(loaded);
    expectedVersion.current = current?.verb.contentVersion ?? null;
    variantMemory.current.clear();
    setEditorRevision((r) => r + 1);
    setFieldErrors({});

    setSaved(false);
    setError('');
    setJson('');
    setJsonPending(false);
  }, [id]);
  if (id && !current) return <StatusPanel title="Verbo no encontrado" />;
  return (
    <div className="verb-editor-page">
      <nav className="ve-topbar" aria-label="Navegación del editor">
        <Link className="back-link" to={id ? `/verbs/${id}` : '/verbs'}>
          <span style={{ display: 'inline-flex', transform: 'rotate(180deg)' }}>
            <Icon name="arrow" size={16} />
          </span>
          {id ? 'Volver a la ficha' : 'Biblioteca'}
        </Link>
        <Link className="button secondary" to="/editor/import-export">
          <Icon name="upload" size={16} />
          <span className="ve-action-label">Importar / exportar</span>
        </Link>
      </nav>
      <div className="page-heading ve-heading">
        <div>
          <span className="eyebrow">MODO EDICIÓN · CONTENIDO LOCAL</span>
          <h1>
            {id ? 'Editar verbo' : 'Un nuevo descubrimiento'}
            <span className="dot">.</span>
          </h1>
        </div>
      </div>
      <div className="ve-subject">
        <span className="ve-verb-icon" aria-hidden="true">
          {getVerbIcon(verb)}
        </span>
        <div className="ve-subject-copy">
          <strong lang="en">{verb.lemma || 'Verbo nuevo'}</strong>
          <span>{verb.meanings.join(' · ') || 'Completa los datos de la ficha'}</span>
        </div>
      </div>
      {noticeVisible && (
        <aside
          className="ve-local-notice"
          role="note"
          aria-label="Información sobre los cambios locales"
        >
          <Icon name="info" size={17} />
          <div className="ve-notice-copy">
            <span>Los cambios se guardan en este navegador.</span>
            <label className="ve-notice-options">
              <input
                type="checkbox"
                checked={neverShowNotice}
                onChange={(e) => setNeverShowNotice(e.target.checked)}
              />
              No volver a mostrar este aviso
            </label>
          </div>
          <button
            type="button"
            className="secondary ve-notice-close"
            aria-label="Cerrar aviso"
            title="Cerrar aviso"
            onClick={() => {
              if (neverShowNotice) {
                try {
                  localStorage.setItem('verbquest.editor.hide-local-notice', 'true');
                } catch {
                  /* The notice still closes for this visit. */
                }
              }
              setNoticeVisible(false);
            }}
          >
            <Icon name="close" size={15} />
          </button>
        </aside>
      )}
      <div className={`ve-toolbar${dirty ? ' is-dirty' : ''}${saving ? ' is-saving' : ''}`}>
        <span className="ve-state" role="status">
          <span className="ve-state-icon">
            <Icon name={saving ? 'clock' : dirty ? 'edit' : 'check'} size={17} />
          </span>
          <span className="ve-state-copy">
            <strong>
              {saving
                ? 'Guardando…'
                : dirty
                  ? 'Edición pendiente'
                  : current
                    ? 'Sin cambios pendientes'
                    : 'Nueva ficha'}
            </strong>
            <small>
              {dirty
                ? 'Guarda para aplicar los cambios'
                : current
                  ? 'Puedes empezar a editar'
                  : 'Completa los datos y guarda'}
              {verb.archivedAt ? ' · Archivado' : ''}
            </small>
          </span>
        </span>
        <div className="ve-actions">
          <button
            type="submit"
            form="verb-editor-form"
            aria-label="Guardar verbo"
            title={
              saving
                ? 'Guardando los cambios'
                : !dirty
                  ? 'No hay cambios pendientes'
                  : 'Guardar los cambios del verbo'
            }
            disabled={!dirty || saving}
          >
            <Icon name="save" size={16} />
            <span className="ve-action-label">{saving ? 'Guardando…' : 'Guardar verbo'}</span>
          </button>
          <Link
            to="/verbs"
            className="button secondary"
            aria-label="Cancelar edición"
            title="Cancelar edición"
          >
            <Icon name="close" size={16} />
            <span className="ve-action-label">Cancelar edición</span>
          </Link>
          {current && !current.verb.archivedAt && (
            <button
              type="button"
              className="secondary ve-archive"
              aria-label="Archivar verbo"
              title={dirty ? 'Guarda los cambios antes de archivar' : 'Archivar verbo'}
              disabled={dirty}
              onClick={async () => {
                const i = await getArchiveImpact(repos, verb.id);
                setArchiveDraft(false);
                setArchive({
                  lists: i.listIds.length,
                  plans: i.planIds.length,
                  sessions: i.sessionIds.length,
                });
              }}
            >
              <Icon name="archive" size={16} />
              <span className="ve-action-label">Archivar verbo</span>
            </button>
          )}
          {current?.verb.archivedAt && (
            <button
              type="button"
              className="secondary"
              aria-label="Restaurar verbo"
              title="Restaurar verbo"
              disabled={dirty}
              onClick={async () => {
                try {
                  await restoreVerb(repos, verb.id);
                  await refresh();

                  setSaved(true);
                } catch (e) {
                  setError(String(e));
                }
              }}
            >
              <Icon name="restore" size={16} />
              <span className="ve-action-label">Restaurar verbo</span>
            </button>
          )}
        </div>
      </div>
      <nav className="ve-nav" aria-label="Secciones del editor">
        {editorSections.map(([key, label, icon]) => (
          <button
            key={key}
            type="button"
            aria-label={label}
            title={label}
            aria-pressed={section === key}
            className="secondary"
            onClick={() => {
              draftAudio.stop();
              setSection(key);
            }}
          >
            <Icon name={icon} size={16} />
            <span className="ve-nav-label">{label}</span>
          </button>
        ))}
      </nav>
      {error && (
        <p className="ve-error" role="alert">
          {error}
        </p>
      )}
      <section className="panel">
        <form
          id="verb-editor-form"
          noValidate
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            if (Object.values(fieldErrors).some(Boolean)) {
              setSection('classification');
              setError(Object.values(fieldErrors).filter(Boolean).join(' · '));
              return;
            }
            if (jsonPending) {
              setSection('json');
              setError(
                'Aplica el JSON al formulario o vuelve a cargar los datos actuales antes de guardar.',
              );
              return;
            }
            const checked = validate<Verb>('verb', verb);
            if (!checked.ok) {
              setError(checked.issues.map((i) => `${i.path}: ${i.message}`).join(' · '));
              return;
            }
            if (verb.archivedAt && !current?.verb.archivedAt) {
              const i = await getArchiveImpact(repos, verb.id);
              setArchiveDraft(true);
              setArchive({
                lists: i.listIds.length,
                plans: i.planIds.length,
                sessions: i.sessionIds.length,
              });
              return;
            }
            await persistDraft();
          }}
        >
          {section === 'forms' && (
            <div className="ve-preview-toolbar">
              <button
                type="button"
                className="secondary"
                disabled={
                  !verb.forms.base.value.trim() ||
                  [...verb.forms.pastSimple.variants, ...verb.forms.pastParticiple.variants].some(
                    (v) => !v.value.trim(),
                  )
                }
                aria-label="Probar las tres formas"
                title="Probar las tres formas del borrador"
                onClick={() => void draftAudio.play(verb)}
              >
                <Icon name={draftAudio.playingKey === verb.id ? 'stop' : 'sound'} size={16} />
                Probar las tres formas
              </button>
            </div>
          )}
          <p className="ve-preview-status" role="status">
            {draftAudio.message}
          </p>
          <VerbEditorFields
            key={`${id ?? 'new'}:${editorRevision}`}
            verb={verb}
            change={change}
            section={section}
            existing={!!id}
            preview={{
              verbId: verb.id,
              playingKey: draftAudio.playingKey,
              play: (form, value, dialect) => void draftAudio.play(verb, form, value, dialect),
            }}
            editedVariants={editedVariants}
            onValidity={(key, message) => {
              setFieldErrors((errors) => ({ ...errors, [key]: message }));
            }}
          />
          <section className="ve-section" hidden={section !== 'json'}>
            <details open className="ve-advanced">
              <summary>Todos los campos: ejemplos, audio, fuentes y etiquetas</summary>
              <p className="small">
                Editor avanzado JSON. Al aplicar se conservan todos los campos; el guardado validará
                su estructura. No se ejecuta su contenido.
              </p>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setJson(JSON.stringify(verb, null, 2));
                  setJsonPending(false);
                }}
              >
                Cargar datos actuales
              </button>
              <label>
                Datos completos de la ficha
                <textarea
                  className="code-editor"
                  value={json}
                  onChange={(e) => {
                    setJson(e.target.value);
                    setJsonPending(true);
                  }}
                />
              </label>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  try {
                    const checked = validate<Verb>('verb', JSON.parse(json));
                    if (!checked.ok)
                      throw Error(checked.issues.map((i) => i.path + ': ' + i.message).join(' · '));
                    const next = checked.value;
                    if (id && next.id !== id) throw Error('El identificador no se puede cambiar');
                    if (
                      next.contentVersion !== verb.contentVersion ||
                      next.updatedAt !== verb.updatedAt
                    )
                      throw Error('La versión y la fecha de modificación son campos protegidos.');
                    change(next);
                    variantMemory.current.clear();
                    setEditorRevision((r) => r + 1);
                    setFieldErrors({});
                    setJsonPending(false);
                  } catch (e) {
                    setError(String(e));
                  }
                }}
              >
                Aplicar JSON al formulario
              </button>
            </details>
          </section>
        </form>
      </section>
      {current?.pendingBase && (
        <section className="panel">
          <h2>Hay una actualización del contenido base</h2>
          <p>Tu edición local se ha conservado. Elige qué versión usar.</p>
          {settings.strictIpa && (
            <button
              className="secondary"
              disabled={dirty || ipaUpdating}
              onClick={async () => {
                setIpaUpdating(true);
                setError('');
                try {
                  const updated = await resolveSeedConflict(repos, verb.id, 'ipa_only');
                  if (updated) {
                    setVerb(updated);
                    initialRecord.current = JSON.stringify(updated);
                    expectedVersion.current = updated.contentVersion;
                    setEditorRevision((r) => r + 1);
                  }
                  await refresh();
                  setIpaUpdated(true);
                } catch (error) {
                  setError(String(error));
                } finally {
                  setIpaUpdating(false);
                }
              }}
            >
              Actualizar solo IPA y conservar mi ficha
            </button>
          )}
          {(['keep_local', 'accept_base'] as const).map((c) => (
            <button
              key={c}
              className="secondary"
              disabled={dirty || ipaUpdating}
              onClick={async () => {
                await resolveSeedConflict(repos, verb.id, c);
                await refresh();
                window.location.reload();
              }}
            >
              {c === 'keep_local' ? 'Conservar mi edición' : 'Usar versión base'}
            </button>
          ))}
        </section>
      )}
      {ipaUpdated && (
        <p role="status">
          Se han actualizado las transcripciones coincidentes. Tus otros cambios se conservan.
        </p>
      )}
      {archive && (
        <Dialog title="Archivar este verbo" onClose={() => setArchive(null)}>
          <p>
            Afecta a {archive.lists} listas, hasta {archive.plans} planes y {archive.sessions}{' '}
            sesiones. Se omitirán preguntas pendientes; el historial se conserva. Puedes restaurarlo
            después.
          </p>
          <button
            className="danger"
            onClick={async () => {
              try {
                if (archiveDraft) {
                  setArchive(null);
                  await persistDraft();
                } else {
                  await archiveVerb(repos, verb.id, systemClock);
                  await refresh();
                  setArchive(null);

                  setSaved(true);
                }
              } catch (e) {
                setError(String(e));
                setArchive(null);
              }
            }}
          >
            Confirmar archivo
          </button>
        </Dialog>
      )}
      {blocker.state === 'blocked' && (
        <Dialog title="Cambios sin guardar" onClose={() => blocker.reset()}>
          <p>Si sales, se perderán los cambios de este formulario.</p>
          <div className="actions">
            <button onClick={() => blocker.proceed()}>Salir sin guardar</button>
            <button className="secondary" onClick={() => blocker.reset()}>
              Seguir editando
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
