// 模块标题图标重绘（透明底实心，颜色跟随 --ruc-brand）；应用磁贴沿用站点原图标库
// 纯数据 URI，不依赖 chrome.* API，可在扩展与实验页面直接注入验证
(() => {
  if (globalThis.__rucAppIcons) return;
  globalThis.__rucAppIcons = true;

  // 远程禁用守卫（guard.js）先行；被禁用时不再改写任何图标与校徽
  function boot() {

  // 分类线条色：浅色为深色线，深色改用亮色线；磁贴图标统一为透明底
  const CATS = {
    acad: { fg: "#9A2B20", dfg: "#EAA79E" }, // 教务
    stu: { fg: "#2F6B5C", dfg: "#8FC7B4" }, // 学务
    serv: { fg: "#2C5B86", dfg: "#8FB6DC" }, // 服务
    fin: { fg: "#8A6231", dfg: "#D9B482" }, // 财务
    admin: { fg: "#5B4A87", dfg: "#B9A7E8" }, // 校务
    college: { fg: "#4A5570", dfg: "#A4B0C7" }, // 院务
    misc: { fg: "#565B61", dfg: "#B5B8BD" } // 其他
  };

  // 24x24 坐标系的线性符号
  const G = {
    cal: '<rect x="2.5" y="4.5" width="19" height="17" rx="2.5"/><path d="M2.5 9.5h19M8 2.5v4M16 2.5v4"/>',
    calgrid: '<rect x="2.5" y="4.5" width="19" height="17" rx="2.5"/><path d="M2.5 9.5h19M8 2.5v4M16 2.5v4M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"/>',
    callist: '<rect x="2.5" y="4.5" width="19" height="17" rx="2.5"/><path d="M2.5 9.5h19M8 2.5v4M16 2.5v4M7 13.5h10M7 17h7"/>',
    calperson: '<rect x="2.5" y="4.5" width="19" height="17" rx="2.5"/><path d="M2.5 9.5h19M8 2.5v4M16 2.5v4"/><circle cx="16" cy="14" r="1.7"/><path d="M13.2 18.4c0-1.5 1.2-2.4 2.8-2.4s2.8.9 2.8 2.4"/>',
    calcheck: '<rect x="2.5" y="4.5" width="19" height="17" rx="2.5"/><path d="M2.5 9.5h19M8 2.5v4M16 2.5v4M7.5 14.5l2 2 4-4.5"/>',
    cap: '<path d="M12 3.5 2 8.5l10 5 10-5-10-5z"/><path d="M6 11v4.5c0 1.7 2.7 3 6 3s6-1.3 6-3V11"/>',
    book: '<path d="M3.5 4.5H9a3 3 0 0 1 3 3v12a2.5 2.5 0 0 0-2.5-2.5h-6z"/><path d="M20.5 4.5H15a3 3 0 0 0-3 3v12a2.5 2.5 0 0 1 2.5-2.5h6z"/>',
    bookstar: '<path d="M3.5 4.5H9a3 3 0 0 1 3 3v12a2.5 2.5 0 0 0-2.5-2.5h-6z"/><path d="M18.6 3.5l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z"/>',
    bookcloud: '<path d="M3.5 5H8a3 3 0 0 1 3 3v11.5a2.4 2.4 0 0 0-2.4-2.4H3.5z"/><path d="M17 14.5h4.2a2.4 2.4 0 0 0 .3-4.8 3.8 3.8 0 0 0-7.3.8 2.2 2.2 0 0 0 2.8 4z"/>',
    doc: '<path d="M6 3.5h8l4 4v13H6z"/><path d="M14 3.5v4h4"/><path d="M9 12h6M9 15.5h6"/>',
    doccheck: '<path d="M6 3.5h8l4 4v13H6z"/><path d="M14 3.5v4h4"/><path d="M9 14.5l2 2 4-4.5"/>',
    clipboard: '<rect x="5" y="4.5" width="14" height="16.5" rx="2"/><path d="M9 4.5V3h6v1.5"/><path d="M8.5 10h7M8.5 13.5h7M8.5 17h4"/>',
    checklist: '<path d="M4 6.5l2 2 3-3M4 13.5l2 2 3-3"/><path d="M12 7.5h8M12 14.5h8"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.2 15.2 20.5 20.5"/>',
    door: '<path d="M6 21V4h11v17"/><path d="M14 13h.01"/>',
    key: '<circle cx="8" cy="8" r="4.5"/><path d="M11.2 11.2 20 20M15.8 15.8l2.4-2.4M18.2 18.2l2.3-2.3"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c3.2 3 3.2 15 0 18M12 3c-3.2 3-3.2 15 0 18"/>',
    plane: '<path d="M21 4 3 11.5l7 2 2 7 3.2-5.2 5.8-3.8z"/><path d="M21 4 10 13.5"/>',
    people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-5.5 6.5-5.5s6.5 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.6c2.6.4 6 2.2 6 5.4"/>',
    person: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c0-4.1 3.4-6.2 7.5-6.2s7.5 2.1 7.5 6.2"/>',
    idcard: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><circle cx="8.5" cy="11" r="2"/><path d="M5.5 16.2c.5-1.7 1.6-2.5 3-2.5s2.5.8 3 2.5M14 10.5h4.5M14 14h4.5"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4.5h6V7M3 11.5h18"/>',
    growth: '<path d="M4 20V4M4 20h16"/><path d="M7 16l4-4.5 3 2.5 5.5-6.5"/><path d="M16 7.5h3.5V11"/>',
    chart: '<path d="M4 20V4M4 20h16"/><rect x="7.5" y="12" width="3" height="5" rx=".5"/><rect x="12.5" y="8.5" width="3" height="8.5" rx=".5"/><rect x="17.5" y="10.5" width="3" height="6.5" rx=".5"/>',
    database: '<ellipse cx="12" cy="6.5" rx="7.5" ry="3"/><path d="M4.5 6.5v11c0 1.7 3.3 3 7.5 3s7.5-1.3 7.5-3v-11"/><path d="M4.5 12c0 1.7 3.3 3 7.5 3s7.5-1.3 7.5-3"/>',
    cloud: '<path d="M7 18h10.5a3.5 3.5 0 0 0 .4-7 5.5 5.5 0 0 0-10.6 1.2A3.2 3.2 0 0 0 7 18z"/>',
    server: '<rect x="4" y="4" width="16" height="6" rx="1.5"/><rect x="4" y="14" width="16" height="6" rx="1.5"/><path d="M7 7h.01M7 17h.01M11 7h5M11 17h5"/>',
    flask: '<path d="M9 3.5h6M10 3.5v6L5.2 17.8A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.3-3.2L14 9.5v-6"/><path d="M7.8 15h8.4"/>',
    microscope: '<path d="M9.5 3.5l5 5M11 6l-4 4"/><path d="M6.5 12.5a6.5 6.5 0 0 0 11 4"/><path d="M4.5 21h13M10 21v-3"/>',
    atom: '<circle cx="12" cy="12" r="1.8"/><ellipse cx="12" cy="12" rx="9" ry="4"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(120 12 12)"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.4 8.4-8 9.5C7.4 20.4 4 17 4 12V6z"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
    warning: '<path d="M12 3.5 21 20H3z"/><path d="M12 9.5v4.5M12 17h.01"/>',
    wallet: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M17 14.5h.01"/>',
    calculator: '<rect x="5" y="3" width="14" height="18" rx="2"/><rect x="8" y="6" width="8" height="3" rx="1"/><path d="M8.5 13h.01M12 13h.01M15.5 13h.01M8.5 17h.01M12 17h.01M15.5 17h.01"/>',
    stamp: '<path d="M4 20h16M7 17h10"/><path d="M9 13.5V8a3 3 0 0 1 6 0v5.5z"/>',
    megaphone: '<path d="M4 10.5v3.5h4l8 5V5.5l-8 5z"/><path d="M18.5 9.5a3.2 3.2 0 0 1 0 5"/>',
    flag: '<path d="M6 21V4M6 5h12l-2.5 4L18 13H6"/>',
    cart: '<circle cx="9" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/><path d="M3 4h2.2l2.3 11h11L21 8.5H6"/>',
    building: '<path d="M4 21V5h9v16M13 21V10h7v11"/><path d="M7 8h2M7 12h2M7 16h2M16 13h1M16 17h1"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5 13.2 13.2 8.5 15.5l2.3-4.7z"/>',
    pen: '<path d="M4 20l4.5-1L19.5 8l-3.5-3.5L5 15.5z"/><path d="M15 5.5 18.5 9"/>',
    scales: '<path d="M12 3.5v17M7 20.5h10M4 7.5h16"/><path d="M4 7.5 1.5 13h5zM20 7.5 17.5 13h5z"/>',
    leaf: '<path d="M4 20C4 10.5 10.5 4 20 4c0 9.5-6.5 16-16 16z"/><path d="M6 18C9.5 13 13 9.5 18 6"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20.5 4v5h-5"/>',
    camera: '<rect x="3" y="6.5" width="18" height="13" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6.5 9.5 4h5L16 6.5"/>',
    headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="2.5" y="13.5" width="3.5" height="6.5" rx="1.2"/><rect x="18" y="13.5" width="3.5" height="6.5" rx="1.2"/><path d="M19.8 20a4 4 0 0 1-4 2H13"/>',
    wifi: '<path d="M2.5 9a13.5 13.5 0 0 1 19 0M6 12.5a8.5 8.5 0 0 1 12 0M9.5 16a4.5 4.5 0 0 1 5 0"/><path d="M12 19.5h.01"/>',
    chat: '<path d="M4 4.5h16v11H9.5L4 20z"/><path d="M8 8.5h8M8 11.5h5"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14a4.5 4.5 0 0 0 8 0"/><path d="M9 9.5h.01M15 9.5h.01"/>',
    heart: '<path d="M12 20s-8-5.2-8-10.2A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8 2.8c0 5-8 10.2-8 10.2z"/>',
    star: '<path d="M12 3.5 14.7 9l6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.9l6-.9z"/>',
    bolt: '<path d="M13 2.5 5 13.5h6l-1 8 8-11h-6z"/>',
    cube: '<path d="M12 3 21 8v8l-9 5-9-5V8z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    monitor: '<rect x="2.5" y="4" width="19" height="12.5" rx="2"/><path d="M12 16.5V20M8.5 20h7"/>',
    laptop: '<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M2 20h20"/>',
    play: '<rect x="2.5" y="4" width="19" height="16" rx="3"/><path d="M10 9.5v5l4.5-2.5z"/>',
    folder: '<path d="M3 5.5h7l2 2h9v12H3z"/>',
    form: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h4"/><rect x="14.5" y="15" width="3" height="3" rx=".6"/>',
    bulb: '<path d="M9 17.5h6M10 20.5h4"/><path d="M12 3a6 6 0 0 1 3.5 10.9V17h-7v-3.1A6 6 0 0 1 12 3z"/>',
    seat: '<path d="M6.5 4v9.5h9.5"/><path d="M9.5 13.5V20M15 13.5V20"/>',
    archive: '<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M4.5 9v11h15V9M9 13h6"/>',
    museum: '<path d="M3 9 12 4l9 5"/><path d="M5 9v9M9.5 9v9M14.5 9v9M19 9v9M3 18h18M2 21h20"/>',
    meeting: '<circle cx="8" cy="7.5" r="2.2"/><circle cx="16" cy="7.5" r="2.2"/><path d="M3.5 18c0-3 2-5 4.5-5s4.5 2 4.5 5M11.5 18c0-3 2-5 4.5-5s4.5 2 4.5 5"/>',
    activity: '<path d="M2.5 12h4l2.5-6.5 5 13 2.5-6.5h5"/>',
    route: '<circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="5.5" r="2.5"/><path d="M8 16.5 16 7.5" stroke-dasharray="2.5 2.5"/>',
    disc: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2"/><path d="M18 9.5a8.5 8.5 0 0 1 0 5"/>',
    bank: '<path d="M3 9 12 4l9 5"/><path d="M5 9v9M9.5 9v9M14.5 9v9M19 9v9M3 18h18M2 21h20"/>',
    wheat: '<path d="M12 21V9"/><path d="M12 12c-2.6 0-4.2-1.6-4.2-4.2 2.6 0 4.2 1.6 4.2 4.2zM12 12c2.6 0 4.2-1.6 4.2-4.2-2.6 0-4.2 1.6-4.2 4.2zM12 17c-2.6 0-4.2-1.6-4.2-4.2 2.6 0 4.2 1.6 4.2 4.2zM12 17c2.6 0 4.2-1.6 4.2-4.2-2.6 0-4.2 1.6-4.2 4.2z"/>'
  };

  // 模块标题图标：与线性图标不同，这里要「实心图形 + 透明底」，
  // 颜色由 --ruc-brand 决定（浅色人大红 / 深色提亮红），与标题文字保持一致
  const SOLID = {
    bell:
      '<path d="M12 2.2a1 1 0 0 1 1 1v1a6.4 6.4 0 0 1 5.2 6.2v3.4l1.5 2.5a.95.95 0 0 1-.82 1.43H4.12a.95.95 0 0 1-.82-1.43L4.8 13.8v-3.4A6.4 6.4 0 0 1 10 4.2v-1a1 1 0 0 1 1-1z"/><path d="M9.4 19h5.2a2.6 2.6 0 0 1-5.2 0z"/>',
    calendar:
      '<path fill-rule="evenodd" d="M5.6 3.6h12.8a2.8 2.8 0 0 1 2.8 2.8v11.8a2.8 2.8 0 0 1-2.8 2.8H5.6a2.8 2.8 0 0 1-2.8-2.8V6.4a2.8 2.8 0 0 1 2.8-2.8zM4.2 9.8h15.6v8.8H4.2z"/><rect x="6.6" y="2" width="2" height="3.4" rx="1"/><rect x="15.4" y="2" width="2" height="3.4" rx="1"/><rect x="6.4" y="12.6" width="2.6" height="2.6" rx=".7"/><rect x="10.9" y="12.6" width="2.6" height="2.6" rx=".7"/><rect x="15.4" y="12.6" width="2.6" height="2.6" rx=".7"/>',
    bulb:
      '<path d="M12 2.6a6.6 6.6 0 0 1 4.1 11.8v1.1a1.4 1.4 0 0 1-1.4 1.4H9.3a1.4 1.4 0 0 1-1.4-1.4v-1.1A6.6 6.6 0 0 1 12 2.6z"/><rect x="9.5" y="17.6" width="5" height="1.7" rx=".85"/><rect x="10.3" y="20.2" width="3.4" height="1.3" rx=".65"/>',
    bookmark:
      '<path d="M7.2 2.8h9.6a1.6 1.6 0 0 1 1.6 1.6v16.8l-6.4-4.2-6.4 4.2V4.4a1.6 1.6 0 0 1 1.6-1.6z"/>'
  };

  // UUID -> [分类, 符号]
  const APPS = {
    // 教务
    "c1da7f3a-e7ad-4347-b33e-f6a1c4cf158f": ["acad", "calgrid"],
    "e91e8d5e-2f03-40a4-9a18-18451e0993e3": ["acad", "calperson"],
    "c5e8896d-87aa-4299-a05e-6cfbc5aff591": ["acad", "callist"],
    "a7c105ea-cc68-4d5b-af61-f75944810017": ["acad", "callist"],
    "f49da172-26b9-4ce9-bca8-2dee73bb83dd": ["acad", "cap"],
    "b05ef534-768f-467d-8cfc-206f17d089d8": ["acad", "server"],
    "23e86d90-104a-43de-88ad-ae4fcc7d6b52": ["acad", "search"],
    "2c481f78-b7fd-4846-bec4-3ca9fbf9bbaf": ["acad", "key"],
    "dc47bf60-43b2-4a55-ab80-0b58325f7624": ["acad", "globe"],
    "f0702e69-c16d-48b4-9079-53912a56de94": ["acad", "monitor"],
    "05d107f5-7e20-4ac1-a180-6a4e96986284": ["acad", "activity"],
    "e5ec047b-5956-42c0-8507-cf9373aee1d8": ["acad", "bulb"],
    "531591e7-3388-4ec5-8e5f-b19f021db205": ["acad", "megaphone"],
    "1e9d21c3-79f3-4076-a753-7a439e13f437": ["acad", "people"],
    "64374249-2813-4e3d-a68d-67a6b3907ba2": ["acad", "route"],
    "8870e40a-18c2-4cf4-9ae8-a740a0eeea5a": ["acad", "checklist"],
    "161ca264-97e8-4380-9a11-9ba5c250a043": ["acad", "refresh"],
    "999118ce-8a10-4584-869c-82230382462a": ["acad", "clipboard"],
    "5535e214-9a52-4d1a-8211-65c4589b754a": ["acad", "flask"],
    "8618d875-58e0-4d55-8de1-ec6db9a482c2": ["acad", "shield"],
    "0e6463ba-f8aa-44ac-8b37-d7ee6be194cb": ["acad", "play"],
    "794985ca-3cd9-48eb-9ce8-ef4591c583fa": ["acad", "laptop"],
    "acaa7bd3-d2d7-405c-aba2-0f64c1bbec7c": ["acad", "cube"],

    // 学务
    "1e4be7fd-f195-45d9-b93a-986c53f0f26a": ["stu", "idcard"],
    "0f1552a9-0dc7-4260-b2fc-34637f313393": ["stu", "briefcase"],
    "cc793b02-d245-48fe-b22f-ba7de5a97ada": ["stu", "plane"],
    "50172dbf-1183-48c3-b714-4488797e0b32": ["stu", "globe"],
    "bf62e694-2528-4879-88c9-fa855d46c993": ["stu", "cloud"],
    "0b7889c6-f71d-4c44-9ab5-d5c2f2c601a5": ["stu", "building"],
    "83db4c73-277f-45ba-af1e-95bc71b083a8": ["stu", "smile"],
    "c966cabd-732f-45ac-865f-ca30e633f910": ["stu", "cap"],

    // 服务
    "8794bf43-38cb-4306-8d0d-1e3f160d2f6f": ["serv", "bolt"],
    "5d3b7566-43f6-48da-8947-11ef1740a0ab": ["serv", "idcard"],
    "1b30acad-1a8f-4447-a7cf-6e58cf7cf932": ["serv", "activity"],
    "12cf7cac-1aa5-411c-8728-17cf0050d7df": ["serv", "heart"],
    "42111a8b-4ccf-4d8e-b0c9-4d44e917907a": ["serv", "cal"],
    "4d4b160d-edd1-491f-a30e-ca7324e3e384": ["serv", "bookcloud"],
    "b3012706-2794-4a83-a56d-8aae52989d0b": ["serv", "database"],
    "3ded26e2-327f-4745-91d0-2c62c50dce8c": ["serv", "seat"],
    "65d9a896-6e03-4739-aaed-ecd7bd7b0f2a": ["serv", "search"],
    "6cdce133-0d47-4b24-b568-90aaf7188c6f": ["serv", "calcheck"],
    "b6f2f963-8650-4c5e-bd5d-e397d3df3cae": ["serv", "disc"],
    "4c773ffe-3afc-4189-af79-2bafc2964594": ["serv", "server"],
    "73bfc53d-7794-4560-be34-7f08c60961b7": ["serv", "archive"],
    "d70761aa-1c44-43f1-baac-7357e3e06e6e": ["serv", "museum"],
    "a3bf7fbb-a9ea-4d52-b2fa-4f1c665f6c0b": ["serv", "meeting"],
    "40c7d776-b8fc-44bb-974a-9e999470ebf8": ["serv", "microscope"],
    "955d41c9-aa5c-4044-8e33-461343f0902e": ["serv", "stamp"],
    "4b767d9b-51e0-404b-b370-81f5c1db0957": ["serv", "doccheck"],
    "25e304f4-f75e-496d-ba6e-946b9d2438d4": ["serv", "chart"],
    "cd2f3997-eddd-4d7f-894d-b774d0688f3e": ["serv", "warning"],
    "81c0310d-4870-4379-b7f8-8ed0c4d89428": ["serv", "star"],
    "41c38c8c-d5c1-4e57-9347-c4985aa67c13": ["serv", "building"],
    "ea6d84ef-fcc7-4c10-8c25-4a4feb168d70": ["serv", "globe"],
    "c1fc7fdf-14c8-45d9-93eb-b2671dca108e": ["serv", "folder"],
    "06e9d713-e4d0-45ed-8948-80b2f2ec4e10": ["serv", "chat"],
    "15e08270-027a-4ee7-baf1-d6bcd7110b68": ["serv", "bookstar"],
    "a9abe439-1223-49f8-a7a9-8a13bbb75cb3": ["serv", "calcheck"],

    // 财务
    "e904874d-41e0-40da-94e4-f4cb7945b5db": ["fin", "wallet"],
    "aa789950-48ba-4660-a249-8a2a253f02c6": ["fin", "calculator"],

    // 校务
    "1276b423-e434-4a6f-a1ce-6af29781fd24": ["admin", "flag"],
    "dade7001-68b8-4528-8a01-005db1545f8f": ["admin", "folder"],
    "d03dcbd5-3269-4743-a074-c23fbbc6bf77": ["admin", "bookstar"],
    "ff766a11-799f-480b-9bde-f039dbadb6a7": ["admin", "clipboard"],
    "f06c9aab-2bf8-4626-9f16-11057dd6114e": ["admin", "megaphone"],
    "3d328a46-02f7-475b-9038-942d21a6de2b": ["admin", "atom"],
    "764decbc-5071-43a1-a083-efeb30d2256b": ["admin", "cart"],
    "372e3502-0afa-414c-b7ca-eb181e760f6f": ["admin", "doc"],
    "7a144a92-5428-4f2a-a4a1-79b0d859edb4": ["admin", "bulb"],
    "2521afc2-a00d-4f19-8a5f-7fae348fd996": ["admin", "form"],

    // 院务
    "d9e91cb6-3d11-4c21-965d-c9710126e21b": ["college", "building"],
    "db4b253e-e86e-4344-85f6-ff9316b950f7": ["college", "bank"],
    "a42b3549-9339-49d5-9261-7aa64f837e04": ["college", "chart"],
    "2f151193-e656-4d29-b55c-e96b0b913959": ["college", "gear"],
    "4108c404-1484-44e6-8525-bc351d98c657": ["college", "leaf"],
    "8246f0d5-4005-48bc-a134-0936840dccd5": ["college", "scales"],
    "903a2a28-0f2a-4a05-a226-be4100caa36b": ["college", "pen"],
    "35da0b5b-e8bb-4f33-aad7-6d74c5bc9499": ["college", "compass"],
    "c5753a61-834c-4972-b50d-91eab86e3ae3": ["college", "calculator"],
    "70ec25d8-95ff-4310-b62e-d06dc5da1037": ["college", "cap"],
    "209c9094-8f7d-4f98-b95e-44eb297e85d3": ["college", "growth"],
    "75b7368e-8e60-4904-a354-cb4e98fb0030": ["college", "briefcase"],
    "111c0cc1-f83e-4d75-b517-2df5b0629937": ["college", "wheat"],

    // 其他
    "c89e0fb1-b8ac-4666-b70c-111b9803f12d": ["misc", "doccheck"],
    "97a3b197-a271-41a6-baef-44558ce5dfd1": ["misc", "flask"],
    "4c2f7aaf-4ff3-4f0c-acc1-f583483c1576": ["misc", "refresh"],
    "efb5316e-8348-47ea-ae4e-b574010c936e": ["misc", "people"],
    "619270c2-fa02-420c-bac2-267952fa587c": ["misc", "globe"],
    "e887b1a5-3ef5-4c9e-a0c7-7bb06388fae8": ["misc", "person"],
    "0110c917-0d5a-48e7-b8d2-ce1fe3f6a050": ["misc", "camera"],
    "f53dd662-ba61-49eb-9efc-d13caa36b1ba": ["misc", "headset"],
    "89516a7b-4f80-4c2d-989d-ee4cf9d349af": ["misc", "wifi"]
  };

  // 首页模块标题图标：站点原图（icon_t*.png）是 3D 写实小图，与本站图标
  // 语言不一致，按文件名映射重绘为实心透明底图标。icon_t7.png 同时用于
  // 「AI简报」与「我的订阅」，按相邻标题文本区分（【脆弱锚点：.css-1ndi6d】）
  const MODULES = {
    "icon_t1.png": "bell", // 通知公告
    "icon_t2.png": "calendar", // 日程中心
    "icon_t7.png": "bulb" // AI简报（默认）
  };
  const MODULE_T7 = {
    "我的订阅": "bookmark"
  };

  const cache = new Map();
  const themeDark = () => document.documentElement.dataset.rucTheme === "dark";

  // --ruc-brand 由扩展 CSS 令牌提供；万一 CSS 尚未生效则回退到同一色值
  function brandColor() {
    let v = "";
    try {
      v = getComputedStyle(document.documentElement).getPropertyValue("--ruc-brand").trim();
    } catch (e) {
      v = "";
    }
    return v || (themeDark() ? "#ff6b5e" : "#861a12");
  }

  // 应用磁贴沿用站点原始图标库，不再重绘；仅模块标题图标继续自绘

  // 实心模块图标：透明底 + 品牌色，字号与标题同步
  function solidUri(glyphKey) {
    const color = brandColor();
    const key = "solid:" + glyphKey + ":" + color;
    if (cache.has(key)) return cache.get(key);
    const glyph = SOLID[glyphKey];
    if (!glyph) return null;
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">' +
      '<g transform="translate(8 8)" fill="' + color + '" stroke="none">' +
      glyph +
      "</g></svg>";
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    cache.set(key, url);
    return url;
  }

  function moduleKey(img) {
    if (img.dataset.rucModule) return img.dataset.rucModule;
    const src = img.getAttribute("src") || "";
    if (src.indexOf("data:image/svg") === 0) return null;
    const file = /\/(icon_t\d+\.png)/.exec(src);
    if (!file) return null;
    let key = MODULES[file[1]];
    if (file[1] === "icon_t7.png") {
      const head = img.closest(".css-70qvj9");
      const title = head && head.querySelector(".css-1ndi6d");
      const name = title ? title.textContent.trim() : "";
      key = MODULE_T7[name] || key;
    }
    return key;
  }

  function swapModule(img) {
    if (!img || img.nodeName !== "IMG") return;
    const key = moduleKey(img);
    if (!key) return;
    const url = solidUri(key);
    if (!url) return;
    img.dataset.rucModule = key;
    if (img.hasAttribute("srcset")) img.removeAttribute("srcset");
    if (img.getAttribute("src") !== url) img.src = url;
    img.style.setProperty("width", "34px", "important");
    img.style.setProperty("height", "34px", "important");
    img.style.setProperty("object-fit", "contain", "important");
  }

  // 主题切换：重绘随主题变化的自绘模块标题图标
  function refreshIcons() {
    document.querySelectorAll("img[data-ruc-module]").forEach((img) => swapModule(img));
  }

  // 浅色模式校徽换成红色矢量版；深色保留站点原金色版。
  // 「原始」配色是红侧栏，必须保留原金色校徽，否则红底红标不可见。
  // 扩展注入的 CSS 里 url() 会按页面域名解析（../assets 会 404），
  // 因此这里用 chrome.runtime.getURL 给出扩展绝对地址。
  const LOGO_FILE = "assets/logo-ruc-red.png";
  function swapLogo() {
    if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.getURL) return;
    const url = chrome.runtime.getURL(LOGO_FILE);
    const root = document.documentElement;
    const light =
      root.dataset.rucTheme === "light" && root.dataset.rucPalette !== "original";
    document.querySelectorAll('.left.css-vc7il7 img[src*="logo-ruc.png"], .left.css-vc7il7 img[data-ruc-logo]').forEach((img) => {
      if (!img.dataset.rucLogoSrc) img.dataset.rucLogoSrc = img.getAttribute("src");
      const want = light ? url : img.dataset.rucLogoSrc;
      if (img.getAttribute("src") !== want) img.src = want;
      img.dataset.rucLogo = "1";
    });
  }

  // 日程中心「学期 + 第N周」：只保留周数，学期隐藏（由 CSS 统一成深灰无衬线）
  function slimWeek() {
    const el = document.querySelector(".sui-app-page .css-1d20nk4");
    if (!el || el.dataset.rucWeek === "1") return;
    const m = /第\s*(\d+)\s*周/.exec(el.textContent || "");
    if (!m) return;
    el.textContent = "第" + m[1] + "周";
    el.dataset.rucWeek = "1";
  }

  function scan(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('img[src*="icon_t"]').forEach((img) => {
      swapModule(img);
    });
    if (scope !== document && scope.tagName === "IMG") {
      swapModule(scope);
    }
    swapLogo();
    slimWeek();
  }

  scan();
  const start = () => {
    if (!document.body) return;
    new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === "attributes") {
          if (r.attributeName === "data-ruc-theme" || r.attributeName === "data-ruc-palette") {
            swapLogo();
            refreshIcons();
          } else {
            swapModule(r.target);
          }
        } else {
          for (const n of r.addedNodes) {
            if (n.nodeType !== 1) continue;
            if (n.tagName === "IMG") {
              swapModule(n);
            } else scan(n);
          }
          slimWeek();
        }
      }
    }).observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "data-ruc-theme", "data-ruc-palette"]
    });
  };
  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start, { once: true });
  }

  const gate = globalThis.__rucGate;
  if (gate) gate.then((ok) => { if (ok) boot(); });
  else boot();
})();
