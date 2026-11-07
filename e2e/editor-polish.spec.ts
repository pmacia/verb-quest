import { test, expect } from '@playwright/test';

test('editor identity and icon are separate from the title and persist across catalogue/detail', async ({
  page,
}) => {
  await page.goto('/editor/verbs/awake');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Editar verbo.');
  await expect(page.locator('.ve-subject')).toContainText('awake');
  await page.getByRole('button', { name: 'Elegir icono 🌅', exact: true }).click();
  await expect(page.getByLabel('Icono representativo', { exact: true })).toHaveValue('🌅');
  await page.getByRole('button', { name: 'Guardar verbo', exact: true }).click();
  await expect(page).toHaveURL(new URL('/verbs/awake', page.url()).href);
  await expect(page.locator('.vd-verb-icon')).toHaveText('🌅');
  await page.goto('/verbs');
  await page.getByLabel('Buscar verbos').fill('awake');
  await expect(page.locator('.cq-verb-icon')).toHaveText('🌅');
  await page.goto('/editor/verbs/awake');
  await expect(page.getByLabel('Icono representativo', { exact: true })).toHaveValue('🌅');
});

test('local notice can be dismissed permanently and pending actions remain available on scroll', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/editor/verbs/awake');
  await expect(page.getByRole('button', { name: 'Guardar verbo', exact: true })).toBeDisabled();
  await page.getByLabel('No volver a mostrar este aviso', { exact: true }).check();
  await page.getByRole('button', { name: 'Cerrar aviso', exact: true }).click();
  await page.reload();
  await expect(
    page.getByText('Los cambios se guardan en este navegador.', { exact: true }),
  ).toHaveCount(0);
  const notes = page.getByLabel('Notas de significado', { exact: true });
  const original = await notes.inputValue();
  await notes.fill('Nota temporal');
  await expect(page.getByRole('button', { name: 'Guardar verbo', exact: true })).toBeEnabled();
  await notes.fill(original);
  await expect(page.getByRole('button', { name: 'Guardar verbo', exact: true })).toBeDisabled();
  await notes.fill('Nota pendiente de guardar');
  await expect(page.locator('.ve-toolbar')).toHaveClass(/is-dirty/);
  await expect(page.getByRole('button', { name: 'Guardar verbo', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Formas y sonidos', exact: true }).click();
  await page.locator('.ve-content').evaluate((e) => window.scrollTo(0, e.scrollHeight));
  await expect(page.getByRole('button', { name: 'Guardar verbo', exact: true })).toBeInViewport();
  await expect(page.getByRole('link', { name: 'Cancelar edición', exact: true })).toBeInViewport();
});

test('draft audio previews use current forms and sentences without saving or awarding activity', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const spoken: { text: string; lang: string }[] = [];
    Object.defineProperty(window, '__editorSpoken', { value: spoken });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      value: class {
        text: string;
        constructor(text: string) {
          this.text = text;
        }
      },
    });
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        getVoices: () => [
          { voiceURI: 'uk', name: 'UK', lang: 'en-GB', localService: true },
          { voiceURI: 'us', name: 'US', lang: 'en-US', localService: true },
        ],
        addEventListener() {},
        removeEventListener() {},
        pause() {},
        resume() {},
        cancel() {},
        speak(u: { text: string; lang: string; onstart: () => void; onend: () => void }) {
          spoken.push({ text: u.text, lang: u.lang });
          u.onstart();
          setTimeout(() => u.onend(), 10);
        },
      },
    });
  });
  await page.goto('/editor/verbs/read');
  await page.getByRole('button', { name: 'Formas y sonidos', exact: true }).click();
  await page.getByRole('button', { name: 'Probar infinitivo', exact: true }).click();
  await expect(page.locator('.ve-preview-status')).toContainText('Audio reproducido.');
  await page
    .getByRole('button', {
      name: 'Probar pronunciación US de pasado simple, variante 1',
      exact: true,
    })
    .click();
  await expect(page.locator('.ve-preview-status')).toContainText('Audio reproducido.');
  await page.getByLabel('Escritura del infinitivo', { exact: true }).fill('write');
  await page.getByRole('button', { name: 'Probar infinitivo', exact: true }).click();
  await expect(page.locator('.ve-preview-status')).toContainText('Audio reproducido.');
  await page.getByRole('button', { name: 'Ejemplos', exact: true }).click();
  await page.getByLabel('Frase del ejemplo 1', { exact: true }).fill('We write a new example.');
  await page.getByRole('button', { name: 'Probar frase del ejemplo 1', exact: true }).click();
  await expect(page.locator('.ve-example-audio .audio-played').first()).toHaveAttribute(
    'title',
    'Audio reproducido.',
  );
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { __editorSpoken: { text: string; lang: string }[] }).__editorSpoken,
    ),
  ).toEqual([
    { text: 'reed', lang: 'en-GB' },
    { text: 'red', lang: 'en-US' },
    { text: 'write', lang: 'en-GB' },
    { text: 'We write a new example.', lang: 'en-GB' },
  ]);
  const persisted = await page.evaluate(
    () =>
      new Promise<{ value: string; awards: number }>((resolve, reject) => {
        const r = indexedDB.open('verbquest');
        r.onerror = () => reject(r.error);
        r.onsuccess = () => {
          const db = r.result,
            tx = db.transaction(['catalog', 'awards'], 'readonly');
          let value = '',
            awards = 0;
          const record = tx.objectStore('catalog').get('read');
          record.onsuccess = () => (value = record.result.verb.forms.base.value);
          const count = tx.objectStore('awards').count();
          count.onsuccess = () => (awards = count.result);
          tx.oncomplete = () => {
            db.close();
            resolve({ value, awards });
          };
        };
      }),
  );
  expect(persisted).toEqual({ value: 'read', awards: 0 });
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`editor identity, icon picker and pending state stay readable in ${colorScheme} mobile theme`, async ({
    page,
  }) => {
    const { default: AxeBuilder } = await import('@axe-core/playwright');
    await page.emulateMedia({ colorScheme });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/editor/verbs/awake');
    await expect(page.locator('.ve-subject')).toBeVisible();
    await expect(page.locator('.ve-icon-options')).toBeVisible();
    await expect
      .poll(async () => (await page.locator('.ve-icon-options').boundingBox())?.width ?? 0)
      .toBeGreaterThan(200);
    await expect
      .poll(
        async () =>
          (await page.getByLabel('Icono representativo', { exact: true }).boundingBox())?.width ??
          0,
      )
      .toBeGreaterThan(200);
    for (const pending of [false, true]) {
      if (pending)
        await page.getByLabel('Notas de significado', { exact: true }).fill('Pendiente de guardar');
      await page.screenshot({ animations: 'disabled' });
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(result.violations).toEqual([]);
    }
  });
}
