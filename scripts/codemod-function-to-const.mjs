/**
 * 将模块顶层的 `function` / `export function` / `export default function` 转为 `const` 箭头函数。
 * - 跳过：无函数体（重载签名）、无函数名、`function*`、declare、含重载签名的整个文件
 * - .vue：仅处理 `<script setup lang="ts">` 或 `<script lang="ts">` 的块内容
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { parse as parseSfc } from 'vue/compiler-sfc';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

/** @param {string} p */
function walkDir(p, out = []) {
  if (!fs.existsSync(p)) return out;
  for (const ent of fs.readdirSync(p, { withFileTypes: true })) {
    const full = path.join(p, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === 'dist') continue;
      walkDir(full, out);
    } else if (ent.isFile()) {
      const ext = path.extname(ent.name);
      if (ext === '.ts' && !ent.name.endsWith('.d.ts')) out.push(full);
      if (ext === '.vue') out.push(full);
    }
  }
  return out;
}

/**
 * @param {ts.FunctionDeclaration} node
 * @param {ts.SourceFile} sf
 */
function hasDeclare(node) {
  return !!node.modifiers?.some((m) => m.kind === ts.SyntaxKind.DeclareKeyword);
}

/**
 * @param {ts.SourceFile} sf
 */
function fileHasOverloadSignature(sf) {
  for (const st of sf.statements) {
    if (ts.isFunctionDeclaration(st) && !st.body) return true;
  }
  return false;
}

/**
 * @param {ts.FunctionDeclaration} node
 */
function shouldTransformTopLevel(node, sf) {
  if (node.parent !== sf) return false;
  if (!node.body) return false;
  if (!node.name) return false;
  if (node.asteriskToken) return false;
  if (hasDeclare(node)) return false;
  return true;
}

/**
 * @param {readonly ts.Modifier[] | undefined} mods
 */
function stripExportDefaultAsyncFromDecl(mods) {
  if (!mods) return [];
  return mods.filter(
    (m) =>
      m.kind !== ts.SyntaxKind.ExportKeyword &&
      m.kind !== ts.SyntaxKind.DefaultKeyword &&
      m.kind !== ts.SyntaxKind.AsyncKeyword
  );
}

/**
 * @param {readonly ts.Modifier[] | undefined} mods
 */
function hasModifier(mods, kind) {
  return !!mods?.some((m) => m.kind === kind);
}

/**
 * @param {ts.FunctionDeclaration} node
 */
function toArrowFunction(node) {
  const asyncMod = node.modifiers?.filter((m) => m.kind === ts.SyntaxKind.AsyncKeyword);
  return ts.factory.createArrowFunction(
    asyncMod,
    node.typeParameters,
    node.parameters,
    node.type,
    ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    node.body
  );
}

/**
 * @param {ts.FunctionDeclaration} node
 * @returns {ts.Statement[]}
 */
function convertFunctionDeclaration(node) {
  const name = node.name;
  const arrow = toArrowFunction(node);
  const innerMods = stripExportDefaultAsyncFromDecl(node.modifiers);
  const isExport = hasModifier(node.modifiers, ts.SyntaxKind.ExportKeyword);
  const isDefault = hasModifier(node.modifiers, ts.SyntaxKind.DefaultKeyword);

  const decl = ts.factory.createVariableDeclaration(name, undefined, undefined, arrow);
  const declList = ts.factory.createVariableDeclarationList([decl], ts.NodeFlags.Const);

  /** @type {ts.Statement[]} */
  const out = [];

  if (isExport && !isDefault) {
    out.push(
      ts.factory.createVariableStatement(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword), ...innerMods],
        declList
      )
    );
  } else if (isDefault && isExport) {
    out.push(ts.factory.createVariableStatement(innerMods.length ? innerMods : undefined, declList));
    out.push(ts.factory.createExportAssignment(undefined, undefined, false, name));
  } else {
    out.push(ts.factory.createVariableStatement(innerMods.length ? innerMods : undefined, declList));
  }

  return out;
}

/**
 * @param {string} sourceText
 * @param {string} fileName
 */
function transformTsModule(sourceText, fileName) {
  const sf = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  if (fileHasOverloadSignature(sf)) {
    return { skipped: true, reason: 'overload signatures', text: null };
  }

  let changed = false;
  const newStatements = [];
  for (const stmt of sf.statements) {
    if (ts.isFunctionDeclaration(stmt) && shouldTransformTopLevel(stmt, sf)) {
      changed = true;
      newStatements.push(...convertFunctionDeclaration(stmt));
    } else {
      newStatements.push(stmt);
    }
  }

  if (!changed) return { skipped: true, reason: 'no eligible function', text: null };

  const newSf = ts.factory.updateSourceFile(sf, newStatements);
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed, removeComments: false });
  const text = printer.printFile(newSf);
  return { skipped: false, reason: '', text };
}

/**
 * @param {string} absPath
 * @param {string} rel
 */
function processVueFile(absPath, rel) {
  const raw = fs.readFileSync(absPath, 'utf8');
  const { descriptor, errors } = parseSfc(raw, { filename: absPath });
  if (errors?.length) {
    console.warn(`[skip vue parse] ${rel}:`, errors[0]?.message ?? errors);
    return false;
  }
  const block = descriptor.scriptSetup ?? descriptor.script;
  if (!block) return false;
  const lang = block.lang ?? 'js';
  if (lang !== 'ts' && lang !== 'tsx') return false;

  const { content, loc } = block;
  if (!loc) return false;
  const res = transformTsModule(content, absPath + '.inline.ts');
  if (res.skipped || res.text == null) return false;

  const start = loc.start.offset;
  const end = loc.end.offset;
  const next = raw.slice(0, start) + res.text + raw.slice(end);
  if (next !== raw) {
    fs.writeFileSync(absPath, next, 'utf8');
    console.log('[vue]', rel);
    return true;
  }
  return false;
}

/**
 * @param {string} absPath
 * @param {string} rel
 */
function processTsFile(absPath, rel) {
  const raw = fs.readFileSync(absPath, 'utf8');
  if (!/^\s*(export\s+)?(async\s+)?function\s+/m.test(raw)) return false;
  const res = transformTsModule(raw, absPath);
  if (res.skipped || res.text == null) return false;
  fs.writeFileSync(absPath, res.text, 'utf8');
  console.log('[ts]', rel);
  return true;
}

function main() {
  const files = walkDir(SRC);
  let n = 0;
  for (const abs of files) {
    const rel = path.relative(ROOT, abs);
    if (rel.endsWith('.vue')) {
      if (processVueFile(abs, rel)) n++;
    } else {
      if (processTsFile(abs, rel)) n++;
    }
  }
  console.log(`Done. Modified ${n} files.`);
}

main();
