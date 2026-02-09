/**
 * Android 生成器
 * 生成 design_tokens_colors.xml 和 DesignTokens.kt
 * 只包含 palette（基础色彩梯度）和 semantic（语义色）
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

export function generateColorsXml(tokens) {
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

  lines.push('</resources>');
  lines.push('');

  return lines.join('\n');
}

// ─── Kotlin Generator ───

export function generateKotlin(tokens) {
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

  // Semantic
  lines.push('    // Semantic Colors');
  lines.push('    object Semantic {');
  for (const [name, data] of Object.entries(tokens.semantic.light)) {
    const ktName = toKotlinName(name);
    lines.push(`        val ${ktName} = ${hexToComposeColor(data.hex, data.a)}`);
  }
  lines.push('    }');

  lines.push('}');
  lines.push('');

  return lines.join('\n');
}
