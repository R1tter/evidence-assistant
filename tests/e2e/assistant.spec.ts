import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
for (const width of [390, 1440]) {
  test(`curated states at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/technical-demo.html');
    await expect(page).toHaveScreenshot(`initial-${width}.png`, {
      fullPage: true,
    });
    await page
      .getByRole('button', { name: 'How are citations checked?' })
      .click();
    await page.getByRole('button', { name: 'Ask the collection' }).click();
    await expect(page.locator('.answer-text')).toBeVisible();
    await expect(page).toHaveScreenshot(`answered-${width}.png`, {
      fullPage: true,
    });
    await page.getByRole('textbox').fill('galactic penguin recipes');
    await page.getByRole('button', { name: 'Ask the collection' }).click();
    await expect(
      page.getByText(
        'The collection does not contain enough evidence to answer this question.',
      ),
    ).toBeVisible();
    await expect(page).toHaveScreenshot(`abstained-${width}.png`, {
      fullPage: true,
    });
    await page.route('**/api/ask', (route) =>
      route.fulfill({ status: 500, body: 'error' }),
    );
    await page.getByRole('button', { name: 'Ask the collection' }).click();
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
    await expect(page).toHaveScreenshot(`error-${width}.png`, {
      fullPage: true,
    });
  });
}
test('all story states pass axe', async ({ page }) => {
  for (const id of [
    'answerpanel--initial',
    'answerpanel--loading',
    'answerpanel--error',
    'answerpanel--answered',
    'answerpanel--abstained',
    'answerpanel--long-answer',
    'modeselector--available',
    'modeselector--unavailable',
  ]) {
    await page.goto(
      `http://127.0.0.1:6006/iframe.html?id=${id}&viewMode=story`,
    );
    await expect(page.locator('#storybook-root')).not.toBeEmpty();
    expect(
      (
        await new AxeBuilder({ page })
          .exclude('#storybook-root ~ *')
          .disableRules(['region'])
          .analyze()
      ).violations,
    ).toEqual([]);
  }
});
test('reflow, zoom, reduced motion and all locales', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/technical-demo.html');
  for (const locale of ['en', 'pt-BR', 'es']) {
    await page.getByRole('combobox').selectOption(locale);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test('real demo and keyboard source disclosure', async ({ page }) => {
  await page.goto('/technical-demo.html');
  await page
    .getByRole('button', { name: 'How are citations checked?' })
    .click();
  await page.getByRole('button', { name: 'Ask the collection' }).click();
  await expect(page.locator('.answer-text')).toBeVisible();
  const disclosure = page.getByText('Read original document').first();
  await disclosure.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('pre').first()).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test('abstention, error and mobile locale', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/technical-demo.html');
  await page.getByRole('textbox').fill('galactic penguin recipes');
  await page.getByRole('button', { name: 'Ask the collection' }).click();
  await expect(
    page.getByText(
      'The collection does not contain enough evidence to answer this question.',
    ),
  ).toBeVisible();
  await page.route('**/api/ask', (route) =>
    route.fulfill({ status: 500, body: 'error' }),
  );
  await page.getByRole('button', { name: 'Ask the collection' }).click();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  await page.getByRole('combobox').selectOption('pt-BR');
  await expect(
    page.getByRole('button', { name: 'Tentar novamente' }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
