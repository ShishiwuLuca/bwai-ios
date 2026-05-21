// 为 src 下 .ts/.tsx/.vue 的 script 顶层声明补全缺失的 JSDoc（按命名与右侧表达式推断中文用途）
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../src');
const EXTS = new Set(['.ts', '.tsx', '.vue']);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (EXTS.has(path.extname(e.name))) out.push(p);
  }
  return out;
}

/** 上一段输出是否已有紧贴的 JSDoc */
function hasAttachedJsdoc(out) {
  let i = out.length - 1;
  while (i >= 0 && out[i].trim() === '') i--;
  if (i < 0) return false;
  const t = out[i].trim();
  if (t.startsWith('//')) return false;
  if (t.startsWith('/**') && t.includes('*/')) return true;
  if (t.startsWith('/**') && !t.includes('*/')) return true;
  if (t === '*/' || t.endsWith('*/')) {
    let j = i;
    while (j >= 0) {
      const u = out[j].trim();
      if (u.startsWith('/**')) return true;
      if (u.startsWith('//')) return false;
      j--;
    }
  }
  if (/^\*\s/.test(t) || t === '*') return true;
  return false;
}

function extractName(trimmed) {
  if (/^onMounted\s*\(/.test(trimmed)) return 'onMounted';
  if (/^onUnmounted\s*\(/.test(trimmed)) return 'onUnmounted';
  if (/^watchEffect\s*\(/.test(trimmed)) return 'watchEffect';
  if (/^watch\s*\(/.test(trimmed)) return 'watch';
  let m =
    trimmed.match(/^export\s+async\s+function\s+([\w$]+)/) ||
    trimmed.match(/^export\s+function\s+([\w$]+)/) ||
    trimmed.match(/^async\s+function\s+([\w$]+)/) ||
    trimmed.match(/^function\s+([\w$]+)/);
  if (m) return m[1];
  if (/^export\s+const\s*\{/.test(trimmed) || /^const\s*\{/.test(trimmed)) return 'destructure';
  if (/^export\s+const\s*\[/.test(trimmed) || /^const\s*\[/.test(trimmed)) return 'destructure';
  m = trimmed.match(/^const\s+enum\s+([\w$]+)/);
  if (m) return m[1];
  m =
    trimmed.match(/^export\s+(?:const|let)\s+([\w$]+)/) ||
    trimmed.match(/^(?:const|let|var)\s+([\w$]+)/);
  if (m && m[1] !== 'enum') return m[1];
  m = trimmed.match(/^export\s+interface\s+([\w$]+)/) || trimmed.match(/^interface\s+([\w$]+)/);
  if (m) return m[1];
  m = trimmed.match(/^const\s+enum\s+([\w$]+)/) || trimmed.match(/^(?:export\s+)?enum\s+([\w$]+)/);
  if (m) return m[1];
  m = trimmed.match(/^export\s+type\s+([\w$]+)/) || trimmed.match(/^type\s+([\w$]+)/);
  if (m) return m[1];
  return null;
}

function hintFromName(name) {
  const n = name;
  const rules = [
    [/route$/i, '当前路由'],
    [/^router$/i, '路由实例'],
    [/^t$/i, '国际化文案'],
    [/loading/i, '加载中状态'],
    [/refresh/i, '下拉刷新'],
    [/finished/i, '列表是否已全部加载'],
    [/list$/i, '列表数据'],
    [/total/i, '总条数'],
    [/pageNo|pageSize/i, '分页'],
    [/subtitle/i, '副标题'],
    [/uid/i, '用户或路由 uid'],
    [/visible|show/i, '显隐控制'],
    [/active/i, '当前选中项'],
    [/tab/i, 'Tab 状态'],
    [/toast|message/i, '提示与弹窗'],
    [/balance/i, '余额'],
    [/amount/i, '金额输入'],
    [/submit/i, '提交中'],
    [/fetch|load|request/i, '拉取接口数据'],
    [/format/i, '格式化展示'],
    [/can[A-Z]/, '是否允许某操作'],
    [/on[A-Z]/, '事件或回调处理'],
    [/go[A-Z]/, '页面跳转'],
    [/toggle/i, '切换展开/折叠等'],
    [/detail/i, '详情'],
    [/order/i, '订单'],
    [/(team|member|badge|level)/i, '团队或等级展示'],
    [/user/i, '用户'],
    [/config/i, '配置'],
    [/env/i, '环境变量'],
    [/token/i, '令牌'],
    [/key$/i, '键名或缓存键']
  ];
  for (const [re, h] of rules) {
    if (re.test(n)) return h;
  }
  return '';
}

function inferJsdoc(trimmed, name) {
  const t = trimmed;
  const hint = hintFromName(name);
  if (name === 'destructure') {
    if (t.includes('useI18n')) return '/** 从 useI18n 解构的文案与能力 */';
    if (t.includes('useMessage')) return '/** 从 useMessage 解构的 Toast / Dialog 能力 */';
    if (t.includes('useRoute')) return '/** 从路由相关 API 解构的能力 */';
    return '/** 解构赋值：组合式 API 返回的一组方法或状态 */';
  }
  if (/^onMounted\s*\(/.test(t)) return '/** 组件挂载后执行：初始化数据或订阅 */';
  if (/^onUnmounted\s*\(/.test(t)) return '/** 组件卸载时清理副作用 */';
  if (/^watch\s*\(/.test(t)) return '/** 侦听依赖变化并触发副作用 */';
  if (/^watchEffect\s*\(/.test(t)) return '/** 自动追踪依赖并执行副作用 */';
  if (t.includes('useRoute()')) return '/** 当前路由：读取 query、params、meta 等 */';
  if (t.includes('useRouter()')) return '/** 路由实例：编程式导航 */';
  if (/useI18n\s*\(/.test(t)) return '/** 国际化：t 等文案函数 */';
  if (/useMessage\s*\(/.test(t)) return '/** 全局 Toast / Dialog 等交互 */';
  if (/useRoute\s*\(/.test(t) && name === 'route') return '/** 当前路由 */';
  if (/^interface\s|^export\s+interface\s/.test(t))
    return `/** ${name}：接口数据结构定义${hint ? `（${hint}）` : ''} */`;
  if (/^enum\s|^export\s+enum\s|^const\s+enum\s/.test(t))
    return `/** ${name}：枚举取值说明 */`;
  if (/^type\s|^export\s+type\s/.test(t)) return `/** ${name}：类型别名 */`;
  if (t.includes('computed('))
    return `/** 计算属性：${hint || '由其它状态派生的展示或判断'} */`;
  if (/ref\s*[<(]/.test(t)) return `/** 响应式状态：${hint || name + ' 相关 UI 或数据'} */`;
  if (t.includes('reactive(')) return `/** 响应式对象：${hint || name} */`;
  if (/\b=>\s*\{/.test(t) || /=\s*async\s*\(/.test(t) || /=\s*function\b/.test(t))
    return `/** ${hint ? `${hint}（${name}）` : `方法：${name}`} */`;
  if (/^function\b|^export\s+function\b|^async\s+function\b/.test(t))
    return `/** 函数：${hint || name} */`;
  if (/=\s*\[/.test(t) || /=\s*\{/.test(t) || t.includes(' as const'))
    return `/** 常量或静态配置：${hint || name} */`;
  return `/** ${hint ? `${hint}：` : ''}${name} */`;
}

function isDeclAtDepth0(trimmed) {
  if (!trimmed || /^import\b/.test(trimmed)) return false;
  if (/^export\s+default\b/.test(trimmed)) return false;
  if (/^export\s*\{/.test(trimmed)) return false;
  if (/^for\s*\(\s*(const|let|var)\b/.test(trimmed)) return false;
  if (/^onMounted\s*\(/.test(trimmed)) return true;
  if (/^onUnmounted\s*\(/.test(trimmed)) return true;
  if (/^watchEffect\s*\(/.test(trimmed)) return true;
  if (/^watch\s*\(/.test(trimmed)) return true;
  if (
    /^export\s+enum\b/.test(trimmed) ||
    /^enum\b/.test(trimmed) ||
    /^export\s+interface\b/.test(trimmed) ||
    /^interface\b/.test(trimmed) ||
    /^export\s+type\b/.test(trimmed) ||
    /^type\b/.test(trimmed) ||
    /^export\s+async\s+function\b/.test(trimmed) ||
    /^export\s+function\b/.test(trimmed) ||
    /^async\s+function\b/.test(trimmed) ||
    /^function\b/.test(trimmed) ||
    /^export\s+const\b/.test(trimmed) ||
    /^export\s+let\b/.test(trimmed) ||
    /^const\s+enum\b/.test(trimmed) ||
    /^const\b/.test(trimmed) ||
    /^let\b/.test(trimmed) ||
    /^var\b/.test(trimmed)
  )
    return true;
  return false;
}

function indentOf(line) {
  const m = line.match(/^(\s*)/);
  return m ? m[1] : '';
}

/** 取 script 顶层缩进宽度：首个非 import 的声明行（const/let/type/…）的前导空白长度；找不到则 0 */
function getBaseIndentLen(lines) {
  for (const line of lines) {
    const t = line.trim();
    if (!t || /^import\b/.test(t)) continue;
    if (
      /^(export\s+)?(const|let|var)\b/.test(t) ||
      /^(export\s+)?(function|async\s+function|type|interface|enum)\b/.test(t) ||
      /^onMounted\s*\(/.test(t) ||
      /^onUnmounted\s*\(/.test(t) ||
      /^watch\s*\(/.test(t) ||
      /^watchEffect\s*\(/.test(t)
    ) {
      const m = line.match(/^(\s*)/);
      return m[1].length;
    }
  }
  return 0;
}

function processLines(lines) {
  const baseIndentLen = getBaseIndentLen(lines);
  const out = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const indMatch = line.match(/^(\s*)/);
    const indentLen = indMatch ? indMatch[1].length : 0;
    const isScriptTop = indentLen === baseIndentLen;

    if (isScriptTop && isDeclAtDepth0(trimmed)) {
      const name = extractName(trimmed);
      if (name && !hasAttachedJsdoc(out)) {
        const ind = indentOf(line);
        if (out.length && out[out.length - 1].trim() !== '') out.push('');
        out.push(`${ind}${inferJsdoc(trimmed, name)}`);
      }
    }

    out.push(line);
  }
  return out;
}

function processVue(src) {
  return src.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (full, inner) => {
    const lines = inner.replace(/\r\n/g, '\n').split('\n');
    return full.replace(inner, processLines(lines).join('\n'));
  });
}

function processFile(fp) {
  const raw = fs.readFileSync(fp, 'utf8');
  let next = raw;
  if (fp.endsWith('.vue')) next = processVue(raw);
  else next = processLines(raw.replace(/\r\n/g, '\n').split('\n')).join('\n');
  if (next !== raw) {
    fs.writeFileSync(fp, next, 'utf8');
    return true;
  }
  return false;
}

let n = 0;
for (const f of walk(ROOT)) {
  if (processFile(f)) {
    n++;
    console.log(path.relative(ROOT, f));
  }
}
console.log('changed:', n);
