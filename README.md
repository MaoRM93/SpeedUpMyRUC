<p align="center">
  <img src="icons/icon128.png" width="96" height="96" alt="SpeedUpMyRUC">
</p>

<h1 align="center">SpeedUpMyRUC</h1>

<p align="center">中国人民大学新数字化门户（my.ruc.edu.cn）加速扩展</p>

---

## 它解决什么问题

门户首页首次加载实测约 **42.5 MB / 347 个请求 / 63 秒**。真正拖慢速度的不是安全验证，而是装饰性素材和 HTTP/1.1 的连接拥堵：

| 现象 | 数据 |
| --- | --- |
| 首页顶栏动画 `banner_ruc.gif` | 单文件 **15.9 MB**，被完整下载两次，占总流量 73% |
| 子页面背景装饰图 `bg_img3-*.png` | 3 张合计 **3.31 MB**，占该子页面流量 42% |
| 进入子页面时重复下载 | 123 个资源里有 **116 个**与首页完全相同 |
| 连接模型 | HTTP/1.1，同一域名仅 6 条连接，347 个请求中 343 个打同一域名，排队累计 300 秒 |

这些资源对信息获取没有任何帮助。扩展在网络层直接拦截它们，再把页面上已经无意义的装饰块和冗余文案隐藏掉。

## 功能

扩展菜单里共四个分组、十四项，全部可以独立勾选，默认全开，修改即时生效。

**装饰资源（网络层拦截，`declarativeNetRequest`）**

- 顶栏横幅动画（含静态帧）—— 约 15.9 MB
- 页面背景装饰图 —— 约 3.3 MB
- 页脚背景图
- 登录页失效验证码

**页面元素（整块隐藏）**

- 顶部装饰区
- 右侧悬浮栏及 AI 入口
- 机器人图标残留入口
- 右侧第 10 块推荐

**文案精简**

- 首页标语灰字
- 子页面标题灰字
- 「试运行」标签
- 首屏灰色副标题（自动识别）

**布局整理**

- 标题下留白压缩（取消 140px 的 `margin-bottom`）
- 「我的收藏」模块上移到「通知公告」之上

## 安装

扩展没有上架任何商店，需要以「已解压的扩展程序」方式加载。
压缩包内提供了 **教程.html** 打开看即可

| 浏览器 | 入口 | 按钮 |
| --- | --- | --- |
| Google Chrome | `chrome://extensions` | 加载已解压的扩展程序 |
| Microsoft Edge | `edge://extensions` | 加载解压缩的扩展 |
| 360 安全浏览器 | 菜单 → 工具 → 扩展程序 | 载入正在开发的扩展程序 |
| 360 极速浏览器 | 扩展图标 → 管理 | 加载已解压的扩展程序 |
| 华为浏览器 | 设置 → 扩展程序（`hwbrowser://extensions`） | 加载，或直接拖入文件夹 |
| 联想浏览器 | 设置 → 更多工具 → 扩展程序 | 加载，或直接拖拽文件夹 |
| Firefox | `about:debugging#/runtime/this-firefox` | 临时载入 `manifest.json` |
| Safari | Xcode 转制（`safari-web-extension-converter`） | 需 macOS |

简要流程：

1. 下载仓库代码并解压（或者直接 `git clone`）
2. 确认文件夹**这一层**能直接看到 `manifest.json`
3. 打开浏览器的扩展管理页，开启开发者模式
4. 点「加载已解压的扩展程序」，选中该文件夹
5. 打开 `my.ruc.edu.cn` 验证效果

> 安装后不要删除或移动这个文件夹，否则扩展会立即失效。

**Firefox 与 Safari 功能不完整**：Firefox 的 `declarativeNetRequest` 实现与 Chrome 有差异，可能出现「界面变干净但大图仍在下载」；且未签名扩展只能临时载入，重启失效。Safari 需要用 Xcode 转制并签名，网络拦截能力同样受限。日常使用建议 Chrome 或 Edge。

## 使用

点击工具栏图标，出现分组勾选菜单：

- 组标题本身是勾选框，点击可整组开关，部分选中时显示半选状态
- 单个项目可单独勾选
- 网络拦截项对**之后的请求**生效，已缓存图片需刷新一次才会消失；页面元素与布局项立即生效

## 项目结构

```
manifest.json      扩展清单（MV3）
items.js           拦截清单：分组、文案、选择器、规则集映射
rules/             4 个 DNR 规则集，可独立启停
  banner.json        顶栏横幅
  background.json    页面背景图
  footer.json        页脚背景
  captcha.json       登录页失效验证码
ui-cleanup.js      CSS 注入、文本兜底、灰字识别、模块重排
popup.html/js      分组勾选菜单
content.js         域名预连接（preconnect / dns-prefetch）
background.js      图标资源预热
icons/             16 / 32 / 48 / 128 图标
docs/              安装指南
```

### 新增一个拦截项

所有条目集中在 `items.js`，菜单与页面脚本共用同一份定义，改一处两边同步：

```js
{
  key: "someBlock",            // 唯一标识，也是存储里的开关名
  label: "某个装饰块",          // 菜单显示文案
  note: "1.2 MB",              // 可选，右侧灰色注释
  css: ["#sui-app-page > div.css-1nl44e3"],  // 选择器，命中后 display:none
  texts: ["某段文案"],          // 可选，文本兜底（应对 MUI 拆分节点）
  entry: true                  // 可选，沿 a/button/li 向上找到整条入口再隐藏
}
```

如果要在**网络层**拦截资源，需在 `rules/` 下新建规则文件、在 `manifest.json` 的 `rule_resources` 里登记，并给条目加 `ruleset: "<规则集 id>"`。

## 已知限制

- 页面元素的选择器基于门户实际的 MUI / Emotion DOM（形如 `css-1nl44e3` 的哈希类名）。**门户前端一旦改版，这些规则会失效**，需要重新取选择器。
- 拦截规则只覆盖已确认的装饰素材，不拦截任何内容资源（公告配图、正文图片等）。
- 网络层拦截依赖 `declarativeNetRequest`，Chromium 内核支持最完整。

## 隐私

扩展不收集、不上传任何数据。所有操作都在本地完成：拦截请求、隐藏元素、记录勾选状态（`chrome.storage.local`）。唯一的外部请求是图标预热与域名预连接，指向 `my.ruc.edu.cn` 与 `cas.ruc.edu.cn`。
