import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
test('comparison links proportional scrolling in both directions only when enabled', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 720 });
  await page.goto(
    'http://127.0.0.1:6006/iframe.html?id=documents-reading-tools--compare&viewMode=story',
  );
  const original = page.getByRole('region', { name: 'Original', exact: true });
  const text = page.getByRole('region', { name: 'Transcrição', exact: true });
  await expect(original.locator('img')).toBeVisible();
  await original.locator('img').evaluate(async (img) => {
    await (img as HTMLImageElement).decode();
  });
  await text.evaluate((el) => {
    el.scrollTop = 150;
  });
  expect(await original.evaluate((el) => el.scrollTop)).toBe(0);
  await page.getByRole('checkbox', { name: 'Vincular rolagem' }).check();
  await text.evaluate((el) => {
    el.scrollTop = (el.scrollHeight - el.clientHeight) * 0.5;
  });
  await expect
    .poll(() =>
      original.evaluate(
        (el) => el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight),
      ),
    )
    .toBeCloseTo(0.5, 1);
  await original.evaluate((el) => {
    el.scrollTop = el.scrollHeight - el.clientHeight;
  });
  await expect
    .poll(() =>
      text.evaluate(
        (el) => el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight),
      ),
    )
    .toBeCloseTo(1, 1);
  await page.getByRole('checkbox').uncheck();
  await original.evaluate((el) => {
    el.scrollTop = 0;
  });
  expect(await text.evaluate((el) => el.scrollTop)).toBeGreaterThan(150);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('searchbox').fill('14');
  await expect(page.locator('mark[aria-current="true"]')).toHaveText('14');
  await page.screenshot({
    path: 'test-results/reading-compare-desktop.png',
    fullPage: true,
  });
});
test('mobile comparison and literal search remain usable across all locales', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  const controls = [
    ['pt-BR', 'Buscar no documento', 'Transcrição', 'Comparar', 'Original'],
    ['en', 'Search document', 'Transcript', 'Compare', 'Original'],
    ['es', 'Buscar en el documento', 'Transcripción', 'Comparar', 'Original'],
  ];
  for (const [locale, search, transcript, compare, original] of controls) {
    await page.goto(
      `http://127.0.0.1:6006/iframe.html?id=documents-reading-tools--compare&viewMode=story&args=locale:${locale}`,
    );
    await expect(page.getByRole('searchbox', { name: search! })).toBeVisible();
    await page.getByRole('searchbox').fill('14');
    await expect(page.locator('mark[aria-current="true"]')).toHaveText('14');
    await expect(
      page.getByRole('region', { name: transcript!, exact: true }),
    ).toBeVisible();
    await page
      .locator('.comparison-switch')
      .getByRole('button', { name: original!, exact: true })
      .click();
    await expect(
      page.getByRole('region', { name: original!, exact: true }),
    ).toBeVisible();
    await page.getByRole('searchbox').fill('mater');
    await expect(
      page.getByRole('region', { name: transcript!, exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: compare!, exact: true }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
  await page.addStyleTag({ content: 'html {font-size:200%;}' });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: 'test-results/reading-compare-mobile.png',
    fullPage: true,
  });
});
