import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { documentExamples } from '../apps/web/src/documents/examples.js';
function lines(text: string): string[] {
  return text
    .split('\n')
    .flatMap(
      (paragraph) =>
        paragraph
          .match(/.{1,48}(?:\s|$)|.{1,48}/g)
          ?.map((line) => line.trim()) ?? [],
    );
}
function originalPdf(text: string) {
  const stream = `BT /F1 20 Tf 50 730 Td ${lines(text)
    .map(
      (line, i) =>
        `${i ? '0 -32 Td ' : ''}(${line.replaceAll('(', '\\(').replaceAll(')', '\\)')}) Tj`,
    )
    .join('\n')} ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let result = '%PDF-1.7\n';
  const offsets = [0];
  objects.forEach((object, i) => {
    offsets.push(result.length);
    result += `${i + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = result.length;
  result += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(result, 'latin1');
}
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const example of (['en', 'pt-BR', 'es'] as const).flatMap(
    documentExamples,
  )) {
    const folder = new URL(`../examples/${example.locale}/`, import.meta.url);
    await mkdir(folder, { recursive: true });
    const wrapped = lines(example.text);
    const image = await page.evaluate(
      ({ wrapped, kind }) => {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 800;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = kind === 'manual' ? '#ffffff' : '#fffbeb';
        ctx.fillRect(0, 0, 600, 800);
        if (kind === 'note') {
          ctx.strokeStyle = '#d6e2ef';
          ctx.lineWidth = 1;
          for (let y = 94; y < 760; y += 32) {
            ctx.beginPath();
            ctx.moveTo(30, y);
            ctx.lineTo(570, y);
            ctx.stroke();
          }
          ctx.strokeStyle = '#fda4af';
          ctx.beginPath();
          ctx.moveTo(38, 30);
          ctx.lineTo(38, 760);
          ctx.stroke();
        }
        if (kind === 'scan') {
          ctx.strokeStyle = '#e5ded0';
          ctx.strokeRect(15, 15, 570, 770);
        }
        ctx.fillStyle = '#172033';
        ctx.font =
          kind === 'note' ? '21px "Segoe Print", cursive' : '20px Arial';
        wrapped.forEach((line, i) => ctx.fillText(line, 50, 70 + i * 32));
        return canvas.toDataURL('image/png').split(',')[1]!;
      },
      { wrapped, kind: example.kind },
    );
    await writeFile(
      new URL(`${example.kind}.png`, folder),
      Buffer.from(image, 'base64'),
    );
    await writeFile(
      new URL(`${example.kind}.txt`, folder),
      example.text + '\n',
    );
    if (example.kind === 'manual')
      await writeFile(new URL('manual.pdf', folder), originalPdf(example.text));
  }
} finally {
  await browser.close();
}
