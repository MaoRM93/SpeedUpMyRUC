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

Promise.all([
  chrome.declarativeNetRequest.getEnabledRulesets(),
  chrome.storage.local.get({ items: {} }),
]).then(([enabled, stored]) => {
  for (const item of ALL) {
    state[item.key] = item.ruleset
      ? enabled.includes(item.ruleset)
      : stored.items[item.key] !== false;
  }
  render();
});
