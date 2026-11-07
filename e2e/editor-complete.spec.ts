import { test, expect } from '@playwright/test';

test('structured editor covers pronunciation, variants, examples, sources and optional forms without JSON', async ({
  page,
}) => {
  await page.goto('/editor/verbs/burn');
  await page.getByRole('button', { name: 'Ejemplos', exact: true }).click();
  await expect(page.getByLabel('Frase del ejemplo 1', { exact: true })).toBeVisible();
  await page.getByLabel('Frase del ejemplo 1', { exact: true }).fill('The fire can burn the wood.');
  await page
    .getByLabel('Traducción del ejemplo 1', { exact: true })
    .fill('El fuego puede quemar la madera.');
  await page.getByRole('button', { name: 'Fuentes', exact: true }).click();
  await page.getByRole('button', { name: 'Añadir fuente', exact: true }).click();
  await page
    .getByLabel(/^Etiqueta de la fuente /)
    .last()
    .fill('Fuente de prueba');
  await page
    .getByLabel(/^Licencia de la fuente /)
    .last()
    .fill('CC BY 4.0');
  await page.getByRole('button', { name: 'Formas y sonidos', exact: true }).click();
  await page.getByLabel('IPA UK del infinitivo', { exact: true }).fill('/bɜːn/');
  await page.getByText('Audio UK del infinitivo', { exact: true }).click();
  await page.getByLabel('Audio UK del infinitivo: estado', { exact: true }).selectOption('url');
  await page
    .getByLabel('Audio UK del infinitivo: URL', { exact: true })
    .fill('https://example.org/burn.mp3');
  await page
    .getByLabel('Fuente del audio UK del infinitivo', { exact: true })
    .fill('Grabación de prueba');
  await page.getByLabel('Licencia del audio UK del infinitivo', { exact: true }).fill('CC0');
  await page.getByRole('button', { name: 'Añadir tercera persona', exact: true }).click();
  await page.getByLabel('Escritura de tercera persona, variante 1', { exact: true }).fill('burns');
  await page.getByRole('button', { name: 'Guardar verbo', exact: true }).click();
  await expect(page).toHaveURL(new URL('/verbs/burn', page.url()).href);
  await page.goto('/editor/verbs/burn');
  await page.getByRole('button', { name: 'Formas y sonidos', exact: true }).click();
  await page.getByText('Audio UK del infinitivo', { exact: true }).click();
  await expect(page.getByLabel('Audio UK del infinitivo: URL', { exact: true })).toHaveValue(
    'https://example.org/burn.mp3',
  );
  await expect(
    page.getByLabel('Escritura de tercera persona, variante 1', { exact: true }),
  ).toHaveValue('burns');
  await expect(page.getByLabel('Identificador estable', { exact: true })).toBeDisabled();
});

