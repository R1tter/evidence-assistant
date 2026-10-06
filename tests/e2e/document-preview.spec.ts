import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
const url = new URL('../../docs/ux-document-preview.html', import.meta.url)
  .href;
test('localized document preview connects answer to reviewed text', async ({
  page,
}) => {
  await page.goto(url);
  await expect(
    page.getByRole('heading', {
      name: 'Seu documento tem respostas. Encontre-as.',
    }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Experimentar um exemplo', exact: true })
    .click();
  await expect(page.locator('#workspace')).toBeVisible();
  await page.getByRole('link', { name: 'Página 1 · ver trecho' }).click();
  await expect(page.locator('#passage')).toBeFocused();
  await page.getByRole('combobox', { name: 'Idioma' }).selectOption('es');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(
    page.getByRole('heading', { name: 'Pregunta sobre este documento' }),
  ).toBeVisible();
});
test('preview states, all locales and narrow layout', async ({ page }) => {
  await page.goto(url);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const locale of ['pt-BR', 'en', 'es']) {
    await page.locator('#language').selectOption(locale);
    for (const state of [
      'home',
      'upload',
      'reading',
      'ocr',
      'ready',
      'review',
      'answer',
      'illegible',
      'error',
      'expired',
    ]) {
      await page.locator('#preview-state').selectOption(state);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
  }
});

test('local revision invalidates the answer and upload waits for consent', async ({
  page,
}) => {
  await page.goto(url);
  await page
    .getByRole('button', { name: 'Usar meu documento', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Reconhecer texto', exact: true }),
  ).toBeDisabled();
  await page.getByRole('checkbox').check();
  await page
    .getByRole('button', { name: 'Reconhecer texto', exact: true })
    .click();
  await expect(page.locator('#status-title')).toHaveText(
    'Reconhecendo texto · simulação',
  );
  await page.locator('#preview-state').selectOption('answer');
  await page
    .getByRole('button', { name: 'Revisar texto', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: 'Texto da página' })
    .fill('O encontro começa às 15h.');
  await page
    .getByRole('button', { name: 'Salvar revisão', exact: true })
    .click();
  await expect(page.locator('#result')).toBeHidden();
  await expect(page.locator('#revision')).toHaveText(
    'Texto corrigido por você · revisão 2',
  );
  await page.locator('#language').selectOption('en');
  await expect(page.locator('#passage-text')).toHaveText(
    'O encontro começa às 15h.',
  );
  await expect(page.locator('#passage-text')).toHaveAttribute('lang', 'pt-BR');
});

test('capture candidates for visual review', async ({ page }) => {
  await page.goto(url);
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    for (const state of ['home', 'upload', 'answer', 'review']) {
      await page.locator('#preview-state').selectOption(state);
      await page.screenshot({
        path: `docs/preview-captures/document-${state}-${width}.png`,
        fullPage: true,
        animations: 'disabled',
      });
    }
  }
});

test('suggested answer matches its displayed passage', async ({ page }) => {
  await page.goto(url);
  await page
    .getByRole('button', { name: 'Experimentar um exemplo', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'O que preciso levar?', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Perguntar ao documento', exact: true })
    .click();
  const answer = await page.locator('#answer-text').textContent();
  await page.locator('#citation').click();
  await expect(page.locator('#passage-text')).toHaveText(answer ?? '');
});
