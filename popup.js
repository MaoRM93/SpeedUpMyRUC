const GROUPS = globalThis.RUC_FAST_ITEMS;
const ALL = GROUPS.flatMap((g) => g.items);
const state = {};
const groupBoxes = [];
const boxes = {};

const list = document.getElementById("list");

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text) node.textContent = text;
  return node;
}

function render() {
  const frag = document.createDocumentFragment();
  GROUPS.forEach((group, gi) => {
    const section = el("section");

    const head = el("label", "g");
    const groupBox = document.createElement("input");
    groupBox.type = "checkbox";
    groupBox.dataset.group = String(gi);
    head.append(groupBox, el("span", "gn", group.group));
    groupBoxes[gi] = groupBox;
    section.append(head);

    for (const item of group.items) {
      const row = el("label", "i");
      const box = document.createElement("input");
      box.type = "checkbox";
      box.dataset.key = item.key;
      boxes[item.key] = box;
      row.append(box, el("span", "l", item.label));
      if (item.note) row.append(el("span", "n", item.note));
      section.append(row);
    }

    frag.append(section);
  });
  list.append(frag);
  sync();
}

function sync() {
  for (const item of ALL) boxes[item.key].checked = !!state[item.key];
  GROUPS.forEach((group, gi) => {
    const checked = group.items.filter((it) => state[it.key]).length;
    const box = groupBoxes[gi];
    box.checked = checked === group.items.length;
    box.indeterminate = checked > 0 && checked < group.items.length;
  });
}

async function persist() {
  const enable = [];
  const disable = [];
  const ui = {};
  for (const item of ALL) {
    if (item.ruleset) {
      const want = !!state[item.key];
      if (want) enable.push(item.ruleset);
      else disable.push(item.ruleset);
    } else {
      ui[item.key] = !!state[item.key];
    }
  }

  const enabled = await chrome.declarativeNetRequest.getEnabledRulesets();
  const opts = {};
  const toEnable = enable.filter((id) => !enabled.includes(id));
  const toDisable = disable.filter((id) => enabled.includes(id));
  if (toEnable.length) opts.enableRulesetIds = toEnable;
  if (toDisable.length) opts.disableRulesetIds = toDisable;
  if (opts.enableRulesetIds || opts.disableRulesetIds) {
    await chrome.declarativeNetRequest.updateEnabledRulesets(opts);
  }
  await chrome.storage.local.set({ items: ui });
}

list.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;

  if (target.dataset.group !== undefined) {
    const group = GROUPS[Number(target.dataset.group)];
    for (const item of group.items) state[item.key] = target.checked;
  } else if (target.dataset.key) {
    state[target.dataset.key] = target.checked;
  } else {
    return;
  }

  sync();
  persist();
});

// 配色：简洁 / 色调 / 原始，写入 storage.local.palette（默认 clean）
// 「原始」只有浅色版，选中时禁用主题的「跟随系统 / 深色」
const paletteSeg = document.getElementById("paletteSeg");
let palette = "clean";

function paintPalette() {
  for (const btn of paletteSeg.querySelectorAll("button")) {
    btn.classList.toggle("on", btn.dataset.palette === palette);
  }
  paintTheme();
}

paletteSeg.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-palette]");
  if (!btn) return;
  palette = btn.dataset.palette;
  paintPalette();
  chrome.storage.local.set({ palette });
});

// 主题：跟随系统 / 浅色 / 深色，写入 storage.local.theme（默认 auto）
const themeSeg = document.getElementById("themeSeg");
let theme = "auto";

function paintTheme() {
  const locked = palette === "original";
  for (const btn of themeSeg.querySelectorAll("button")) {
    const mode = btn.dataset.theme;
    btn.disabled = locked && mode !== "light";
    btn.classList.toggle("on", mode === (locked ? "light" : theme));
  }
}

themeSeg.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-theme]");
  if (!btn || btn.disabled) return;
  theme = btn.dataset.theme;
  paintTheme();
  chrome.storage.local.set({ theme });
});

// 设置版本号：旧版本数据没有 schema 字段，按 0 处理；升级时在这里逐级迁移
const SCHEMA = 1;

