import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
test('exports only saved text and preserves quoted history after a revision', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('header select').selectOption('pt-BR');
  await page.getByRole('button', { name: 'Experimentar um exemplo' }).click();
  await page.getByLabel('Sua pergunta').fill('A que horas começa a oficina?');
  await page
    .getByRole('button', { name: 'Perguntar ao documento', exact: true })
    .click();
  const history = page.getByRole('region', { name: 'Histórico da sessão' });
  await expect(history.locator('summary')).toHaveText(
    '1. A que horas começa a oficina?',
  );
  await history.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(history).toContainText('A oficina começa às 14h no sábado.');
  await page
    .getByRole('button', { name: 'Revisar texto', exact: true })
    .click();
  await page.getByLabel('Texto da página').fill('RASCUNHO NÃO SALVO');
  let downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar sessão em TXT' }).click();
  let download = await downloaded;
  expect(download.suggestedFilename()).toBe('evidence-assistant.txt');
  let text = await readFile(await download.path(), 'utf8');
  expect(text).not.toContain('RASCUNHO NÃO SALVO');
  expect(text).toContain('Os materiais estão incluídos.');
  await page.getByLabel('Texto da página').fill('A oficina começa às 16h.');
  await page.getByRole('button', { name: 'Salvar revisão' }).click();
  await expect(history).toContainText('Revisão anterior');
  await expect(page.getByTestId('document-answer')).toHaveCount(0);
  await expect(history.getByRole('button', { name: /ver trecho/ })).toHaveCount(
    0,
  );
  downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar sessão em TXT' }).click();
  download = await downloaded;
  text = await readFile(await download.path(), 'utf8');
  expect(text).toContain('A oficina começa às 16h.');
  expect(text).toContain('A oficina começa às 14h no sábado.');
  expect(text).toContain('Revisão anterior');
  expect(text).toContain('não verifica');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: 'test-results/history-export-desktop.png',
    fullPage: true,
  });
});
test('history and export remain accessible in all locales on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  for (const [locale, title] of [
    ['pt-BR', 'Histórico da sessão'],
    ['en', 'Session history'],
    ['es', 'Historial de la sesión'],
  ]) {
    await page.goto(
      `http://127.0.0.1:6006/iframe.html?id=document-workspace--answer&viewMode=story&args=locale:${locale}`,
    );
    const history = page.getByRole('region', { name: title! });
    await expect(history).toBeVisible();
    await history.locator('summary').click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
  await page.screenshot({
    path: 'test-results/history-export-mobile.png',
    fullPage: true,
  });
});
