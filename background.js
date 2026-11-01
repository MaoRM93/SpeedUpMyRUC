const WARM = [
  "https://my.ruc.edu.cn/favicon.ico",
  "https://cas.ruc.edu.cn/cas/favicon.ico"
];

chrome.runtime.onInstalled.addListener(warm);
chrome.runtime.onStartup.addListener(warm);

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
