/**
 * Web 生成器
 * 生成 design-tokens.css (CSS Variables) 和 design-tokens.ts (TS 常量)
 * 只包含 palette（基础色彩梯度）和 semantic（语义色）
 */

/**
 * 将 hex + alpha 转为 CSS 颜色值
 */
function toCssColor(hex, a = 1) {
  if (a < 1) {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
  }
  return hex;
}

// ─── CSS Variables Generator ───

export function generateCss(tokens) {
  const lines = [
    '/* 自动生成文件，请勿手动修改 */',
    '/* 来源: https://github.com/ixiongzai/Variable */',
    '',
    ':root {',
  ];

  // Palette colors
  lines.push('  /* Palette Colors */');
  for (const [name, data] of Object.entries(tokens.palette.light)) {
    lines.push(`  --${name}: ${toCssColor(data.hex, data.a)};`);
  }
  lines.push('');

  // Semantic colors
  lines.push('  /* Semantic Colors */');
  for (const [name, data] of Object.entries(tokens.semantic.light)) {
    lines.push(`  --semantic-${name}: ${toCssColor(data.hex, data.a)};`);
  }

  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

// ─── TypeScript Constants Generator ───

export function generateTs(tokens) {
  const lines = [
    '// 自动生成文件，请勿手动修改',
    '// 来源: https://github.com/ixiongzai/Variable',
    '// CSS variable 名称常量，方便 JS 中引用',
    '',
    'export const designTokens = {',
  ];

  // Palette
  lines.push('  palette: {');
  const paletteGroups = groupByPrefix(tokens.palette.light);
  for (const [groupName, vars] of Object.entries(paletteGroups)) {
    lines.push(`    ${tsSafeName(groupName)}: {`);
    for (const [name] of Object.entries(vars)) {
      const shortName = name.replace(`${groupName}-`, '');
      lines.push(`      ${tsSafeName(shortName)}: 'var(--${name})',`);
    }
    lines.push('    },');
  }
  lines.push('  },');

  // Semantic
  lines.push('  semantic: {');
  const semanticGroups = groupByPrefix(tokens.semantic.light);
  for (const [groupName, vars] of Object.entries(semanticGroups)) {
    lines.push(`    ${tsSafeName(groupName)}: {`);
    for (const [name] of Object.entries(vars)) {
      const shortName = name.replace(`${groupName}-`, '');
      lines.push(`      ${tsSafeName(shortName)}: 'var(--semantic-${name})',`);
    }
    lines.push('    },');
  }
  lines.push('  },');

  lines.push('} as const;');
  lines.push('');
  lines.push('export type DesignTokens = typeof designTokens;');
  lines.push('');

  return lines.join('\n');
}

/**
 * 按前缀分组变量
 */
function groupByPrefix(vars) {
  const groups = {};
  for (const [name, data] of Object.entries(vars)) {
    const parts = name.split('-');
    const prefix = parts[0];
    if (!groups[prefix]) groups[prefix] = {};
    groups[prefix][name] = data;
  }
  return groups;
}

/**
 * 确保 TS 属性名合法
 */
function tsSafeName(name) {
  if (/^[0-9]/.test(name) || /[^a-zA-Z0-9_$]/.test(name)) {
    return `'${name}'`;
  }
  return name;
}
