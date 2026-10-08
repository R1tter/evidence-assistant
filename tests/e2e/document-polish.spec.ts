import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test('walkthrough stays local and enlarged original supports zoom, Escape and focus return', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.getByLabel('Idioma').selectOption('pt-BR');
  let sessions = 0;
  page.on('request', (request) => {
    if (
      request.url().endsWith('/api/document-sessions') &&
      request.method() === 'POST'
    )
      sessions++;
  });
  await page.getByRole('button', { name: 'Ver demonstração' }).click();
  await page
    .getByRole('button', { name: 'Confira o texto', exact: true })
    .click();
  await expect(page.getByTestId('walkthrough-preview')).toContainText(
    'Transcrição',
  );
  await page
    .getByRole('button', { name: 'Pergunte e compare', exact: true })
    .click();
  await expect(page.getByTestId('walkthrough-preview')).toContainText(
    'A oficina começa às 14h no sábado.',
  );
  expect(sessions).toBe(0);
  await page.screenshot({
    path: 'test-results/ui-document-demo.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Experimentar um exemplo' }).click();
  const enlarge = page.getByRole('button', { name: 'Ampliar documento' });
  await enlarge.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  expect(
    await dialog
      .locator('img')
      .evaluate(
        (image) =>
          image.getBoundingClientRect().height <=
          image.closest('.expanded-scroll')!.clientHeight,
      ),
  ).toBe(true);
  await expect(
    dialog.getByRole('button', { name: 'Fechar visualização' }),
  ).toBeFocused();
  await expect
    .poll(() =>
      dialog
        .locator('img')
        .evaluate((image) => (image as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  await page.screenshot({ path: 'test-results/ui-document-expanded.png' });
  await dialog.getByRole('button', { name: 'Aumentar zoom' }).click();
  await expect(dialog.getByRole('status')).toHaveText('150%');
  await dialog.getByRole('button', { name: 'Ajustar à tela' }).click();
  await expect(dialog.getByRole('status')).toHaveText('100%');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(enlarge).toBeFocused();
  await page.getByRole('button', { name: 'Transcrição', exact: true }).click();
  await expect(
    page.getByRole('region', { name: 'Transcrição · página 1' }),
  ).toContainText('Oficina criativa');
  await page.screenshot({
    path: 'test-results/ui-document-transcript.png',
    fullPage: true,
  });
});

test('reduced motion keeps walkthrough manual and layouts fit narrow screens', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  await page.getByLabel('Idioma').selectOption('pt-BR');
  await page.getByRole('button', { name: 'Ver demonstração' }).click();
  await page.waitForTimeout(3500);
  await expect(
    page.getByRole('button', { name: 'Pergunte e compare', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page
    .getByRole('button', { name: 'Pergunte e compare', exact: true })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Experimentar um exemplo' }).click();
  await page
    .locator('.mobile-switch')
    .getByRole('button', { name: 'Documento', exact: true })
    .click();
  await page.getByRole('button', { name: 'Ampliar documento' }).click();
  await page.screenshot({
    path: 'test-results/ui-document-mobile-expanded.png',
  });
  await page.getByRole('button', { name: 'Aumentar zoom' }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('expanded document story works in all interface languages', async ({
  page,
}) => {
  for (const [locale, close, enlarge] of [
    ['pt-BR', 'Fechar visualização', 'Ampliar documento'],
    ['en', 'Close viewer', 'Enlarge document'],
    ['es', 'Cerrar visor', 'Ampliar documento'],
  ] as const) {
    await page.goto(
      `http://127.0.0.1:6006/iframe.html?id=documents-expandeddocument--original&viewMode=story&args=locale:${locale}`,
    );
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(
      (await new AxeBuilder({ page }).exclude('#storybook-root ~ *').analyze())
        .violations,
    ).toEqual([]);
    await page.getByRole('button', { name: close, exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('button', { name: enlarge, exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  }
});

test('animated presentation types progressively and pauses at the exact frame', async ({
  page,
}) => {
  test.setTimeout(40000);
  await page.goto('/');
  await page.getByLabel('Idioma').selectOption('pt-BR');
  await page.getByRole('button', { name: 'Ver demonstração' }).click();
  const typed = page.getByTestId('demo-typed-question');
  await expect
    .poll(async () => (await typed.textContent())?.length ?? 0, {
      timeout: 12000,
    })
    .toBeGreaterThan(3);
  await page.getByRole('button', { name: 'Pausar demonstração' }).click();
  const paused = await typed.textContent();
  expect(paused!.length).toBeLessThan('A que horas começa a oficina?'.length);
  await page.waitForTimeout(450);
  await expect(typed).toHaveText(paused!);
  await page.getByRole('button', { name: 'Continuar demonstração' }).click();
  await expect(
    page.getByRole('button', { name: 'Repetir demonstração' }),
  ).toBeVisible({ timeout: 18000 });
  await expect(typed).toHaveText('A que horas começa a oficina?');
  await expect(page.getByTestId('demo-answer')).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Repetir demonstração' }).click();
  await expect(typed).toHaveText('');
  await page.getByRole('button', { name: 'Pausar demonstração' }).click();
});
