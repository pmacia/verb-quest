import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('editing is a switch with per-row actions and a separate new-verb button', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/verbs');
  const toggle = page.getByRole('switch', { name: 'Modo de edición del catálogo' });
  await expect(toggle).not.toBeChecked();
  await expect(page.getByRole('link', { name: 'Crear verbo', exact: true })).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Quitar go del catálogo', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Buscar verbos' }).fill('went');
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toBeChecked();
  await expect(page).toHaveURL(/\/verbs$/);
  await expect(page.getByRole('textbox', { name: 'Buscar verbos' })).toHaveValue('went');
  await expect(page.getByRole('link', { name: 'Editar go', exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Quitar go del catálogo', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Escuchar las tres formas de go', exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.setViewportSize({ width: 600, height: 900 });
  await expect(page.locator('.verb-table-head')).toBeVisible();
  expect(
    await page
      .locator('.verb-row')
      .evaluate((row) => getComputedStyle(row).gridTemplateColumns.split(' ').length),
  ).toBe(6);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('link', { name: 'Crear verbo', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Un nuevo descubrimiento' })).toBeVisible();
  await page.goto('/verbs');
  await toggle.click();
  await page.getByRole('link', { name: 'Editar go', exact: true }).click();
  await expect(page.getByLabel('Forma base', { exact: true })).toHaveValue('go');
});

test('row removal is confirmed, reversible and leaves saved list references intact', async ({
  page,
}) => {
  await page.goto('/verbs');
  await page.getByRole('checkbox', { name: 'Seleccionar go', exact: true }).check();
  await page.getByRole('button', { name: 'Guardar selección' }).click();
  await page.getByLabel('Nombre de la lista').fill('Mi lista conservada');
  await page.getByRole('button', { name: 'Guardar lista', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Mi lista conservada 1', exact: true }),
  ).toBeVisible();
  const toggle = page.getByRole('switch', { name: 'Modo de edición del catálogo' });
  await toggle.click();
  await page.getByRole('button', { name: 'Quitar go del catálogo', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Quitar go del catálogo', exact: true });
  await expect(dialog).toContainText('1 listas');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Ver ficha de go', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Quitar go del catálogo', exact: true }).click();
  await dialog.getByRole('button', { name: 'Archivar verbo', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Ver ficha de go', exact: true })).toHaveCount(0);
  await expect(toggle).toBeFocused();
  await expect(
    page.getByRole('button', { name: 'Mi lista conservada 1', exact: true }),
  ).toBeVisible();
  await page.getByLabel('Ver archivados', { exact: true }).check();
  await page.getByRole('button', { name: 'Restaurar go', exact: true }).click();
  await page.getByLabel('Ver archivados', { exact: true }).uncheck();
  await expect(page.getByRole('link', { name: 'Ver ficha de go', exact: true })).toBeVisible();
  await toggle.click();
  await expect(page.getByRole('link', { name: 'Editar go', exact: true })).toHaveCount(0);
});

test('the library speaker plays three forms without navigating or evaluating mastery', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const spoken: string[] = [];
    Object.defineProperty(window, '__verbquestSpoken', { value: spoken });
    const voices = [{ voiceURI: 'test-uk', lang: 'en-GB', name: 'Test UK', localService: true }];
    let timer: ReturnType<typeof setTimeout>;
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
        getVoices: () => voices,
        addEventListener() {},
        removeEventListener() {},
        pause() {},
        resume() {},
        cancel() {
          clearTimeout(timer);
        },
        speak(u: { text: string; onstart: () => void; onend: () => void }) {
          spoken.push(u.text);
          u.onstart();
          timer = setTimeout(() => u.onend(), 15);
        },
      },
    });
  });
  await page.goto('/verbs');
  await page.getByRole('button', { name: 'Escuchar las tres formas de go', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { __verbquestSpoken: string[] }).__verbquestSpoken),
    )
    .toEqual(['go', 'went', 'gone']);
  await expect(page.getByRole('status')).toContainText('Tres formas de go reproducidas');
  await expect(page).toHaveURL(/\/verbs$/);
  await expect(
    page.getByRole('checkbox', { name: 'Seleccionar go', exact: true }),
  ).not.toBeChecked();
  await page.goto('/progress');
  await expect(page.locator('.level-card')).toContainText('0 XP');
  await expect(page.getByText('0 de 120 verbos', { exact: true })).toHaveCount(5);
});
