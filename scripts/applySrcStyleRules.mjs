// src 下 .ts / .tsx / .vue（script）：
// 1) 移除此前批量生成的占位 JSDoc
// 2) 在块深度为 0 时按规则在「上一段逻辑」与「行注释 / JSDoc / 新声明」之间插入空行
//    import 连续行不插空行；多行 JSDoc 与紧随声明不插空行；分区 // 与紧随 const 不插空行
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../src');
const TARGET_EXT = new Set(['.ts', '.tsx', '.vue']);

/** @param {string} dir */
function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (name.name.startsWith('.')) continue;
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walk(p, out);
    else if (TARGET_EXT.has(path.extname(name.name))) out.push(p);
  }
  return out;
}

/** 粗略处理字符串/模板字面量中的括号 */
function braceDelta(line) {
  let d = 0;
  let i = 0;
  let quote = null;
  let tickExpr = 0;
  while (i < line.length) {
    const c = line[i];
    const prev = line[i - 1];
    if (quote === '`') {
      if (c === '`' && prev !== '\\') quote = null;
      else if (c === '$' && line[i + 1] === '{') {
        tickExpr++;
        d++;
        i += 2;
        continue;
      }
      i++;
      continue;
    }
    if (quote) {
      if (c === quote && prev !== '\\') quote = null;
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      quote = c;
      i++;
      continue;
    }
    if (c === '/' && line[i + 1] === '/') break;
    if (c === '/' && line[i + 1] === '*') {
      const end = line.indexOf('*/', i + 2);
      if (end === -1) break;
      i = end + 2;
      continue;
    }
    if (c === '{' && tickExpr === 0) d++;
    if (c === '}' && tickExpr === 0) d--;
    if (c === '}' && tickExpr > 0) {
      tickExpr--;
      d--;
    }
    i++;
  }
  return d;
}

/** @param {string} t */
function isImportLine(t) {
  return /^\s*import\b/.test(t);
}

/** @param {string} t */
function isDeclLine(t) {
  const s = t.trim();
  if (!s || /^for\s*\(\s*const\b/.test(s)) return false;
  return (
    /^export\s+enum\b/.test(s) ||
    /^enum\b/.test(s) ||
    /^export\s+interface\b/.test(s) ||
    /^interface\b/.test(s) ||
    /^export\s+type\b/.test(s) ||
    /^type\b/.test(s) ||
    /^onMounted\s*\(/.test(s) ||
    /^export\s+async\s+function\b/.test(s) ||
    /^export\s+function\b/.test(s) ||
    /^async\s+function\b/.test(s) ||
    /^function\b/.test(s) ||
    /^export\s+const\b/.test(s) ||
    /^const\s+enum\b/.test(s) ||
    /^const\s/.test(s)
  );
}

/** @param {string[]} out */
function prevNonEmptyOut(out) {
  for (let j = out.length - 1; j >= 0; j--) {
    if (out[j].trim() !== '') return out[j];
  }
  return null;
}

/** 上一行是否为「可视为上一段逻辑结束」的代码（其后可接注释或新声明并需要空行） */
function prevLineEndsLogicalUnit(pne) {
  const s = pne.trim();
  if (!s) return false;
  if (isImportLine(pne)) return true;
  if (isDeclLine(pne) && /[;}]$/.test(s)) return true;
  if (/[;}]$/.test(s)) return true;
  if (/\)\s*;?\s*$/.test(s) && !s.startsWith('if ') && !s.startsWith('else')) return true;
  return false;
}

/** 单行完整 JSDoc */
function isSingleLineJsdocLine(line) {
  const t = line.trim();
  return t.startsWith('/**') && t.includes('*/') && !t.includes('\n');
}

/** 多行 JSDoc 的中间行 */
function isJsdocContinuationLine(line) {
  const t = line.trim();
  if (t === '*' || /^\*\s+[^/]/.test(t)) return true;
  if (t.startsWith('/**') && !t.includes('*/')) return true;
  return false;
}

/** 上一行是否为多行 JSDoc 的结束 */
function isClosingJsdocLine(line) {
  return /\*\/\s*$/.test(line.trim());
}

/**
 * @param {string[]} lines
 * @returns {string[]}
 */
