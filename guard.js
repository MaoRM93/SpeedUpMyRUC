// 远程禁用守卫：在 document_start 最先执行，读取 storage 中的 rucDisabled。
// 命中时给其余脚本一个「开关 Promise」(__rucGate)，并撤销扩展已注入的样式钩子，
// 在页面顶部显示开发者公告。正常状态下不做任何额外操作。
(() => {
  if (globalThis.__rucGuard) return;
  globalThis.__rucGuard = true;

  const root = document.documentElement;
  const NOTE_ID = "ruc-disabled-note";
  let reason = "";
  let active = false;

  const loaded = new Promise((resolve) => {
    try {
      chrome.storage.local.get({ rucDisabled: null }, (r) => {
        resolve(r.rucDisabled || null);
      });
    } catch (e) {
      resolve(null);
    }
  });

  // 其余脚本 await 这个 Promise：false 表示插件已被远程禁用，不得再改动页面
  globalThis.__rucGate = loaded.then((v) => !v);

  // 去掉扩展的样式作用域。站点仅在 .css-1i2dhkn / .css-1jugjb3 两个内嵌容器里
  // 引用 .sui-app-page 控制 overflow，这两处保留类名，避免破坏站点布局。
  function strip(el) {
    if (!el || !el.classList || !el.classList.contains("sui-app-page")) return;
    if (el.closest && el.closest(".css-1i2dhkn, .css-1jugjb3")) return;
    el.classList.remove("sui-app-page");
  }

  function sweep() {
    root.removeAttribute("data-ruc-theme");
    root.removeAttribute("data-ruc-palette");
    document.querySelectorAll(".sui-app-page").forEach(strip);
    const style = document.getElementById("ruc-fast-clean");
    if (style) style.remove();
  }

  function banner() {
    if (!document.body || document.getElementById(NOTE_ID)) return;
    const box = document.createElement("div");
    box.id = NOTE_ID;
    box.setAttribute("role", "alert");
    box.style.cssText = [
      "position:fixed",
      "top:0",
      "left:0",
      "right:0",
      "z-index:2147483647",
      "padding:10px 16px",
      "box-sizing:border-box",
      "background:#861a12",
      "color:#ffffff",
      "font:14px/22px -apple-system,'PingFang SC','Microsoft YaHei',sans-serif",
      "text-align:center",
      "box-shadow:0 2px 8px rgba(0,0,0,.24)",
    ].join(";");
    box.textContent =
      "插件已被开发者禁用，原因是" + (reason || "（开发者未提供说明）");
    document.body.appendChild(box);
  }

  function activate() {
    if (active) return;
    active = true;
    sweep();
    // 站点后续挂载的节点可能重新带上类名，短暂观察一段时间
    const mo = new MutationObserver(sweep);
    mo.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => mo.disconnect(), 8000);
    banner();
    if (!document.body) {
      document.addEventListener("DOMContentLoaded", banner, { once: true });
    }
  }

  loaded.then((v) => {
    if (!v) return;
    reason = String(v.reason || "").trim();
    activate();
  });

  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local" || !changes.rucDisabled) return;
      const v = changes.rucDisabled.newValue;
      if (!v) return;
      reason = String(v.reason || "").trim();
      activate();
    });
  } catch (e) {
    /* storage 不可用时静默 */
  }
})();
