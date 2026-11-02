const WARM = [
  "https://my.ruc.edu.cn/favicon.ico",
  "https://cas.ruc.edu.cn/cas/favicon.ico"
];

const REPO = "MaoRM93/SpeedUpMyRUC";
const RELEASES_API = "https://api.github.com/repos/" + REPO + "/releases?per_page=50";
const RELEASE_PREFIX = "https://github.com/" + REPO + "/";
const KILL_TAG = "114.514";
const RULESETS = ["banner", "background", "footer", "captcha"];
const CHECK_ALARM = "ruc-update-check";
const CHECK_MINUTES = 15;

chrome.runtime.onInstalled.addListener(() => {
  warm();
  ensureAlarm();
  checkReleases();
});
chrome.runtime.onStartup.addListener(() => {
  warm();
  ensureAlarm();
  checkReleases();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === CHECK_ALARM) checkReleases();
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg) return;
  if (msg.type === "ruc-check") {
    checkReleases().then(sendResponse);
    return true;
  }
  if (msg.type === "ruc-open") {
    openRelease(msg.url);
    return;
  }
  if (msg.type === "ruc-skip") {
    skipVersion(msg.version).then(sendResponse);
    return true;
  }
});

function ensureAlarm() {
  try {
    // 同名 alarm 会被覆盖，安装 / 启动时都会校正为 15 分钟
    chrome.alarms.create(CHECK_ALARM, { periodInMinutes: CHECK_MINUTES });
  } catch (e) {
    /* alarms 不可用时忽略 */
  }
}

// 只建立 DNS/TLS 与 WAF 会话，不跟随跳转，避免顺带拉取登录页
async function warm() {
  await Promise.allSettled(
    WARM.map((url) =>
      fetch(url, {
        mode: "no-cors",
        credentials: "omit",
        cache: "no-store",
        redirect: "manual"
      })
    )
  );
}

function parseVersion(v) {
  const nums = String(v || "")
    .replace(/^v/i, "")
    .split(/[^0-9]+/)
    .filter(Boolean)
    .map(Number);
  return nums.length ? nums : [0];
}

