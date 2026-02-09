#!/usr/bin/env node

/**
 * Design Token 转换主入口
 * 读取 Figma 导出的 JSON 文件，生成三端可用的 token 文件
 *
 * 用法: node scripts/transform.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildVariableRegistry, extractTokens } from './parsers/parse-figma-variables.mjs';
import { parseDlsTokens } from './parsers/parse-tokens.mjs';
import { generateSwift } from './generators/ios.mjs';
import { generateColorsXml, generateKotlin } from './generators/android.mjs';
import { generateCss, generateTs } from './generators/web.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ─── 读取源文件 ───

function readJson(filename) {
  const path = join(ROOT, filename);
  if (!existsSync(path)) {
    console.warn(`[WARN] File not found: ${filename}, skipping`);
    return null;
  }
  const content = readFileSync(path, 'utf-8');
  return JSON.parse(content);
}

console.log('Reading source files...');
const paletteJson = readJson('基础色彩梯度.json');
const semanticJson = readJson('语义色.json');
const globalJson = readJson('.global.json');
const tokensJson = readJson('tokens.json');

if (!paletteJson || !semanticJson || !globalJson) {
  console.error('[ERROR] Required Figma JSON files are missing');
  process.exit(1);
}

// ─── 解析 ───

console.log('Parsing Figma variables...');
const registry = buildVariableRegistry(paletteJson, semanticJson, globalJson);
const tokens = extractTokens(registry);

console.log(`  Palette: ${Object.keys(tokens.palette.light).length} variables`);
console.log(`  Semantic: ${Object.keys(tokens.semantic.light).length} variables`);
console.log(`  Global (light): ${Object.keys(tokens.global.light).length} variables`);
console.log(`  Global (dark): ${Object.keys(tokens.global.dark).length} variables`);

let dlsTokens = null;
if (tokensJson) {
  console.log('Parsing DLS tokens...');
  dlsTokens = parseDlsTokens(tokensJson);
  console.log(`  DLS colors: ${Object.keys(dlsTokens.colors).length}`);
  console.log(`  DLS font sizes: ${Object.keys(dlsTokens.typography.fontSizes).length}`);
}

// ─── 生成产物 ───

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function writeOutput(subdir, filename, content) {
  const dir = join(ROOT, 'output', subdir);
  ensureDir(dir);
  const path = join(dir, filename);
  writeFileSync(path, content, 'utf-8');
  console.log(`  -> output/${subdir}/${filename}`);
}

console.log('\nGenerating outputs...');

// iOS
console.log('iOS:');
const swift = generateSwift(tokens, dlsTokens);
writeOutput('ios', 'DesignTokens.swift', swift);

// Android
console.log('Android:');
const colorsXml = generateColorsXml(tokens, dlsTokens);
writeOutput('android', 'design_tokens_colors.xml', colorsXml);
const kotlin = generateKotlin(tokens, dlsTokens);
writeOutput('android', 'DesignTokens.kt', kotlin);

// Web
console.log('Web:');
const css = generateCss(tokens, dlsTokens);
writeOutput('web', 'design-tokens.css', css);
const ts = generateTs(tokens, dlsTokens);
writeOutput('web', 'design-tokens.ts', ts);

console.log('\nDone!');
