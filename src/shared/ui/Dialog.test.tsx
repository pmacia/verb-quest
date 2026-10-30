import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { Dialog } from './Dialog';

it('lets the caller decide whether Escape closes the dialog, preventing native dismissal', () => {
  const close = vi.fn();
  const prototype = HTMLDialogElement.prototype;
  const originalShow = Object.getOwnPropertyDescriptor(prototype, 'showModal');
  const originalClose = Object.getOwnPropertyDescriptor(prototype, 'close');
  Object.defineProperty(prototype, 'showModal', { configurable: true, value: vi.fn() });
  Object.defineProperty(prototype, 'close', { configurable: true, value: vi.fn() });
  const view = render(
    <Dialog title="Archivo en curso" onClose={close}>
      Guardando…
    </Dialog>,
  );
  const cancel = new Event('cancel', { bubbles: false, cancelable: true });
  fireEvent(screen.getByRole('dialog', { hidden: true }), cancel);
  expect(cancel.defaultPrevented).toBe(true);
  expect(close).toHaveBeenCalledOnce();
  view.unmount();
  if (originalShow) Object.defineProperty(prototype, 'showModal', originalShow);
  else Reflect.deleteProperty(prototype, 'showModal');
  if (originalClose) Object.defineProperty(prototype, 'close', originalClose);
  else Reflect.deleteProperty(prototype, 'close');
});
