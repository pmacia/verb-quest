import { useEffect, useState } from 'react';
import { useApp } from '../../app/app-context';
import type { Verb } from '../../shared/domain/types';
import { systemClock } from '../../shared/time/clock';
import { Dialog } from '../../shared/ui/Dialog';
import { archiveVerb, getArchiveImpact } from './editor-service';

export function CatalogArchiveDialog({
  verb,
  onClose,
  onArchived,
}: {
  verb: Verb;
  onClose: () => void;
  onArchived: () => void;
}) {
  const { repos, refresh } = useApp();
  const [impact, setImpact] = useState<Awaited<ReturnType<typeof getArchiveImpact>> | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setError('');
    getArchiveImpact(repos, verb.id)
      .then((value) => {
        if (active) setImpact(value);
      })
      .catch(() => {
        if (active) setError('No se pudo consultar el impacto. Vuelve a intentarlo.');
      });
    return () => {
      active = false;
    };
  }, [repos, verb.id, attempt]);
  return (
    <Dialog
      title={`Quitar ${verb.lemma} del catálogo`}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <p>
        El verbo se archivará. Podrás recuperarlo desde «Ver archivados». Su historial y las
        referencias en tus listas se conservarán.
      </p>
      {impact ? (
        <p>
          Presente en {impact.listIds.length} listas, hasta {impact.planIds.length} planes y{' '}
          {impact.sessionIds.length} sesiones pendientes.
        </p>
      ) : (
        <p>Consultando el impacto…</p>
      )}
      {error && <p role="alert">{error}</p>}
      {error && !impact && (
        <button className="secondary" onClick={() => setAttempt(attempt + 1)}>
          Reintentar
        </button>
      )}
      <div className="row">
        <button className="secondary" disabled={busy} onClick={onClose}>
          Cancelar
        </button>
        <button
          disabled={!impact || busy}
          onClick={async () => {
            setBusy(true);
            setError('');
            try {
              await archiveVerb(repos, verb.id, systemClock);
              await refresh();
              onArchived();
            } catch {
              setError('No se pudo archivar el verbo. Vuelve a intentarlo.');
              setBusy(false);
            }
          }}
        >
          Archivar verbo
        </button>
      </div>
    </Dialog>
  );
}
