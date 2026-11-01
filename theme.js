// 首页深色模式：跟随系统 / 手动指定，结果写入 html[data-ruc-theme]
// 先按系统给出同步初值，避免首屏白闪；storage 读取完成后按用户选择覆盖
(() => {
  if (globalThis.__rucTheme) return;
  globalThis.__rucTheme = true;

  const root = document.documentElement;
  const mq = matchMedia("(prefers-color-scheme: dark)");
  let mode = "auto";

  const apply = () => {
    const dark = mode === "dark" || (mode === "auto" && mq.matches);
    root.dataset.rucTheme = dark ? "dark" : "light";
  };

  const setMode = (v) => {
    mode = v === "light" || v === "dark" ? v : "auto";
    apply();
  };

  apply();

  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.local.get({ theme: "auto" }, (r) => setMode(r.theme));
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes.theme) setMode(changes.theme.newValue);
    });
  }

  if (mq.addEventListener) mq.addEventListener("change", apply);
  else mq.addListener(apply);
})();
