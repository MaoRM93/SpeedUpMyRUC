// 右上角更新提示：读取 background.js 写入的 rucUpdate，展示 Release 更新日志，
// 提供「下载」与「跳过此版本」。跳过只影响提示，后台仍会每 15 分钟检查。
// 远程禁用时 guard.js 的门闩为 false，本脚本不会运行。
(() => {
  const gate = globalThis.__rucGate;
  if (gate) gate.then((ok) => { if (ok) boot(); });
  else boot();

  function boot() {
    if (globalThis.__rucUpdateNote) return;
    globalThis.__rucUpdateNote = true;

    const ID = "ruc-upd-card";
    const STYLE_ID = "ruc-upd-style";
    const DISMISS_KEY = "ruc-upd-dismissed";

    function ensureStyle() {
      if (document.getElementById(STYLE_ID)) return;
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `
#${ID} {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 2147483000;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 340px;
  max-height: 65vh;
  padding: 14px 16px;
  border: 1px solid var(--ruc-divider, #e5e5e5);
  border-radius: 12px;
  background: var(--ruc-surface, #ffffff);
  color: var(--ruc-text, #242424);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22);
  font: 13px/20px var(--ruc-font, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif);
  text-align: left;
}
#${ID} .u-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 2px;
}
#${ID} .u-title {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: var(--ruc-brand, #861a12);
}
#${ID} .u-x {
  flex: none;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--ruc-text-2, #616161);
  font: 16px/1 var(--ruc-font, sans-serif);
  cursor: pointer;
}
#${ID} .u-x:hover { background: var(--ruc-surface-hover, #f7f8fa); }
#${ID} .u-sub {
  margin-bottom: 10px;
  color: var(--ruc-text-3, #8a8a8a);
  font-size: 11px;
}
#${ID} .u-notes {
  flex: 1;
  min-height: 0;
  overflow: auto;
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--ruc-surface-muted, #eceef1);
  color: var(--ruc-text-2, #616161);
  font-size: 12px;
  line-height: 20px;
  white-space: pre-wrap;
  word-break: break-word;
}
#${ID} .u-foot {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
#${ID} .u-btn {
  padding: 6px 14px;
  border: 1px solid var(--ruc-divider, #e5e5e5);
  border-radius: 8px;
  background: var(--ruc-surface, #ffffff);
  color: var(--ruc-text, #242424);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
#${ID} .u-btn:hover { background: var(--ruc-surface-hover, #f7f8fa); }
#${ID} .u-tip {
  margin-top: 8px;
  color: var(--ruc-text-3, #8a8a8a);
  font-size: 10px;
  line-height: 15px;
}
#${ID} .u-go {
  border-color: var(--ruc-brand, #861a12);
  background: var(--ruc-brand, #861a12);
  color: #ffffff;
}
#${ID} .u-go:hover { background: var(--ruc-brand-strong, #6d140e); }
:root[data-ruc-theme="dark"] #${ID} .u-go { color: #17181a; }
`;
      (document.head || document.documentElement).appendChild(style);
    }

    function remove() {
      const el = document.getElementById(ID);
      if (el) el.remove();
    }

    function dismissed(tag) {
      try {
        return sessionStorage.getItem(DISMISS_KEY) === tag;
      } catch (e) {
        return false;
      }
    }

    function dismiss(tag) {
      try {
        sessionStorage.setItem(DISMISS_KEY, tag);
      } catch (e) {
        /* 忽略 */
      }
      remove();
    }

    function send(type, payload) {
      try {
        chrome.runtime.sendMessage({ type, ...payload });
      } catch (e) {
        /* 扩展上下文失效时忽略 */
      }
    }

    function render(info) {
      if (!info || !info.ok || !info.hasUpdate || !info.latest) {
        remove();
        return;
      }
      const tag = String(info.latest);
      if (dismissed(tag)) {
        remove();
        return;
      }

      ensureStyle();
      remove();

      const card = document.createElement("section");
      card.id = ID;
      card.setAttribute("role", "dialog");
      card.setAttribute("aria-label", "发现新版本 " + tag);

      const head = document.createElement("div");
      head.className = "u-head";
      const title = document.createElement("span");
      title.className = "u-title";
      title.textContent = "发现新版本 " + tag;
      const close = document.createElement("button");
      close.type = "button";
      close.className = "u-x";
      close.setAttribute("aria-label", "关闭");
      close.textContent = "×";
      close.addEventListener("click", () => dismiss(tag));
      head.append(title, close);

      const sub = document.createElement("div");
      sub.className = "u-sub";
      sub.textContent = info.name && info.name !== tag ? info.name : "更新日志";

      const notes = document.createElement("div");
      notes.className = "u-notes";
      notes.textContent = (info.notes || "").trim() || "该版本未提供更新说明，请前往 Release 页面查看。";

      const foot = document.createElement("div");
      foot.className = "u-foot";

      const skip = document.createElement("button");
      skip.type = "button";
      skip.className = "u-btn";
      skip.textContent = "跳过此版本";
      skip.addEventListener("click", () => {
        send("ruc-skip", { version: tag });
        remove();
      });

      const go = document.createElement("button");
      go.type = "button";
      go.className = "u-btn u-go";
      go.textContent = "前往下载";
      go.addEventListener("click", () => {
        send("ruc-open", { url: info.url });
        remove();
      });

      foot.append(skip, go);

      const tip = document.createElement("div");
      tip.className = "u-tip";
      tip.textContent = "下载解压后覆盖原文件夹，再到 chrome://extensions 点击「重新加载」";

      card.append(head, sub, notes, foot, tip);
      if (document.body) {
        document.body.appendChild(card);
      } else {
        document.addEventListener(
          "DOMContentLoaded",
          () => {
            if (document.getElementById(ID) === card || !document.body) return;
            document.body.appendChild(card);
          },
          { once: true }
        );
      }
    }

    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get({ rucUpdate: null }, (r) => render(r.rucUpdate));
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== "local") return;
        if (changes.rucUpdate) render(changes.rucUpdate.newValue);
        if (changes.rucDisabled && changes.rucDisabled.newValue) remove();
      });
    }
  }
})();
