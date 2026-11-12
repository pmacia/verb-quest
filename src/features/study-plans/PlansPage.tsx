import { useNavigate } from 'react-router-dom';
import { PlanLibrary } from './PlanLibrary';
import { usePlanStarter } from './use-plan-starter';
export function PlansPage() {
  const starter = usePlanStarter();
  const navigate = useNavigate();
  return (
    <div className="study-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">UN CAMINO A TU MEDIDA</span>
          <h1>
            Planes de estudio<span className="dot">.</span>
          </h1>
          <p>Elige una propuesta lista para empezar o prepara tu propio camino.</p>
        </div>
      </div>
      {starter.error && (
        <p className="notice" role="alert">
          {starter.error}
        </p>
      )}
      <PlanLibrary
        startingId={starter.startingId}
        onStart={async (plan, listId) => {
          if (await starter.start(plan, listId)) navigate('/study');
        }}
      />
    </div>
  );
}
