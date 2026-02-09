/**
 * 解析 Figma 变量 JSON 文件
 * 支持：基础色彩梯度.json、语义色.json
 */

/**
 * 将 Figma RGBA (0-1) 转换为 hex 字符串
 */
export function rgbaToHex(r, g, b, a = 1) {
  const toHex = (v) => Math.round(v * 255).toString(16).padStart(2, '0').toUpperCase();
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  if (a < 1) {
    return `${hex}${toHex(a)}`;
  }
  return hex;
}

/**
 * 将 Figma 变量名转换为 kebab-case CSS 变量名
 * "Full/Transparency/black 100%" -> "full-transparency-black-100"
 * "palette/red/--semi-red-0" -> "palette-red-semi-red-0"
 */
export function nameToKebab(name) {
  return name
    .replace(/\//g, '-')
    .replace(/\s+/g, '-')
    .replace(/--/g, '')
    .replace(/%/g, '')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

/**
 * 将 Figma 变量名转换为 camelCase
 */
export function nameToCamel(name) {
  const kebab = nameToKebab(name);
  return kebab.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

/**
 * 将 Figma 变量名转换为 PascalCase
 */
export function nameToPascal(name) {
  const camel = nameToCamel(name);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * 将 Figma 变量名转换为 snake_case (Android XML)
 */
export function nameToSnake(name) {
  return nameToKebab(name).replace(/-/g, '_');
}

/**
 * 解析 Figma 变量集合 JSON (基础色彩梯度.json / 语义色.json / .global.json)
 * 返回统一的变量映射: { [variableId]: { name, resolvedType, values: { [mode]: value } } }
 */
export function parseFigmaCollection(json) {
  const result = {
    collectionName: '',
    modes: [],
    defaultMode: '',
    variables: new Map(),
  };

  if (!json.collections || json.collections.length === 0) return result;

  const collection = json.collections[0];
  result.collectionName = collection.name;
  result.modes = collection.modes.map((m) => m.name);
  result.defaultMode = collection.modes.find((m) => m.modeId === collection.defaultModeId)?.name || result.modes[0];

  for (const variable of collection.variables) {
    const values = {};
    for (const [modeName, value] of Object.entries(variable.valuesByMode)) {
      if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
        values[modeName] = { type: 'alias', id: value.id };
      } else if (value && typeof value === 'object' && 'r' in value) {
        values[modeName] = {
          type: 'color',
          hex: value.hex || rgbaToHex(value.r, value.g, value.b, value.a),
          r: value.r,
          g: value.g,
          b: value.b,
          a: value.a,
        };
      } else {
        values[modeName] = { type: 'literal', value };
      }
    }

    result.variables.set(variable.id, {
      id: variable.id,
      name: variable.name,
      resolvedType: variable.resolvedType,
      description: variable.description || '',
      scopes: variable.scopes || [],
      values,
    });
  }

  return result;
}

/**
 * 解析 Figma JSON 并构建变量表
 * 支持解析 VARIABLE_ALIAS 引用
 */
export function buildVariableRegistry(paletteJson, semanticJson) {
  const palette = parseFigmaCollection(paletteJson);
  const semantic = parseFigmaCollection(semanticJson);

  // 合并所有变量到一个 registry
  const allVariables = new Map();
  for (const [id, v] of palette.variables) allVariables.set(id, { ...v, collection: 'palette' });
  for (const [id, v] of semantic.variables) allVariables.set(id, { ...v, collection: 'semantic' });

  /**
   * 解析一个变量值，如果是 alias 则递归查找
   */
  function resolveValue(value, visited = new Set()) {
    if (!value) return null;
    if (value.type === 'color' || value.type === 'literal') return value;
    if (value.type === 'alias') {
      if (visited.has(value.id)) return null; // 防循环
      visited.add(value.id);
      const target = allVariables.get(value.id);
      if (!target) return null;
      // 取 target 的默认 mode 值
      const modes = Object.keys(target.values);
      if (modes.length === 0) return null;
      return resolveValue(target.values[modes[0]], visited);
    }
    return value;
  }

  return {
    palette,
    semantic,
    allVariables,
    resolveValue,
    resolveVariableInMode(variableId, modeName) {
      const variable = allVariables.get(variableId);
      if (!variable) return null;
      const modeValue = variable.values[modeName];
      if (!modeValue) {
        // fallback: try first mode
        const modes = Object.keys(variable.values);
        return modes.length > 0 ? resolveValue(variable.values[modes[0]]) : null;
      }
      if (modeValue.type === 'alias') {
        const target = allVariables.get(modeValue.id);
        if (!target) return null;
        // 在同名 mode 或默认 mode 查找
        const targetModeValue = target.values[modeName] || target.values[Object.keys(target.values)[0]];
        return resolveValue(targetModeValue);
      }
      return resolveValue(modeValue);
    },
  };
}

/**
 * 从 registry 中提取结构化的 token 数据
 */
export function extractTokens(registry) {
  const tokens = {
    palette: { light: {} },
    semantic: { light: {} },
  };

  // 提取 palette（基础色彩梯度）
  for (const [, variable] of registry.palette.variables) {
    const lightVal = registry.resolveVariableInMode(variable.id, 'light');
    if (lightVal && lightVal.type === 'color') {
      const name = nameToKebab(variable.name);
      tokens.palette.light[name] = {
        hex: lightVal.hex,
        r: lightVal.r,
        g: lightVal.g,
        b: lightVal.b,
        a: lightVal.a,
        originalName: variable.name,
      };
    }
  }

  // 提取 semantic（语义色）
  for (const [, variable] of registry.semantic.variables) {
    const defaultMode = registry.semantic.defaultMode;
    const val = registry.resolveVariableInMode(variable.id, defaultMode);
    if (val && val.type === 'color') {
      const name = nameToKebab(variable.name);
      tokens.semantic.light[name] = {
        hex: val.hex,
        r: val.r,
        g: val.g,
        b: val.b,
        a: val.a,
        originalName: variable.name,
      };
    }
  }

  return tokens;
}
