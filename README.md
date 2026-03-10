# HTML to Figma Capture — 浏览器插件

一键捕获当前页面 HTML，转换为 Figma 可读的设计格式，并自动写入系统剪切板。

---

## 功能特性

| 功能 | 说明 |
|------|------|
| **一键捕获** | 点击扩展图标即可对当前页面发起捕获，无需任何配置 |
| **自动复制** | 捕获完成后结果自动写入系统剪切板，可直接粘贴到 Figma |
| **绕过 CSP** | 脚本以扩展 `web_accessible_resources` 方式注入，避免页面内容安全策略拦截 |
| **防重复触发** | 捕获进行中时会跳过重复点击，防止并发冲突 |
| **错误通知** | 注入失败时通过系统通知告知用户，方便排查问题 |

---

## 工作原理

```
用户点击图标
     │
     ▼
background.js (Service Worker)
     │  chrome.scripting.executeScript — world: 'MAIN'
     │  注入 capture.js（以扩展资源方式加载，绕过 CSP）
     ▼
capture.js 在页面 MAIN 世界执行
     │  挂载 window.figma.captureForDesign API
     ▼
executeCapture() 调用 captureForDesign({ selector: 'body' })
     │  内部遍历 DOM，提取布局、样式、文字等信息
     ▼
捕获结果自动写入系统剪切板
     │
     ▼
打开 Figma → 粘贴（Cmd+V / Ctrl+V）即可导入设计
```

---

## 文件结构

```
html-to-figma-extension/
├── manifest.json    # Manifest V3 扩展配置
├── background.js    # Service Worker：监听图标点击，注入脚本
├── capture.js       # 核心捕获脚本，暴露 window.figma.captureForDesign
├── icons/
│   ├── icon16.png   # 16×16 扩展图标
│   ├── icon48.png   # 48×48 扩展图标
│   └── icon128.png  # 128×128 扩展图标
└── README.md
```

---

## 安装步骤

1. 打开 Chrome，访问 `chrome://extensions/`
2. 开启右上角「**开发者模式**」
3. 点击「**加载已解压的扩展程序**」
4. 选择本目录（`html-to-figma-extension/`）

加载成功后，Chrome 工具栏会出现扩展图标。

---

## 使用方法

1. 在 Chrome 中打开任意网页
2. 点击工具栏中的 **HTML to Figma** 扩展图标
3. 稍等片刻，待捕获完成（控制台输出 `Capture success`）
4. 打开 Figma，按 `Cmd+V`（Mac）或 `Ctrl+V`（Windows）粘贴

> 如果粘贴后没有内容，请打开浏览器控制台（F12）查看是否有错误信息。

---

## 技术栈

| 技术 | 用途 |
|------|------|
| **Manifest V3** | Chrome 扩展最新标准，使用 Service Worker 替代 Background Page |
| **chrome.scripting** | 动态将脚本注入到页面的 `MAIN` 执行世界 |
| **web_accessible_resources** | 将 `capture.js` 暴露为扩展资源，规避目标页面的 CSP 限制 |
| **Clipboard API** | `capture.js` 内部使用现代 Clipboard API 写入剪切板 |
| **chrome.notifications** | 错误发生时弹出系统级通知提示 |

---

## 注意事项

- **CSP 严格的网站**：本插件以 `web_accessible_resources` 方式加载 `capture.js`，已能绕过大多数 CSP 限制。但极少数网站的 `sandbox` 策略可能仍阻止执行。
- **特权页面**：Chrome 不允许扩展向 `chrome://`、`chrome-extension://` 等内置页面注入脚本，这是浏览器的安全限制，无法绕过。
- **重复点击**：捕获进行中再次点击图标会被忽略（通过 `window.__figmaCaptureRunning` 标志位保护）。

---

## 自定义与开发

### 修改捕获目标元素

在 `background.js` 的 `executeCapture` 函数中，将 `selector` 改为需要捕获的 CSS 选择器：

```javascript
window.figma.captureForDesign({
  selector: '#my-component', // 默认为 'body'
  verbose: false
})
```

### 查看详细日志

将 `verbose` 改为 `true` 可在控制台输出捕获过程的详细信息：

```javascript
window.figma.captureForDesign({
  selector: 'body',
  verbose: true
})
```

---

## 许可证

本项目仅供内部学习与调试使用。`capture.js` 核心逻辑版权归 [Figma](https://www.figma.com) 所有。