test('optional fields, record keys and protected metadata round-trip without dropping untouched content', async ({
  page,
}) => {
  await page.goto('/editor/verbs/burn');
  await page.getByRole('button', { name: 'JSON', exact: true }).click();
  await page.getByRole('button', { name: 'Cargar datos actuales', exact: true }).click();
  const original = JSON.parse(await page.getByLabel('Datos completos de la ficha').inputValue());
  const fixture = structuredClone(original);
  fixture.meaningNotes = 'Nota de significado original';
  fixture.forms.base.pronunciation.other = [
    {
      ipa: '/bɜːn/',
      audioUrl: null,
      audioSource: 'Alternativa',
      audioLicense: 'CC0',
      validated: false,
    },
  ];
  fixture.forms.thirdPersonSingular = {
    variants: [
      {
        value: 'burns',
        dialect: 'all',
        translation: 'quema',
        usageNote: 'Tercera persona',
        pronunciation: { uk: { ipa: '/bɜːnz/', validated: true } },
      },
    ],
    usageNotes: ['Nota de grupo'],
  };
  fixture.forms.presentParticiple = { variants: [{ value: 'burning', translation: 'quemando' }] };
  fixture.forms.otherForms = [
    {
      label: 'Forma contextual',
      group: {
        variants: [{ value: 'burn', dialect: 'other', usageNote: 'Uso contextual' }],
        usageNotes: ['Otra nota'],
      },
    },
  ];
  fixture.classification.spellingEndings = { pastSimple: ['-urnt', '-urned'] };
  fixture.classification.phoneticEndings = { pastParticiple: ['/nt/', '/nd/'] };
  fixture.mnemonics = ['Fuego y calor'];
  fixture.examples[0].audioUrl = null;
  fixture.examples[0].acceptedAnswers = ['burn', 'burns'];
  fixture.createdAt = '2026-01-02T10:20:30Z';
  await page.getByLabel('Datos completos de la ficha').fill(JSON.stringify(fixture));
  await page.getByRole('button', { name: 'Aplicar JSON al formulario', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: 'Datos del verbo', exact: true }).click();
  await page.getByLabel('Notas de significado', { exact: true }).fill('Nota revisada');
  await page.getByRole('button', { name: 'Formas y sonidos', exact: true }).click();
  await expect(page.getByLabel('Escritura de gerundio, variante 1', { exact: true })).toHaveValue(
    'burning',
  );
  await expect(page.getByLabel('Etiqueta de la forma adicional 1', { exact: true })).toHaveValue(
    'Forma contextual',
  );
  await page
    .getByLabel('Nota de uso de tercera persona, variante 1', { exact: true })
    .fill('Nota revisada de variante');
  await page.getByRole('button', { name: 'Clasificación', exact: true }).click();
  await page.getByLabel('Clave de terminaciones escritas 1', { exact: true }).fill('customPast');
  await page
    .getByLabel('Valores de terminaciones escritas 1', { exact: true })
    .fill('-urnt\n-urned\n-custom');
  await page.getByRole('button', { name: 'Notas y pistas', exact: true }).click();
  await page
    .getByLabel('Pistas para recordar (una por línea)', { exact: true })
    .fill('Fuego y calor\nSegunda pista');
  await page.getByRole('button', { name: 'Registro', exact: true }).click();
  await expect(page.getByLabel('Versión del contenido', { exact: true })).toBeDisabled();
  await expect(page.getByLabel('Última modificación', { exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Guardar verbo', exact: true }).click();
  await expect(page).toHaveURL(new URL('/verbs/burn', page.url()).href);
  await page.goto('/editor/verbs/burn');
  await page.getByRole('button', { name: 'JSON', exact: true }).click();
  await page.getByRole('button', { name: 'Cargar datos actuales', exact: true }).click();
  const saved = JSON.parse(await page.getByLabel('Datos completos de la ficha').inputValue());
  const expected = {
    ...fixture,
    meaningNotes: 'Nota revisada',
    mnemonics: ['Fuego y calor', 'Segunda pista'],
  };
  expected.forms.thirdPersonSingular.variants[0].usageNote = 'Nota revisada de variante';
  expected.classification.spellingEndings = { customPast: ['-urnt', '-urned', '-custom'] };
  expect({
    ...saved,
    contentVersion: fixture.contentVersion,
    updatedAt: fixture.updatedAt,
  }).toEqual(expected);
  const tampered = { ...saved, contentVersion: 'manual-change' };
  await page.getByLabel('Datos completos de la ficha').fill(JSON.stringify(tampered));
  await page.getByRole('button', { name: 'Aplicar JSON al formulario', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('campos protegidos');
});

test('quick variant editing preserves distinct metadata of homographs', async ({ page }) => {
  await page.goto('/editor/verbs/burn');
  await page.getByRole('button', { name: 'JSON', exact: true }).click();
  await page.getByRole('button', { name: 'Cargar datos actuales', exact: true }).click();
  const fixture = JSON.parse(await page.getByLabel('Datos completos de la ficha').inputValue());
  fixture.forms.pastSimple.variants = [
    {
      value: 'burnt',
      dialect: 'uk',
      translation: 'quemé',
      usageNote: 'Variante UK',
      pronunciation: { uk: { ipa: '/bɜːnt/', validated: true } },
    },
    {
      value: 'burnt',
      dialect: 'us',
      translation: 'quemó',
      usageNote: 'Variante US',
      pronunciation: { us: { ipa: '/bɜːrnt/', validated: false } },
    },
  ];
  await page.getByLabel('Datos completos de la ficha').fill(JSON.stringify(fixture));
  await page.getByRole('button', { name: 'Aplicar JSON al formulario', exact: true }).click();
  await page.getByRole('button', { name: 'Formas y sonidos', exact: true }).click();
  const quick = page.getByLabel('Pasado simple (variantes separadas por /)', { exact: true });
  await quick.focus();
  await quick.press('End');
  await quick.press('Backspace');
  await quick.press('t');
  await quick.press('Home');
  await quick.press('ArrowRight');
  await quick.press('ArrowRight');
  await quick.press('ArrowRight');
  await quick.press('ArrowRight');
  await quick.press('ArrowRight');
  await quick.press('Backspace');
  await quick.press('t');
  await page.getByRole('button', { name: 'JSON', exact: true }).click();
  await page.getByRole('button', { name: 'Cargar datos actuales', exact: true }).click();
  const result = JSON.parse(await page.getByLabel('Datos completos de la ficha').inputValue());
  expect(result.forms.pastSimple.variants).toEqual(fixture.forms.pastSimple.variants);
});

test('all editor sections remain accessible on narrow screens and dark theme', async ({ page }) => {
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/editor/verbs/burn');
  for (const section of [
    'Datos del verbo',
    'Formas y sonidos',
    'Clasificación',
    'Ejemplos',
    'Notas y pistas',
    'Fuentes',
    'Registro',
    'JSON',
  ]) {
    await page.getByRole('button', { name: section, exact: true }).click();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      section,
    ).toBe(true);
    await page.screenshot({ animations: 'disabled' });
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(result.violations, section).toEqual([]);
  }
});

test('invalid ending keys block saving and archival metadata uses confirmation', async ({
  page,
}) => {
  await page.goto('/editor/verbs/burn');
  await page.getByRole('button', { name: 'Clasificación', exact: true }).click();
  await page
    .getByRole('button', { name: 'Añadir grupo de terminaciones fonéticas', exact: true })
    .click();
  await page.getByRole('button', { name: 'Guardar verbo', exact: true }).click();
  await expect(page).toHaveURL(new URL('/editor/verbs/burn', page.url()).href);
  await expect(page.getByRole('alert').first()).toContainText('clave');
  await page.getByLabel('Clave de terminaciones fonéticas 1', { exact: true }).fill('base');
  await page.getByLabel('Valores de terminaciones fonéticas 1', { exact: true }).fill('/n/');
  await page.getByRole('button', { name: 'Registro', exact: true }).click();
  await page
    .getByLabel('Fecha de archivo (vacío = activo)', { exact: true })
    .fill('2026-01-01T00:00:00Z');
  await page.getByRole('button', { name: 'Guardar verbo', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'Archivar este verbo', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar archivo', exact: true }).click();
  await expect(page).toHaveURL(new URL('/verbs/burn', page.url()).href);
  await expect(page.getByText('Este verbo está archivado.', { exact: false })).toBeVisible();
});
