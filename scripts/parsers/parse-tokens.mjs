/**
 * 解析 tokens.json (Design Language System 格式)
 * 这个文件格式与 Figma 变量导出不同，是 Tokens Studio 格式
 */

/**
 * 解析 tokens.json 并返回结构化 DLS token 数据
 */
export function parseDlsTokens(json) {
  const result = {
    colors: {},
    typography: {
      fontFamilies: {},
      fontSizes: {},
      lineHeights: {},
      fontWeights: {},
    },
    effects: {},
    components: {},
  };

  const global = json.global || {};

  // 解析颜色
  for (const [key, entry] of Object.entries(global)) {
    if (entry && entry.type === 'color' && typeof entry.value === 'string') {
      result.colors[key] = entry.value;
    }
  }

  // 解析字体族
  if (global.fontFamilies) {
    for (const [key, entry] of Object.entries(global.fontFamilies)) {
      if (entry && entry.type === 'fontFamilies') {
        result.typography.fontFamilies[key] = entry.value;
      }
    }
  }

  // 解析字号
  if (global.fontSize) {
    for (const [key, entry] of Object.entries(global.fontSize)) {
      if (entry && entry.type === 'fontSizes') {
        result.typography.fontSizes[key] = parseInt(entry.value, 10);
      }
    }
  }

  // 解析行高
  if (global.lineHeights) {
    for (const [key, entry] of Object.entries(global.lineHeights)) {
      if (entry && entry.type === 'lineHeights') {
        result.typography.lineHeights[key] = parseInt(entry.value, 10);
      }
    }
  }

  // 解析字重
  if (global.fontWeights) {
    for (const [key, entry] of Object.entries(global.fontWeights)) {
      if (entry && entry.type === 'fontWeights') {
        result.typography.fontWeights[key] = entry.value;
      }
    }
  }

  // 解析阴影/特效
  for (const [key, entry] of Object.entries(global)) {
    if (entry && entry.type === 'boxShadow') {
      result.effects[key] = entry.value;
    }
  }

  // 解析组件 tokens
  const component = json.component || {};
  for (const [groupName, group] of Object.entries(component)) {
    if (typeof group !== 'object') continue;
    result.components[groupName] = {};
    flattenComponentTokens(group, result.components[groupName], '');
  }

  return result;
}

/**
 * 递归展平组件 token 树
 */
function flattenComponentTokens(obj, output, prefix) {
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === 'object' && 'value' in value && 'type' in value) {
      // 叶子节点
      const fullKey = prefix ? `${prefix}/${key}` : key;
      output[fullKey] = {
        value: value.value,
        type: value.type,
      };
    } else if (value && typeof value === 'object') {
      // 嵌套对象
      const fullKey = prefix ? `${prefix}/${key}` : key;
      flattenComponentTokens(value, output, fullKey);
    }
  }
}

/**
 * 解析 DLS 颜色中的 $ 引用
 * "$dls-color-brand-7" -> 查找 global["dls-color-brand-7"].value
 */
export function resolveDlsColorRef(ref, colors) {
  if (typeof ref !== 'string') return ref;
  if (ref.startsWith('$')) {
    const key = ref.slice(1);
    return colors[key] || ref;
  }
  if (ref.startsWith('{') && ref.endsWith('}')) {
    const key = ref.slice(1, -1);
    return colors[key] || ref;
  }
  return ref;
}
