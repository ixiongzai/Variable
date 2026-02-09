/**
 * Android 生成器
 * 生成 design_tokens_colors.xml 和 DesignTokens.kt
 */

/**
 * 将 hex 颜色转为 Android ARGB 格式 (#AARRGGBB)
 */
function hexToAndroidColor(hex, a = 1) {
  const clean = hex.replace('#', '');
  const alpha = Math.round(a * 255).toString(16).padStart(2, '0').toUpperCase();
  return `#${alpha}${clean.substring(0, 6).toUpperCase()}`;
}

/**
 * 将 hex 颜色转为 Compose Color(0xAARRGGBB) 格式
 */
function hexToComposeColor(hex, a = 1) {
  const clean = hex.replace('#', '').toUpperCase();
  const alpha = Math.round(a * 255).toString(16).padStart(2, '0').toUpperCase();
  return `Color(0x${alpha}${clean.substring(0, 6)})`;
}

/**
 * 将 kebab-case 名称转为 snake_case (XML resource name)
 */
function toXmlName(kebabName) {
  return kebabName.replace(/-/g, '_');
}

/**
 * 将 kebab-case 名称转为 PascalCase (Kotlin property)
 */
function toKotlinName(kebabName) {
  return kebabName
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

// ─── XML Generator ───

export function generateColorsXml(tokens, dlsTokens) {
  const lines = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<!-- 自动生成文件，请勿手动修改 -->',
    '<!-- 来源: https://github.com/ixiongzai/Variable -->',
    '<resources>',
  ];

  // Palette colors
  lines.push('    <!-- Palette Colors -->');
  for (const [name, data] of Object.entries(tokens.palette.light)) {
    const xmlName = toXmlName(name);
    lines.push(`    <color name="${xmlName}">${hexToAndroidColor(data.hex, data.a)}</color>`);
  }
  lines.push('');

  // Semantic colors
  lines.push('    <!-- Semantic Colors -->');
  for (const [name, data] of Object.entries(tokens.semantic.light)) {
    const xmlName = `semantic_${toXmlName(name)}`;
    lines.push(`    <color name="${xmlName}">${hexToAndroidColor(data.hex, data.a)}</color>`);
  }
  lines.push('');

  // Global colors (light mode only for XML)
  lines.push('    <!-- Global Colors (Light) -->');
  const lightColorVars = Object.entries(tokens.global.light).filter(([, d]) => d.resolvedType === 'COLOR');
  for (const [name, data] of lightColorVars) {
    const xmlName = `global_${toXmlName(name)}`;
    const a = data.a != null ? data.a : 1;
    lines.push(`    <color name="${xmlName}">${hexToAndroidColor(data.hex, a)}</color>`);
  }
  lines.push('');

  // DLS brand colors
  if (dlsTokens && Object.keys(dlsTokens.colors).length > 0) {
    lines.push('    <!-- DLS Brand Colors -->');
    for (const [name, hex] of Object.entries(dlsTokens.colors)) {
      const xmlName = toXmlName(name);
      lines.push(`    <color name="${xmlName}">${hexToAndroidColor(hex)}</color>`);
    }
  }

  lines.push('</resources>');
  lines.push('');

  return lines.join('\n');
}

// ─── Kotlin Generator ───

export function generateKotlin(tokens, dlsTokens) {
  const lines = [
    'package com.enactflow.youyouai.ui.compose.theme',
    '',
    '// 自动生成文件，请勿手动修改',
    '// 来源: https://github.com/ixiongzai/Variable',
    '',
    'import androidx.compose.ui.graphics.Color',
    '',
    'object DesignTokens {',
  ];

  // Palette
  lines.push('    // Palette');
  lines.push('    object Palette {');
  for (const [name, data] of Object.entries(tokens.palette.light)) {
    const ktName = toKotlinName(name);
    lines.push(`        val ${ktName} = ${hexToComposeColor(data.hex, data.a)}`);
  }
  lines.push('    }');
  lines.push('');

  // Semantic (Light)
  lines.push('    // Semantic Colors (Light)');
  lines.push('    object SemanticLight {');
  for (const [name, data] of Object.entries(tokens.semantic.light)) {
    const ktName = toKotlinName(name);
    lines.push(`        val ${ktName} = ${hexToComposeColor(data.hex, data.a)}`);
  }
  lines.push('    }');
  lines.push('');

  // Global Light
  lines.push('    // Global Colors (Light)');
  lines.push('    object GlobalLight {');
  const lightColorVars = Object.entries(tokens.global.light).filter(([, d]) => d.resolvedType === 'COLOR');
  for (const [name, data] of lightColorVars) {
    const ktName = toKotlinName(name);
    const a = data.a != null ? data.a : 1;
    lines.push(`        val ${ktName} = ${hexToComposeColor(data.hex, a)}`);
  }
  lines.push('    }');
  lines.push('');

  // Global Dark
  lines.push('    // Global Colors (Dark)');
  lines.push('    object GlobalDark {');
  const darkColorVars = Object.entries(tokens.global.dark).filter(([, d]) => d.resolvedType === 'COLOR');
  for (const [name, data] of darkColorVars) {
    const ktName = toKotlinName(name);
    const a = data.a != null ? data.a : 1;
    lines.push(`        val ${ktName} = ${hexToComposeColor(data.hex, a)}`);
  }
  lines.push('    }');
  lines.push('');

  // Border Radius
  lines.push('    // Border Radius');
  lines.push('    object BorderRadius {');
  const radiusVars = Object.entries(tokens.global.light).filter(
    ([name, d]) => d.resolvedType === 'FLOAT' && name.includes('border-radius')
  );
  for (const [name, data] of radiusVars) {
    const ktName = toKotlinName(name.replace('semi-border-radius-', ''));
    lines.push(`        const val ${ktName} = ${data.value}f`);
  }
  lines.push('    }');
  lines.push('');

  // DLS Brand Colors
  if (dlsTokens && Object.keys(dlsTokens.colors).length > 0) {
    lines.push('    // DLS Brand Colors');
    lines.push('    object DLS {');
    for (const [name, hex] of Object.entries(dlsTokens.colors)) {
      const ktName = toKotlinName(name.replace(/^dls-color-/, ''));
      lines.push(`        val ${ktName} = ${hexToComposeColor(hex)}`);
    }
    lines.push('    }');
    lines.push('');
  }

  // Typography
  if (dlsTokens) {
    lines.push('    // Typography');
    lines.push('    object Typography {');
    for (const [, family] of Object.entries(dlsTokens.typography.fontFamilies)) {
      lines.push(`        const val FontFamily = "${family}"`);
    }
    for (const [index, size] of Object.entries(dlsTokens.typography.fontSizes)) {
      lines.push(`        const val FontSize${index} = ${size}`);
    }
    for (const [index, lh] of Object.entries(dlsTokens.typography.lineHeights)) {
      lines.push(`        const val LineHeight${index} = ${lh}`);
    }
    lines.push('    }');
  }

  lines.push('}');
  lines.push('');

  return lines.join('\n');
}