function stripPlaceholderDocs(lines) {
  const RES = [
    /^\s*\/\*\* 变量：[\w$]+ \*\/\s*$/,
    /^\s*\/\*\* 解构赋值 \*\/\s*$/,
    /^\s*\/\*\* 响应式状态：[\w$]+ \*\/\s*$/,
    /^\s*\/\*\* 响应式对象：[\w$]+ \*\/\s*$/,
    /^\s*\/\*\* 计算属性：[\w$]+ \*\/\s*$/,
    /^\s*\/\*\* 方法：[\w$]+ \*\/\s*$/,
    /^\s*\/\*\* 配置\/常量：[\w$]+ \*\/\s*$/,
    /^\s*\/\*\* 函数：[\w$]+ \*\/\s*$/,
    /^\s*\/\*\* [\w$]+ 接口 \*\/\s*$/,
    /^\s*\/\*\* [\w$]+ 枚举 \*\/\s*$/,
    /^\s*\/\*\* 组件挂载时执行 \*\/\s*$/
  ];
  return lines.filter((line) => !RES.some((re) => re.test(line)));
}

/**
 * @param {string[]} lines
 * @returns {string[]}
 */
function ensureTopLevelSpacing(lines) {
  let depth = 0;
  const out = [];

  for (const line of lines) {
    const startDepth = depth;
    const t = line.trim();
    const raw = line;

    if (startDepth === 0 && t) {
      const pne = prevNonEmptyOut(out);
      const pneT = pne ? pne.trim() : '';

      const curJsdocStart = /^\s*\/\*\*/.test(raw) && !/^\s*\/\*\*\//.test(raw.trim());
      const curLineComment = t.startsWith('//');
      const curDecl = isDeclLine(raw);
      const curImport = isImportLine(raw);

      let needBlank = false;

      if (pne) {
        if (curImport && isImportLine(pne)) {
          needBlank = false;
        } else if (curLineComment) {
          if (pneT.startsWith('//')) needBlank = false;
          else if (isImportLine(pne)) needBlank = false;
          else needBlank = prevLineEndsLogicalUnit(pne);
        } else if (curJsdocStart) {
          if (isJsdocContinuationLine(pne) || isClosingJsdocLine(pne)) needBlank = false;
          else if (pneT.startsWith('//')) needBlank = true;
          else needBlank = prevLineEndsLogicalUnit(pne);
        } else if (curDecl || /^\s*onMounted\s*\(/.test(raw)) {
          if (isClosingJsdocLine(pne) || isJsdocContinuationLine(pne)) needBlank = false;
          else if (isSingleLineJsdocLine(pne)) needBlank = false;
          else if (pneT.startsWith('//')) needBlank = false;
          else if (curImport) needBlank = false;
          else needBlank = prevLineEndsLogicalUnit(pne) || isDeclLine(pne);
        }
      }

      if (needBlank) {
        const last = out.length ? out[out.length - 1] : null;
        if (last == null || last.trim() !== '') out.push('');
      }
    }

    out.push(line);
    depth += braceDelta(line);
    if (depth < 0) depth = 0;
  }

  return out;
}

/**
 * @param {string[]} lines
 * @returns {string[]}
 */
function processScriptLines(lines) {
  const stripped = stripPlaceholderDocs(lines);
  return ensureTopLevelSpacing(stripped);
}

/** @param {string} content */
function processVue(content) {
  const scriptRe = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  return content.replace(scriptRe, (full, inner) => {
    const lines = inner.replace(/\r\n/g, '\n').split('\n');
    const processed = processScriptLines(lines).join('\n');
    return full.replace(inner, processed);
  });
}

function processFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  let next = raw;
  if (filePath.endsWith('.vue')) next = processVue(raw);
  else next = processScriptLines(raw.replace(/\r\n/g, '\n').split('\n')).join('\n');

  if (next !== raw) {
    fs.writeFileSync(filePath, next, 'utf8');
    return true;
  }
  return false;
}

let changed = 0;
for (const f of walk(ROOT)) {
  if (processFile(f)) {
    changed++;
    console.log('updated', path.relative(ROOT, f));
  }
}
console.log('files changed:', changed);
