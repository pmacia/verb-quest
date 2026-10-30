import { Link } from 'react-router-dom';
export function StatusPanel({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="empty panel">
      <h2>{title}</h2>
      {children}
      <Link className="button secondary" to="/verbs">
        Explorar verbos
      </Link>
    </div>
  );
}