function cmpVersion(a, b) {
  const A = parseVersion(a);
  const B = parseVersion(b);
  for (let i = 0; i < Math.max(A.length, B.length); i++) {
    const x = A[i] || 0;
    const y = B[i] || 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}

function bare(v) {
  return String(v || "").trim().replace(/^v/i, "");
}

let running = null;

// 强制检查：没有「关闭检查」的开关。用户可以跳过某个版本，但后台仍会按
// 15 分钟周期继续查询，直到新版本出现。
async function checkReleases() {
  if (running) return running;
  running = (async () => {
    const current = chrome.runtime.getManifest().version;
    try {
      const res = await fetch(RELEASES_API, {
        headers: { Accept: "application/vnd.github+json" },
        cache: "no-store"
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const list = await res.json();
      if (!Array.isArray(list)) throw new Error("返回数据异常");

      const stored = await chrome.storage.local.get({
        rucDisabled: null,
        skipVersion: ""
      });

      // tag / 标题允许带前导 v（v114.514 与 114.514 等价）
      const kill = list.find(
        (r) => !r.draft && (bare(r.tag_name) === KILL_TAG || bare(r.name) === KILL_TAG)
      );

      if (kill) {
        await killExtension(kill);
      } else if (stored.rucDisabled) {
        // 114.514 已被删除 → 自动解除禁用
        await restoreExtension(stored.rucDisabled);
      }

      let latest = null;
      for (const r of list) {
        if (r.draft || r.prerelease) continue;
        if (!latest || cmpVersion(r.tag_name, latest.tag_name) > 0) latest = r;
      }

      const skip = String(stored.skipVersion || "");
      const skipped = !!(latest && skip && bare(latest.tag_name) === bare(skip));
      const hasUpdate = !!(
        latest &&
        cmpVersion(latest.tag_name, current) > 0 &&
        !skipped
      );

      const result = {
        ok: true,
        current,
        latest: latest ? String(latest.tag_name) : null,
        name: latest ? String(latest.name || latest.tag_name) : null,
        notes: latest ? String(latest.body || "").trim() : "",
        url: latest ? latest.html_url : null,
        hasUpdate,
        skipped,
        skipVersion: skip || null,
        killed: !!kill,
        checkedAt: Date.now()
      };
      if (!kill) await chrome.storage.local.set({ rucUpdate: result });
      return result;
    } catch (e) {
      return {
        ok: false,
        current,
        error: String((e && e.message) || e),
        checkedAt: Date.now()
      };
    } finally {
      running = null;
    }
  })();
  return running;
}

// 命中 114.514 后：记录禁用原因与当时开启的规则集、关闭网络拦截、
// 移除已注入样式并刷新门户页。页面内的 guard.js 会显示开发者公告。
async function killExtension(release) {
  const existing = await chrome.storage.local.get({ rucDisabled: null });
  if (existing.rucDisabled && existing.rucDisabled.tag === KILL_TAG) return;

  let enabledRules = RULESETS;
  try {
    const enabled = await chrome.declarativeNetRequest.getEnabledRulesets();
    if (Array.isArray(enabled) && enabled.length) enabledRules = enabled;
  } catch (e) {
    /* 读取不到时按全量还原 */
  }

  const reason = String(release.body || "").trim() || "（开发者未提供说明）";
  await chrome.storage.local.set({
    rucDisabled: {
      tag: KILL_TAG,
      reason,
      url: release.html_url || "",
      at: Date.now(),
      rulesets: enabledRules
    }
  });

  try {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      disableRulesetIds: RULESETS
    });
  } catch (e) {
    /* 规则集不可用时忽略 */
  }

  try {
    await chrome.action.setBadgeBackgroundColor({ color: "#861a12" });
    await chrome.action.setBadgeText({ text: "禁" });
  } catch (e) {
    /* 忽略 */
  }

  await reloadPortalTabs();
}

// 114.514 被删除后恢复：清除禁用记录、恢复原有规则集、去掉徽标并刷新门户页。
async function restoreExtension(record) {
  await chrome.storage.local.remove("rucDisabled");
  const ids =
    record && Array.isArray(record.rulesets) && record.rulesets.length
      ? record.rulesets
      : RULESETS;
  try {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: ids
    });
  } catch (e) {
    /* 忽略 */
  }
  try {
    await chrome.action.setBadgeText({ text: "" });
  } catch (e) {
    /* 忽略 */
  }
  await reloadPortalTabs();
}

async function reloadPortalTabs() {
  let tabs = [];
  try {
    tabs = await chrome.tabs.query({ url: ["*://my.ruc.edu.cn/*"] });
  } catch (e) {
    tabs = [];
  }
  for (const tab of tabs) {
    if (!tab.id) continue;
    try {
      await chrome.scripting.removeCSS({
        target: { tabId: tab.id },
        files: ["css/tokens.css", "css/home.css"]
      });
    } catch (e) {
      /* 已卸载或未注入时忽略 */
    }
  }
  for (const tab of tabs) {
    if (!tab.id) continue;
    try {
      await chrome.tabs.reload(tab.id);
    } catch (e) {
      /* 忽略 */
    }
  }
}

function openRelease(url) {
  const target = String(url || "");
  if (!target.startsWith(RELEASE_PREFIX)) return;
  try {
    chrome.tabs.create({ url: target });
  } catch (e) {
    /* 忽略 */
  }
}

// 跳过指定版本：只影响提示，不停止检查；更高版本出现后会重新提示
async function skipVersion(version) {
  const v = String(version || "").trim();
  if (!v) return { ok: false };
  await chrome.storage.local.set({ skipVersion: v });
  const stored = await chrome.storage.local.get({ rucUpdate: null });
  let next = stored.rucUpdate;
  if (next && next.latest && bare(next.latest) === bare(v)) {
    next = { ...next, hasUpdate: false, skipped: true, skipVersion: v };
    await chrome.storage.local.set({ rucUpdate: next });
  }
  return next || { ok: true, skipped: true, skipVersion: v };
}