async function loadSettings() {
  const stored = await chrome.storage.local.get({
    schema: 0,
    theme: "auto",
    palette: "clean",
    items: {},
    rucDisabled: null,
    rucUpdate: null,
    skipVersion: "",
  });
  if (stored.schema < SCHEMA) {
    // v0 → v1：键名未变（items / theme），只需补写版本号；palette 为新增键，缺失按默认
    await chrome.storage.local.set({ schema: SCHEMA });
    stored.schema = SCHEMA;
  }
  return stored;
}

// 检查更新（GitHub Release）与远程禁用提示
const checkBtn = document.getElementById("checkBtn");
const updMsg = document.getElementById("updMsg");
const killBox = document.getElementById("killBox");
// 与后台 alarm 同步：15 分钟一次，打开设置菜单时若缓存过期也立即补查
const CHECK_INTERVAL = 15 * 60 * 1000;

function showKilled(record) {
  document.body.classList.add("killed");
  killBox.hidden = false;
  const reason = String((record && record.reason) || "").trim();
  killBox.textContent =
    "插件已被开发者禁用，原因是" + (reason || "（开发者未提供说明）");
}

function paintUpdate(info) {
  if (!info) {
    updMsg.textContent = "未检查";
    return;
  }
  if (!info.ok) {
    updMsg.textContent = "检查失败：" + (info.error || "网络异常");
    return;
  }
  if (info.hasUpdate && info.latest) {
    updMsg.textContent = "";
    const link = document.createElement("a");
    link.href = info.url || "https://github.com/MaoRM93/SpeedUpMyRUC/releases";
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "发现新版本 " + info.latest + " →";
    updMsg.append(link);

    const skip = document.createElement("button");
    skip.type = "button";
    skip.className = "skipv";
    skip.textContent = "跳过此版本";
    skip.title = "不再提示该版本，但仍会继续检查更新";
    skip.addEventListener("click", () => skipLatest(info.latest));
    updMsg.append(skip);
    return;
  }
  if (info.skipped && info.latest) {
    updMsg.textContent = "已跳过 " + info.latest + "，仍会继续检查更新";
    return;
  }
  updMsg.textContent = "已是最新版本 " + info.current;
}

async function skipLatest(version) {
  try {
    const next = await chrome.runtime.sendMessage({ type: "ruc-skip", version });
    paintUpdate(next || { ok: true, skipped: true, latest: version, current: "" });
  } catch (e) {
    /* 后台不可用时忽略 */
  }
}

async function runCheck(manual) {
  if (document.body.classList.contains("killed")) return;
  checkBtn.disabled = true;
  if (manual) updMsg.textContent = "正在检查…";
  try {
    const info = await chrome.runtime.sendMessage({ type: "ruc-check" });
    if (info) paintUpdate(info);
  } catch (e) {
    paintUpdate({ ok: false, error: "无法连接后台" });
  } finally {
    checkBtn.disabled = false;
  }
}

checkBtn.addEventListener("click", () => runCheck(true));

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.rucDisabled) {
    if (changes.rucDisabled.newValue) showKilled(changes.rucDisabled.newValue);
    else location.reload();
  }
  if (changes.rucUpdate && changes.rucUpdate.newValue) {
    paintUpdate(changes.rucUpdate.newValue);
  }
});

Promise.all([
  chrome.declarativeNetRequest.getEnabledRulesets(),
  loadSettings(),
]).then(([enabled, stored]) => {
  if (stored.rucDisabled) {
    showKilled(stored.rucDisabled);
    return;
  }
  for (const item of ALL) {
    state[item.key] = item.ruleset
      ? enabled.includes(item.ruleset)
      : stored.items[item.key] !== false;
  }
  palette = stored.palette === "tone" || stored.palette === "original" ? stored.palette : "clean";
  theme = stored.theme === "light" || stored.theme === "dark" ? stored.theme : "auto";
  paintPalette();
  render();
  paintUpdate(stored.rucUpdate);
  const age = stored.rucUpdate && stored.rucUpdate.checkedAt
    ? Date.now() - stored.rucUpdate.checkedAt
    : Infinity;
  if (age > CHECK_INTERVAL) runCheck(false);
});
