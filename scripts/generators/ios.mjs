/**
 * iOS Swift 生成器
 * 生成 DesignTokens.swift
 * 只包含 palette（基础色彩梯度）和 semantic（语义色）
 */

const HEADER = `// 自动生成文件，请勿手动修改
// 来源: https://github.com/ixiongzai/Variable
// 生成时间: ${new Date().toISOString()}

import SwiftUI
import UIKit
`;

/**
 * 将 hex 颜色转为 Swift Color 构造器字符串
 */
function hexToSwiftColor(hex, a = 1) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  if (a < 1) {
    return `Color(red: ${r.toFixed(3)}, green: ${g.toFixed(3)}, blue: ${b.toFixed(3)}).opacity(${a.toFixed(2)})`;
  }
  return `Color(red: ${r.toFixed(3)}, green: ${g.toFixed(3)}, blue: ${b.toFixed(3)})`;
}

/**
 * 将 hex 颜色转为 UIColor 构造器字符串
 */
function hexToUIColor(hex, a = 1) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return `UIColor(red: ${r.toFixed(3)}, green: ${g.toFixed(3)}, blue: ${b.toFixed(3)}, alpha: ${a.toFixed(2)})`;
}

/**
 * 将 kebab-case 名称转为 Swift 属性名 (camelCase)
 */
function toSwiftPropertyName(kebabName) {
  return kebabName
    .split('-')
    .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
}

/**
 * 将 kebab-case 名称转为 Swift 枚举名 (PascalCase)
 */
function toSwiftEnumName(kebabName) {
  return kebabName
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
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

export function generateSwift(tokens) {
  const lines = [HEADER];

  lines.push('public enum DesignTokens {');
  lines.push('');

  // MARK: - Palette Colors
  lines.push('    // MARK: - Palette Colors');
  lines.push('    public enum Palette {');

  const paletteGroups = groupByPrefix(tokens.palette.light);
  for (const [groupName, vars] of Object.entries(paletteGroups)) {
    const enumName = toSwiftEnumName(groupName);
    lines.push(`        public enum ${enumName} {`);
    for (const [name, data] of Object.entries(vars)) {
      const propName = toSwiftPropertyName(name);
      if (data.a < 1) {
        lines.push(`            public static let ${propName} = ${hexToSwiftColor(data.hex, data.a)}`);
      } else {
        lines.push(`            public static let ${propName} = ${hexToSwiftColor(data.hex)}`);
      }
    }
    lines.push('        }');
  }
  lines.push('    }');
  lines.push('');

  // MARK: - Semantic Colors
  lines.push('    // MARK: - Semantic Colors');
  lines.push('    public enum Semantic {');
  for (const [name, data] of Object.entries(tokens.semantic.light)) {
    const propName = toSwiftPropertyName(name);
    if (data.a < 1) {
      lines.push(`        public static let ${propName} = ${hexToSwiftColor(data.hex, data.a)}`);
    } else {
      lines.push(`        public static let ${propName} = ${hexToSwiftColor(data.hex)}`);
    }
  }
  lines.push('    }');

  lines.push('}');
  lines.push('');

  // UIColor extensions
  lines.push('// MARK: - UIColor Extensions');
  lines.push('extension UIColor {');
  lines.push('    public enum designToken {');
  for (const [name, data] of Object.entries(tokens.semantic.light)) {
    const propName = toSwiftPropertyName(name);
    lines.push(`        public static let ${propName} = ${hexToUIColor(data.hex, data.a)}`);
  }
  lines.push('    }');
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}
