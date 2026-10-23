// 拦截清单：popup 与页面脚本共用，改这里即可同时更新菜单与生效逻辑
// ruleset 项走 declarativeNetRequest 独立规则集，其余项由 ui-cleanup.js 执行
globalThis.RUC_FAST_ITEMS = [
  {
    group: "装饰资源",
    items: [
      {
        key: "banner",
        label: "顶栏横幅动画",
        note: "15.9 MB",
        ruleset: "banner",
      },
      {
        key: "bg",
        label: "页面背景装饰图",
        note: "3.3 MB",
        ruleset: "background",
      },
      {
        key: "footer",
        label: "页脚背景图",
        note: "约 0.3 MB",
        ruleset: "footer",
      },
      {
        key: "captcha",
        label: "登录页失效验证码",
        ruleset: "captcha",
      },
    ],
  },
  {
    group: "页面元素",
    items: [
      {
        key: "topDeco",
        label: "顶部装饰区",
        css: [
          "#sui-app-page > div.css-10y7bwx > div.MuiBox-root.css-1nl44e3:first-child",
        ],
      },
      {
        key: "sideBar",
        label: "右侧悬浮栏及 AI 入口",
        css: [
          "#sui-app-page > div.css-10y7bwx > div.right.fadeInRight.animated.MuiBox-root.css-1qq4t0r:nth-child(9)",
        ],
        texts: ["AI融合门户"],
        entry: true,
      },
      {
        key: "robot",
        label: "机器人图标残留入口",
        css: ["#sui-app-page div.click.MuiBox-root.css-fz47q4"],
      },
      {
        key: "extraBlock",
        label: "右侧第 10 块推荐",
        css: [
          "#sui-app-page > div.css-10y7bwx > div.MuiBox-root.css-9bac1i:nth-child(10) > div.MuiBox-root.css-7ek1nq",
        ],
      },
    ],
  },
  {
    group: "文案精简",
    items: [
      {
        key: "homeSub",
        label: "首页标语灰字",
        css: [
          "#sui-app-page > div.css-10y7bwx > div.active.MuiBox-root.css-15621uj:nth-child(5) > div.mainPage.MuiBox-root.css-79elbk:last-child > div.NoHeaderBg2.header.MuiBox-root.css-1p35844:first-child > div.portal-content.MuiBox-root.css-8zluob > div.MuiBox-root.css-jzyh2j > div.inner.MuiBox-root.css-7oemyj > div.mtitle.MuiBox-root.css-51btz5:first-child > span.MuiBox-root.css-1dunxuf:last-child",
        ],
        texts: ["点燃数智火花"],
      },
      {
        key: "listSub",
        label: "子页面标题灰字",
        css: [
          "#sui-app-page > div.css-10y7bwx > div.active.listss.MuiBox-root.css-15621uj:nth-child(5) > div.listPage.MuiBox-root.css-79elbk:last-child > div.header.MuiBox-root.css-1p35844:first-child > div.portal-content.MuiBox-root.css-8zluob > div.MuiBox-root.css-jzyh2j > div.inner.MuiBox-root.css-7oemyj > div.css-1x17p5w:last-child > div.ant-row.ant-row-top.css-10wz6x1.css-var- > div.ant-col.ant-col-xs-24.ant-col-md-12.ant-col-lg-12.css-10wz6x1.css-var-:first-child > div.css-v2kfba > div.MuiBox-root.css-duxe6d",
        ],
      },
      {
        key: "trial",
        label: "「试运行」标签",
        texts: ["试运行"],
      },
      {
        key: "autoGray",
        label: "首屏灰色副标题（自动识别）",
      },
    ],
  },
  {
    group: "布局整理",
    items: [
      {
        key: "tighten",
        label: "标题下留白压缩",
        cssText:
          "#sui-app-page div.mtitle.MuiBox-root.css-51btz5 {\n  margin-bottom: 24px !important;\n}",
      },
      {
        key: "reorder",
        label: "「我的收藏」上移",
      },
    ],
  },
];
