/**
 * Web 生成器
 * 生成 design-tokens.css (CSS Variables) 和 design-tokens.ts (TS 常量)
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

export function generateCss(tokens, dlsTokens) {
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
  lines.push('');

  // Global colors (light)
  lines.push('  /* Global Colors */');
  const lightColorVars = Object.entries(tokens.global.light).filter(([, d]) => d.resolvedType === 'COLOR');
  for (const [name, data] of lightColorVars) {
    const a = data.a != null ? data.a : 1;
    lines.push(`  --global-${name}: ${toCssColor(data.hex, a)};`);
  }
  lines.push('');

  // Global float values (border radius, shadows)
  lines.push('  /* Border Radius */');
  const radiusVars = Object.entries(tokens.global.light).filter(
    ([name, d]) => d.resolvedType === 'FLOAT' && name.includes('border-radius')
  );
  for (const [name, data] of radiusVars) {
    lines.push(`  --${name}: ${data.value}px;`);
  }
  lines.push('');

  // DLS brand colors
  if (dlsTokens && Object.keys(dlsTokens.colors).length > 0) {
    lines.push('  /* DLS Brand Colors */');
    for (const [name, hex] of Object.entries(dlsTokens.colors)) {
      lines.push(`  --${name}: ${hex};`);
    }
    lines.push('');
  }

  // Typography
  if (dlsTokens) {
    lines.push('  /* Typography */');
    for (const [, family] of Object.entries(dlsTokens.typography.fontFamilies)) {
      lines.push(`  --dls-font-family: '${family}', -apple-system, BlinkMacSystemFont, sans-serif;`);
    }
    for (const [index, size] of Object.entries(dlsTokens.typography.fontSizes)) {
      lines.push(`  --dls-font-size-${index}: ${size}px;`);
    }
    for (const [index, lh] of Object.entries(dlsTokens.typography.lineHeights)) {
      lines.push(`  --dls-line-height-${index}: ${lh}px;`);
    }
  }

  lines.push('}');
  lines.push('');

  // Dark mode overrides
  lines.push('[data-theme="dark"] {');
  lines.push('  /* Global Colors (Dark) */');
  const darkColorVars = Object.entries(tokens.global.dark).filter(([, d]) => d.resolvedType === 'COLOR');
  for (const [name, data] of darkColorVars) {
    const a = data.a != null ? data.a : 1;
    // 只输出与 light 不同的值
    const lightData = tokens.global.light[name];
    if (lightData && lightData.hex === data.hex && (lightData.a || 1) === a) continue;
    lines.push(`  --global-${name}: ${toCssColor(data.hex, a)};`);
  }
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

// ─── TypeScript Constants Generator ───

export function generateTs(tokens, dlsTokens) {
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

  // Global
  lines.push('  global: {');
  const globalGroups = groupByPrefix(
    Object.fromEntries(Object.entries(tokens.global.light).filter(([, d]) => d.resolvedType === 'COLOR'))
  );
  for (const [groupName, vars] of Object.entries(globalGroups)) {
    lines.push(`    ${tsSafeName(groupName)}: {`);
    for (const [name] of Object.entries(vars)) {
      const shortName = name.replace(`${groupName}-`, '');
      lines.push(`      ${tsSafeName(shortName)}: 'var(--global-${name})',`);
    }
    lines.push('    },');
  }
  lines.push('  },');

  // DLS
  if (dlsTokens && Object.keys(dlsTokens.colors).length > 0) {
    lines.push('  dls: {');
    for (const [name] of Object.entries(dlsTokens.colors)) {
      const shortName = name.replace(/^dls-color-/, '');
      lines.push(`    ${tsSafeName(shortName)}: 'var(--${name})',`);
    }
    lines.push('  },');
  }

  // Border Radius
  lines.push('  borderRadius: {');
  const radiusVars = Object.entries(tokens.global.light).filter(
    ([name, d]) => d.resolvedType === 'FLOAT' && name.includes('border-radius')
  );
  for (const [name] of radiusVars) {
    const shortName = name.replace('semi-border-radius-', '');
    lines.push(`    ${tsSafeName(shortName)}: 'var(--${name})',`);
  }
  lines.push('  },');

  // Typography
  if (dlsTokens) {
    lines.push('  typography: {');
    lines.push("    fontFamily: 'var(--dls-font-family)',");
    for (const [index] of Object.entries(dlsTokens.typography.fontSizes)) {
      lines.push(`    fontSize${index}: 'var(--dls-font-size-${index})',`);
    }
    for (const [index] of Object.entries(dlsTokens.typography.lineHeights)) {
      lines.push(`    lineHeight${index}: 'var(--dls-line-height-${index})',`);
    }
    lines.push('  },');
  }

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
  // 如果以数字开头或包含特殊字符，用引号包裹
  if (/^[0-9]/.test(name) || /[^a-zA-Z0-9_$]/.test(name)) {
    return `'${name}'`;
  }
  return name;
}
