# Variable — Design Token 中心仓库

Figma 设计变量的单一数据源。自动转换为 iOS / Android / Web 三端可用格式，三端通过 git submodule 引用。

## 架构

```
Figma  ──sync──>  Variable (本仓库)
                       │
                  GitHub Actions
                  自动转换 + commit
                       │
                  output/ 目录
              ┌────────┼────────┐
              │        │        │
          ios/     android/    web/
              │        │        │
              ▼        ▼        ▼
        YouYouAI  YouYouAI   YouYouAI
         (iOS)   -Android   -Website
              └── git submodule ──┘
```

## 文件结构

```
Variable/
├── .github/workflows/sync-tokens.yml  # JSON 变更时自动转换
├── scripts/
│   ├── transform.mjs                  # 主转换入口
│   ├── parsers/
│   │   ├── parse-figma-variables.mjs  # 解析 Figma 变量
│   │   └── parse-tokens.mjs           # 解析 DLS tokens
│   └── generators/
│       ├── ios.mjs                    # Swift 生成器
│       ├── android.mjs               # XML + Kotlin 生成器
│       └── web.mjs                   # CSS Variables + TS 生成器
├── output/                            # ⬇ 生成产物，直接 commit 到仓库
│   ├── ios/DesignTokens.swift
│   ├── android/design_tokens_colors.xml
│   ├── android/DesignTokens.kt
│   ├── web/design-tokens.css
│   └── web/design-tokens.ts
├── .global.json                       # Figma 全局变量（light/dark）
├── tokens.json                        # DLS 设计语言 tokens
├── 基础色彩梯度.json                    # 基础调色板
├── 语义色.json                         # 语义色别名
└── variables.json                     # 综合变量配置
```

## 自动化流程

1. Figma 同步产生 JSON 变更，push 到 `main`
2. GitHub Actions 检测到 `*.json` 变更，运行 `node scripts/transform.mjs`
3. 生成的 `output/` 目录自动 commit 回本仓库
4. 三端仓库更新 submodule 即可获取最新 token

不需要额外配置 secret，workflow 使用默认的 `GITHUB_TOKEN` 即可。

## 三端仓库接入（git submodule）

### 添加 submodule（首次）

```bash
# iOS
cd YouYouAI
git submodule add https://github.com/ixiongzai/Variable.git Variable

# Android
cd YouYouAI-Android
git submodule add https://github.com/ixiongzai/Variable.git Variable

# Web
cd YouYouAI-Website
git submodule add https://github.com/ixiongzai/Variable.git Variable
```

### 在项目中引用

**iOS** — 在 Xcode 中将 `Variable/output/ios/DesignTokens.swift` 添加到 target，或在 Swift Package 的 sources 中引用：
```swift
import DesignTokens  // 或直接引用 DesignTokens.Palette.Red.shade0
```

**Android** — 在 `build.gradle` 中将 output 目录加为资源/源码路径：
```groovy
android {
    sourceSets {
        main {
            res.srcDirs += ['../Variable/output/android']  // colors XML
            java.srcDirs += ['../Variable/output/android']  // Kotlin
        }
    }
}
```
或者简单地在构建脚本中 copy 一下文件。

**Web** — 在代码中直接 import：
```css
/* 在 index.css 中引入 */
@import '../Variable/output/web/design-tokens.css';
```
```typescript
// TypeScript 中引用
import { designTokens } from '../Variable/output/web/design-tokens';
```

### 更新 submodule（获取最新 token）

```bash
git submodule update --remote Variable
git add Variable
git commit -m "chore: update design tokens"
```

### clone 带 submodule 的仓库

```bash
git clone --recurse-submodules <repo-url>
# 或 clone 后补充
git submodule update --init
```

## 本地开发

```bash
# 手动运行转换
node scripts/transform.mjs

# 输出到 output/ 目录
```

## 产物格式示例

### iOS (`output/ios/DesignTokens.swift`)

```swift
public enum DesignTokens {
    public enum Palette {
        public enum Red {
            public static let shade0 = Color(red: 1.0, green: 0.9, blue: 0.9)
        }
    }
    public enum Semantic { ... }
    public enum GlobalLight { ... }
    public enum GlobalDark { ... }
    public enum DLS { ... }
    public enum Typography { ... }
    public enum BorderRadius { ... }
}
```

### Android (`output/android/DesignTokens.kt`)

```kotlin
object DesignTokens {
    object Palette { val Red0 = Color(0xFFFFE5E5) }
    object SemanticLight { val TextPrimary = Color(0xFF212121) }
    object SemanticDark { val TextPrimary = Color(0xFFE5E1E6) }
    object DLS { ... }
    object Typography { ... }
}
```

### Web (`output/web/design-tokens.css`)

```css
:root {
  --palette-red-0: #FFE5E5;
  --semantic-text-primary: #212121;
  --dls-color-brand-6: #0066ff;
}
[data-theme="dark"] {
  /* dark mode overrides */
}
```
