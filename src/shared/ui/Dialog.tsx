import './dialog.css';
import { Icon } from './Icon';
import { useEffect, useRef, type ReactNode } from 'react';
export function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.showModal();
    return () => {
      ref.current?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="app-dialog"
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <header className="row">
        <h2>{title}</h2>
        <button
          type="button"
          className="icon-button dialog-close"
          aria-label="Cerrar"
          title="Cerrar diálogo"
          onClick={onClose}
        >
          <Icon name="close" size={16} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
