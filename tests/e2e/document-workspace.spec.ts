import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { imagePdfFixture } from './pdf-fixture.js';
for (const width of [390, 1440]) {
  test(`real document workflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page).toHaveScreenshot(`document-home-${width}.png`, {
      fullPage: true,
    });
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.getByRole('button', { name: 'Experimentar um exemplo' }).click();
    await page.getByLabel('Sua pergunta').fill('A que horas começa a oficina?');
    await page.getByRole('button', { name: 'Perguntar ao documento' }).click();
    await expect(page.getByTestId('document-answer')).toContainText('14h');
    await expect(page).toHaveScreenshot(`document-answer-${width}.png`, {
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Página 1 · ver trecho' }).click();
    await expect(page.getByTestId('source-passage')).toBeFocused();
    await expect(page).toHaveScreenshot(`document-source-${width}.png`, {
      fullPage: true,
    });
    await page
      .getByTestId('source-passage')
      .getByRole('button', { name: 'Perguntas' })
      .click();
    await expect(
      page.getByRole('button', { name: 'Página 1 · ver trecho' }),
    ).toBeFocused();
    await page.getByRole('button', { name: 'Página 1 · ver trecho' }).click();
    await page.getByRole('button', { name: 'Revisar texto' }).click();
    await page.getByLabel('Texto da página').fill('A oficina começa às 16h.');
    await page.getByRole('button', { name: 'Salvar revisão' }).click();
    await expect(page.getByTestId('document-answer')).toHaveCount(0);
    if (width < 760)
      await page
        .locator('.mobile-switch')
        .getByRole('button', { name: 'Perguntas' })
        .click();
    await page.getByRole('button', { name: 'Perguntar ao documento' }).click();
    await expect(page.getByTestId('document-answer')).toContainText('16h');
    await page.getByLabel('Sua pergunta').fill('galactic penguin recipes');
    await page.getByRole('button', { name: 'Perguntar ao documento' }).click();
    await expect(page.getByTestId('document-answer')).toContainText(
      'Não encontrei',
    );
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}
test('uploads a real PDF in the production build and asks with the actual credential-free API', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:5174/');
  await page.getByRole('button', { name: 'Usar meu documento' }).click();
  await page
    .locator('input[type=file]')
    .setInputFiles('examples/en/manual.pdf');
  await page.getByRole('button', { name: 'Ler documento' }).click();
  await page.getByLabel('Sua pergunta').fill('Where should I place the pot?');
  await page.getByRole('button', { name: 'Perguntar ao documento' }).click();
  await expect(page.getByTestId('document-answer')).toContainText('window');
  await expect(page.locator('.original-page img')).toBeVisible();
});
test('long original text and filenames remain readable without overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Experimentar um exemplo' }).click();
  await page
    .locator('.mobile-switch')
    .getByRole('button', { name: 'Texto' })
    .click();
  await page.getByRole('button', { name: 'Revisar texto' }).click();
  await page
    .getByLabel('Texto da página')
    .fill(
      'Documento original. '.repeat(100) + '<script>untrusted text</script>',
    );
  await page.getByRole('button', { name: 'Salvar revisão' }).click();
  await page.getByRole('button', { name: 'Transcrição' }).click();
  await expect(page.locator('.page-text')).toContainText(
    '<script>untrusted text</script>',
  );
  await expect(page).toHaveScreenshot('document-long-390.png', {
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test('all ten document story states pass axe in each interface language', async ({
  page,
}) => {
  for (const locale of ['en', 'pt-BR', 'es']) {
    for (const state of [
      'home',
      'upload',
      'reading',
      'recognizing',
      'review',
      'answer',
      'abstained',
      'illegible',
      'error',
      'expired',
    ]) {
      await page.goto(
        `http://127.0.0.1:6006/iframe.html?id=document-workspace--home&viewMode=story&args=state:${state};locale:${locale}`,
      );
      await expect(page.locator('#storybook-root .shell')).toBeVisible();
      expect(
        (
          await new AxeBuilder({ page })
            .exclude('#storybook-root ~ *')
            .analyze()
        ).violations,
      ).toEqual([]);
    }
  }
});
test('recognition requires consent and selected pages; provider output is simulated', async ({
  page,
}) => {
  await page.route('**/api/config', (route) =>
    route.fulfill({
      json: { llmAvailable: false, recognitionAvailable: true },
    }),
  );
  let calls = 0;
  await page.route('**/api/document-session/recognize', async (route) => {
    calls++;
    const body = route.request().postDataJSON() as {
      consent: boolean;
      pages: unknown[];
      revision: number;
    };
    expect(body).toMatchObject({ consent: true, revision: 1 });
    expect(body.pages).toHaveLength(1);
    const snapshot = await page.request.get(
      'http://127.0.0.1:3001/api/document-session',
      {
        headers: {
          'X-Document-Session': route.request().headers()[
            'x-document-session'
          ]!,
        },
      },
    );
    const saved = (await snapshot.json()) as {
      document: { pages: unknown[]; revision: number };
      expiresAt: number;
    };
    saved.document.revision = 2;
    saved.document.pages = [
      {
        page: 1,
        text: 'The train leaves at 09:30.',
        origin: 'vision',
        uncertainties: ['Simulated provider fixture; inspect original.'],
      },
    ];
    await route.fulfill({ json: saved });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Usar meu documento' }).click();
  await page.locator('input[type=file]').setInputFiles({
    name: 'scan.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(imagePdfFixture()),
  });
  await page.getByRole('button', { name: 'Ler documento' }).click();
  const recognize = page.getByRole('button', {
    name: 'Reconhecer texto',
  });
  await expect(recognize).toBeDisabled();
  expect(calls).toBe(0);
  await page.locator('.recognition-panel input[type=checkbox]').last().check();
  await recognize.click();
  await expect.poll(() => calls).toBe(1);
  await page.getByRole('button', { name: 'Transcrição' }).click();
  await expect(page.locator('.page-text')).toContainText('09:30');
});
test('reflows at 320px and supports all locales, text enlargement and reduced motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const locale of ['en', 'es', 'pt-BR']) {
    await page.locator('header select').selectOption(locale);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
  await page.addStyleTag({ content: 'html { font-size: 200%; }' });
  const overflow = await page.evaluate(() =>
    [...document.querySelectorAll('body *')]
      .filter(
        (element) => element.getBoundingClientRect().right > innerWidth + 1,
      )
      .map((element) => ({
        tag: element.tagName,
        class: element.className,
        text: element.textContent?.slice(0, 40),
        right: element.getBoundingClientRect().right,
      })),
  );
  expect(overflow).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.addStyleTag({ content: 'html { font-size: 100%; zoom: 2; }' });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
