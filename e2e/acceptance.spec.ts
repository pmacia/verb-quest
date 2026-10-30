import { test, expect } from '@playwright/test';
test.use({ timezoneId: 'Europe/Madrid' });
test('filters combine, lists feed games and archive preserves references', async ({ page }) => {
  await page.goto('/verbs');
  await page.getByRole('button', { name: 'Filtros', exact: true }).click();
  await page.getByLabel('Curso', { exact: true }).selectOption('eso2');
  await page.getByLabel('Relación de formas').selectOption('past_participle_same');
  await expect(page.getByRole('link', { name: /^buy/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /^go\s/ })).toHaveCount(0);
  await page.getByRole('button', { name: /Quitar courses/ }).click();
  await page.getByRole('button', { name: /Quitar relations/ }).click();
  for (const id of ['be', 'go', 'take', 'buy', 'write'])
    await page.getByRole('checkbox', { name: `Seleccionar ${id}`, exact: true }).check();
  await page.getByRole('button', { name: 'Guardar selección' }).click();
  await page.getByLabel('Nombre de la lista').fill('Examen aceptación');
  await page.getByRole('button', { name: 'Guardar lista', exact: true }).click();
  await page.getByRole('link', { name: 'Juegos', exact: true }).click();
  await page
    .getByLabel('Selección de verbos')
    .selectOption({ label: 'Examen aceptación · 5 verbos' });
  await page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: 'Flashcards' }) })
    .getByRole('button', { name: 'Jugar ahora' })
    .click();
  await page.getByRole('button', { name: 'Revelar respuesta' }).click();
  await page.getByRole('button', { name: 'No lo sabía', exact: true }).click();
  await page.getByRole('button', { name: 'Terminar sesión', exact: true }).click();
  await page.goto('/editor/verbs/be');
  await page.getByRole('button', { name: 'Archivar verbo', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Archivar este verbo' })).toContainText('1 listas');
  await page.getByRole('button', { name: 'Confirmar archivo' }).click();
  await expect(page.getByText('Este verbo está archivado.', { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Este verbo está archivado.', { exact: false })).toBeVisible();
});
test('four spaced written sessions cover base past and participle without improving other skills', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-10-29T12:00:00Z'));
  await page.goto('/plans/new');
  await page.getByLabel('Nombre del plan').fill('Solo go · escritura');
  await page.getByLabel('Origen de los verbos').selectOption('manual');
  await page.getByLabel('go · ir', { exact: true }).check();
  await page.getByLabel('Aprender y repasar todas las habilidades', { exact: true }).uncheck();
  await page.getByLabel('Escritura', { exact: true }).check();
  const field = page
    .locator('fieldset')
    .filter({ has: page.getByText('Modalidades', { exact: true }) });
  for (const check of await field.getByRole('checkbox').all()) await check.uncheck();
  await page.getByLabel('Memoria y escritura', { exact: true }).check();
  await page.getByRole('button', { name: 'Guardar y preparar sesión' }).click();
  await expect(page.getByRole('heading', { name: 'Solo go · escritura' })).toBeVisible();
  const url = page.url();
  for (const date of ['2026-10-29', '2026-10-30', '2026-11-02', '2026-11-09']) {
    await page.clock.setFixedTime(new Date(date + 'T12:00:00Z'));
    await page.goto(url);
    await page.getByRole('button', { name: 'Comenzar sesión' }).click();
    for (let i = 0; i < 3; i++) {
      const prompt = await page.locator('.question-prompt').innerText();
      const answer = prompt.includes('pasado simple')
        ? 'went'
        : prompt.includes('participio')
          ? 'gone'
          : 'go';
      await page.getByLabel('Tu respuesta', { exact: true }).fill(answer);
      await page.getByRole('button', { name: 'Comprobar', exact: true }).click();
      await expect(page.getByRole('heading', { name: '¡Bien recordado!' })).toBeVisible();
      await page
        .getByRole('button', { name: i === 2 ? 'Ver resumen' : 'Siguiente pregunta', exact: false })
        .click();
    }
    await expect(page.getByRole('heading', { name: 'Lo de hoy ya cuenta.' })).toBeVisible();
  }
  await page.goto('/progress');
  await expect(page.getByText('1 de 5 habilidades dominadas', { exact: true })).toBeVisible();
  await expect(page.getByText('Próximo repaso: 2026-11-23', { exact: true })).toBeVisible();
  await expect(page.getByText('Pronunciación: sin evaluar.', { exact: false })).toBeVisible();
});
