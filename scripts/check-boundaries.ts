import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true }).catch(
    (error: unknown) => {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
        return [];
      throw error;
    },
  );
  const groups = await Promise.all(
    entries
      .filter((entry) => !['node_modules', 'dist', '.git'].includes(entry.name))
      .map(async (entry) => {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) return sourceFiles(path);
        return /\.(ts|tsx)$/.test(path) ? [path] : [];
      }),
  );
  return groups.flat();
}

interface Dependency {
  specifier: string;
  typeOnly: boolean;
}
function callSpecifier(
  node: ts.CallExpression,
  tree: ts.SourceFile,
): string | undefined {
  const isImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
  if (!isImport && node.expression.getText(tree) !== 'require')
    return undefined;
  const argument = node.arguments[0];
  return argument && ts.isStringLiteral(argument) ? argument.text : undefined;
}

function imports(source: string, file: string): Dependency[] {
  const result: Dependency[] = [];
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const visit = (node: ts.Node) => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      result.push({
        specifier: node.moduleSpecifier.text,
        typeOnly: node.importClause?.isTypeOnly === true,
      });
    }
    if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    )
      result.push({
        specifier: node.moduleSpecifier.text,
        typeOnly: node.isTypeOnly,
      });
    if (ts.isCallExpression(node)) {
      const specifier = callSpecifier(node, tree);
      if (specifier) result.push({ specifier, typeOnly: false });
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return result;
}

function owner(path: string): string | undefined {
  return /^(packages|apps)\/([^/]+)\//.exec(path)?.[2];
}

function prohibitedCore(target: string): boolean {
  return (
    target.startsWith('apps/') ||
    /^(react|fastify|openai|@modelcontextprotocol\/|@evidence\/(api|web|mcp))/.test(
      target,
    )
  );
}

function allowedPublicCore(from: string, dependency: Dependency): boolean {
  return (
    dependency.specifier === '@evidence/core' &&
    (from !== 'web' || dependency.typeOnly)
  );
}

function prohibited(
  file: string,
  dependency: Dependency,
  root: string,
): boolean {
  const { specifier } = dependency;
  const from = owner(file);
  const target = specifier.startsWith('.')
    ? relative(root, resolve(root, dirname(file), specifier))
        .split(sep)
        .join('/')
    : specifier;
  const to = owner(target) ?? /^@evidence\/([^/]+)/.exec(target)?.[1];
  if (from === 'core') return prohibitedCore(target);
  if (!from) return false;
  if (to && to !== from) return !allowedPublicCore(from, dependency);
  return (
    from === 'web' &&
    /^(node:|openai|fastify|@modelcontextprotocol\/)/.test(target)
  );
}

export async function checkBoundaries(root: string): Promise<string[]> {
  const files = (
    await Promise.all(
      ['packages', 'apps'].map((folder) => sourceFiles(join(root, folder))),
    )
  ).flat();
  const failures = await Promise.all(
    files.map(async (file) => {
      const path = relative(root, file).split(sep).join('/');
      return imports(await readFile(file, 'utf8'), file)
        .filter((dependency) => prohibited(path, dependency, root))
        .map(({ specifier }) => `${path}: prohibited dependency ${specifier}`);
    }),
  );
  return failures.flat().sort();
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const failures = await checkBoundaries(process.cwd());
  for (const failure of failures) console.error(failure);
  console.log(`Dependency boundaries: ${failures.length} violations`);
  if (failures.length > 0) process.exitCode = 1;
}
