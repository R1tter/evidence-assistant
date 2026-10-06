// Original minimal PDF fixtures; no external or personal documents.
export function imagePdfFixture(): string {
  const pixels = 'ffffff172033172033ffffff>';
  const stream = 'q 400 0 0 500 0 0 cm /Image1 Do Q';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 500] /Resources << /XObject << /Image1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    `<< /Type /XObject /Subtype /Image /Width 2 /Height 2 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /ASCIIHexDecode /Length ${pixels.length} >>\nstream\n${pixels}\nendstream`,
  ];
  let pdf = '%PDF-1.7\n';
  const offsets = [0];
  objects.forEach((object, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('')}`;
  return (
    pdf + `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  );
}
export function pdfFixture(
  text: string,
  count = 1,
  protectedFile = false,
): string {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${Array.from({ length: count }, (_, i) => `${4 + i * 2} 0 R`).join(' ')}] /Count ${count} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  for (let i = 0; i < count; i++) {
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 500] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + i * 2} 0 R >>`,
    );
    const stream = text
      ? `BT /F1 16 Tf 30 440 Td (${text.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)')}) Tj ET`
      : '';
    objects.push(
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    );
  }
  if (protectedFile)
    objects.push(
      `<< /Filter /Standard /V 1 /R 2 /O <${'00'.repeat(32)}> /U <${'11'.repeat(32)}> /P -4 >>`,
    );
  let pdf = '%PDF-1.7\n';
  const offsets = [0];
  objects.forEach((object, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1))
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  const encryption = protectedFile
    ? `/Encrypt ${objects.length} 0 R /ID [<${'22'.repeat(16)}> <${'22'.repeat(16)}>]`
    : '';
  return (
    pdf +
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R ${encryption} >>\nstartxref\n${xref}\n%%EOF\n`
  );
}
