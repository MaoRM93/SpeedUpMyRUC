(() => {
  const GROUPS = globalThis.RUC_FAST_ITEMS || [];
  const ALL = GROUPS.flatMap((g) => g.items);
  const KEYS = ALL.map((i) => i.key);
  const HIDDEN = "rucFastHidden";
  const ITEM = "rucFastItem";
  const MAX_SCANS = 12;

  // 默认全开，storage 里显式为 false 才关闭
  const flags = Object.fromEntries(KEYS.map((k) => [k, true]));
  const on = (key) => flags[key] !== false;

  let scans = 0;
  let timer = 0;
  let style = null;
  let favEl = null;
  let targetEl = null;
  let favOrigin = null;

  function cssFor() {
    let out = "";
    for (const it of ALL) {
      if (!on(it.key)) continue;
      if (it.css) {
        out += it.css.join(",\n") + " {\n  display: none !important;\n}\n";
      }
      if (it.cssText) out += it.cssText + "\n";
    }
    return out;
  }

  function applyCSS() {
    if (!style) {
      style = document.createElement("style");
      style.id = "ruc-fast-clean";
      (document.head || document.documentElement).appendChild(style);
    }
    style.textContent = cssFor();
  }

  const hidden = (el) => el && el.dataset[HIDDEN] === "1";

  function hide(el, key) {
    if (!el || hidden(el) || el === document.body || el === document.documentElement) return;
    el.dataset[HIDDEN] = "1";
    el.dataset[ITEM] = key;
    el.style.setProperty("display", "none", "important");
    collapse(el, key);
  }

  // 回收因隐藏而空掉的包裹层，避免留下大块留白
  function collapse(el, key) {
    let parent = el.parentElement;
    for (let i = 0; i < 3 && parent && parent !== document.body; i++) {
      const hasVisibleChild = Array.from(parent.children).some(
        (child) =>
          !hidden(child) &&
          child.tagName !== "SCRIPT" &&
          child.tagName !== "STYLE" &&
          child.getBoundingClientRect().height > 1
      );
      const hasOwnText = Array.from(parent.childNodes).some(
        (node) => node.nodeType === 3 && node.nodeValue.trim()
      );
      if (hasVisibleChild || hasOwnText) break;
      parent.dataset[ITEM] = key;
      parent.style.setProperty("display", "none", "important");
      parent = parent.parentElement;
    }
  }

  // 关闭某项时把脚本隐藏过的元素还原
  function restore(key) {
    document.querySelectorAll(`[data-ruc-fast-item="${key}"]`).forEach((el) => {
      el.style.removeProperty("display");
      delete el.dataset[HIDDEN];
      delete el.dataset[ITEM];
    });
  }

  function leafByText(text) {
    let fallback = null;
    for (const el of document.querySelectorAll("body *")) {
      if (el.tagName === "SCRIPT" || el.tagName === "STYLE") continue;
      const own = el.textContent || "";
      if (!own.includes(text)) continue;
      if (el.children.length === 0) return el;
      if (!fallback && own.length < text.length + 40) fallback = el;
    }
    return fallback;
  }

  function hideEntry(el, key) {
    hide(el.closest("a,button,[role='button'],li") || el.parentElement || el, key);
  }

  function isGraySmall(el) {
    const cs = getComputedStyle(el);
    const rgb = (cs.color.match(/\d+/g) || []).map(Number);
    if (rgb.length < 3) return false;
    const [r, g, b] = rgb;
    const spread = Math.max(r, g, b) - Math.min(r, g, b);
    const luma = (r + g + b) / 3;
    return spread < 26 && luma > 110 && luma < 215 && parseFloat(cs.fontSize) <= 16;
  }

  function hideGraySubtitles() {
    const heads = Array.from(
      document.querySelectorAll("h1,h2,h3,[class*='title'],[class*='Title']")
    ).filter((h) => h.getBoundingClientRect().height > 0);

    for (const head of heads.slice(0, 8)) {
      const headBox = head.getBoundingClientRect();
      if (headBox.top > 380) continue;
      let sib = head.nextElementSibling;
      if (!sib && head.parentElement) sib = head.parentElement.nextElementSibling;
      if (!sib || hidden(sib)) continue;
      const text = (sib.textContent || "").trim();
      if (text.length < 6 || text.length > 120) continue;
      if (sib.querySelector("a,button,input")) continue;
      if (Math.abs(sib.getBoundingClientRect().top - headBox.bottom) > 80) continue;
      if (!isGraySmall(sib)) continue;
      hide(sib, "autoGray");
    }
  }

  function leafOf(text) {
    for (const el of document.querySelectorAll("#sui-app-page *")) {
      if (el.children.length) continue;
      if (!(el.textContent || "").includes(text)) continue;
      if (el.getBoundingClientRect().height < 1) continue;
      return el;
    }
    return null;
  }

  function lowestCommonAncestor(a, b) {
    const seen = new Set();
    for (let node = a; node; node = node.parentElement) seen.add(node);
    for (let node = b; node; node = node.parentElement) {
      if (seen.has(node)) return node;
    }
    return null;
  }

  // 取两者共同祖先下、仍不含对方文案的最大子块，避免只抓到一小段文字
  function childUnder(anc, node, otherText) {
    let current = node;
    let best = null;
    while (current && current.parentElement && current.parentElement !== anc) {
      current = current.parentElement;
      if (!(current.textContent || "").includes(otherText)) best = current;
    }
    return best || node;
  }

  // 把「我的收藏 / 为您推荐」整块提到「通知公告 + 日程中心」之上
  function reorderFavorites() {
    if (!on("reorder")) return;
    // 已经就位时只做两次属性读取，保证 MutationObserver 高频回调也不卡
    if (
      favEl &&
      targetEl &&
      favEl.isConnected &&
      targetEl.isConnected &&
      favEl.nextElementSibling === targetEl
    ) {
      return;
    }

    const favLeaf = leafOf("为您推荐");
    const noticeLeaf = leafOf("通知公告");
    if (!favLeaf || !noticeLeaf) return;
    const anc = lowestCommonAncestor(favLeaf, noticeLeaf);
    if (!anc || anc === favLeaf || anc === noticeLeaf) return;
    const fav = childUnder(anc, favLeaf, "通知公告");
    const target = childUnder(anc, noticeLeaf, "为您推荐");
    if (!fav || !target || fav === target) return;
    if (fav.parentElement !== target.parentElement) return;
    favEl = fav;
    targetEl = target;
    if (fav.nextElementSibling === target) return;
    if (!favOrigin) {
      favOrigin = { parent: fav.parentElement, next: fav.nextElementSibling };
    }
    fav.parentElement.insertBefore(fav, target);
    document.documentElement.dataset.rucFastMoved = "1";
  }

  function restoreFavorites() {
    if (!favOrigin || !favEl || !favEl.isConnected) return;
    const { parent, next } = favOrigin;
    if (next && next.isConnected && parent.isConnected) {
      parent.insertBefore(favEl, next);
    } else if (parent.isConnected) {
      parent.appendChild(favEl);
    }
    favOrigin = null;
    delete document.documentElement.dataset.rucFastMoved;
  }

  function scan() {
    if (++scans > MAX_SCANS) return;
    for (const it of ALL) {
      if (!on(it.key) || !it.texts) continue;
      for (const text of it.texts) {
        const el = leafByText(text);
        if (!el) continue;
        it.entry ? hideEntry(el, it.key) : hide(el, it.key);
      }
    }
    if (on("autoGray")) hideGraySubtitles();
    reorderFavorites();
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(scan, 600);
  }

  function start() {
    scan();
    setTimeout(scan, 1200);
    setTimeout(scan, 3000);
    if (!document.body) return;
    new MutationObserver(() => {
      reorderFavorites();
      schedule();
    }).observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  chrome.storage.local.get({ items: {} }).then(({ items }) => {
    for (const k of KEYS) if (items[k] === false) flags[k] = false;
    document.documentElement.dataset.rucFast = "101.0.0.100";
    applyCSS();
    if (document.body) {
      start();
    } else {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    }
  });

  // 菜单勾选后即时生效，无需刷新
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.items) return;
    const next = changes.items.newValue || {};
    let reenabled = false;
    for (const k of KEYS) {
      const was = flags[k];
      flags[k] = next[k] !== false;
      if (was && !flags[k]) {
        restore(k);
        if (k === "reorder") restoreFavorites();
      }
      if (!was && flags[k]) reenabled = true;
    }
    applyCSS();
    if (reenabled && document.body) {
      scans = 0;
      scan();
    }
  });
})();
