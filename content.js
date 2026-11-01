(() => {
  const head = document.head || document.documentElement;
  if (!head) return;

  const hints = [
    ["preconnect", "https://my.ruc.edu.cn"],
    ["preconnect", "https://cas.ruc.edu.cn"],
    ["dns-prefetch", "https://my.ruc.edu.cn"],
    ["dns-prefetch", "https://cas.ruc.edu.cn"]
  ];

  for (const [rel, href] of hints) {
    const link = document.createElement("link");
    link.rel = rel;
    link.href = href;
    head.appendChild(link);
  }
})();
