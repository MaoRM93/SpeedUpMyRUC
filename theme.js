// 首页配色 / 深色模式：结果写入 html[data-ruc-palette] 与 html[data-ruc-theme]
// 先按默认值给出同步初值，避免首屏白闪；storage 读取完成后按用户选择覆盖
(() => {
  if (globalThis.__rucTheme) return;
  globalThis.__rucTheme = true;

  const root = document.documentElement;
  const mq = matchMedia("(prefers-color-scheme: dark)");
  let mode = "auto";
  let palette = "clean";

  const apply = () => {
    // 已被远程禁用（guard.js 写入 data-ruc-disabled）时不再改动页面配色
    if (root.dataset.rucDisabled === "1") return;
    root.dataset.rucPalette = palette;
    // 「原始」配色只有浅色版：忽略系统深色与手动深色，强制 light
    const dark =
      palette !== "original" && (mode === "dark" || (mode === "auto" && mq.matches));
    root.dataset.rucTheme = dark ? "dark" : "light";
  };

  const setMode = (v) => {
    mode = v === "light" || v === "dark" ? v : "auto";
    apply();
  };

  const setPalette = (v) => {
    palette = v === "tone" || v === "original" ? v : "clean";
    apply();
  };

  apply();

  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.local.get({ theme: "auto", palette: "clean" }, (r) => {
      setPalette(r.palette);
      setMode(r.theme);
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes.palette) setPalette(changes.palette.newValue);
      if (changes.theme) setMode(changes.theme.newValue);
    });
  }

  if (mq.addEventListener) mq.addEventListener("change", apply);
  else mq.addListener(apply);
})();
