// Anime Team sidebar — everything below reads config.js and themes.js.
// You shouldn't need to edit this file for monthly updates.
(() => {
  "use strict";

  const CFG = window.CLUB_CONFIG;
  const API = "https://api.chess.com/pub";
  const DEFAULT_AVATAR = "https://www.chess.com/bundles/web/images/user-image.007dad08.svg";
  const $ = (id) => document.getElementById(id);

  // ---------- small helpers ----------

  // Build DOM safely (text is never parsed as HTML).
  function h(tag, attrs, ...kids) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k === "style") node.style.cssText = v;
      else node.setAttribute(k, v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      node.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return node;
  }
  const extLink = (href, attrs, ...kids) =>
    h("a", { href, target: "_blank", rel: "noopener", ...attrs }, ...kids);

  function setList(container, nodes, emptyText) {
    container.replaceChildren(
      nodes.length ? h("div", { class: "list" }, nodes) : h("div", { class: "empty", text: emptyText })
    );
  }

  // Chess.com asks for requests in series rather than big parallel bursts,
  // so all Chess.com calls go through this small queue (3 at a time).
  const queue = [];
  let active = 0;
  function chess(path) {
    return new Promise((resolve, reject) => {
      queue.push({ path, resolve, reject });
      pump();
    });
  }
  function pump() {
    while (active < 3 && queue.length) {
      const job = queue.shift();
      active++;
      fetchJSON(API + job.path, 1)
        .then(job.resolve, job.reject)
        .finally(() => { active--; pump(); });
    }
  }
  async function fetchJSON(url, retries = 0, opts = {}) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    try {
      const res = await fetch(url, { ...opts, signal: ctrl.signal });
      if (res.status === 429 && retries > 0) {
        await new Promise((r) => setTimeout(r, 1500));
        return fetchJSON(url, retries - 1, opts);
      }
      if (!res.ok) throw new Error(res.status + " " + url);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  const players = new Map();
  function player(username) {
    const key = username.toLowerCase();
    if (!players.has(key)) players.set(key, chess("/player/" + encodeURIComponent(key)).catch(() => null));
    return players.get(key);
  }

  function ago(unix) {
    const s = Math.max(0, Date.now() / 1000 - unix);
    if (s < 3600) return Math.max(1, Math.floor(s / 60)) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    if (s < 86400 * 60) return Math.floor(s / 86400) + "d ago";
    if (s < 86400 * 730) return Math.floor(s / (86400 * 30)) + "mo ago";
    return Math.floor(s / (86400 * 365)) + "y ago";
  }
  const idFrom = (apiUrl) => (apiUrl || "").split("/").pop();
  const fmt = (n) => Number(n).toLocaleString();

  const store = {
    get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
    set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* storage blocked */ } },
  };

  // ---------- theme ----------

  function pickTheme() {
    const want = new URLSearchParams(location.search).get("theme");
    if (want && window.THEMES[want]) return want;
    const now = new Date();
    const month = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
    const months = Object.keys(window.SCHEDULE).sort();
    const pastOrNow = months.filter((m) => m <= month);
    const chosen = pastOrNow.length ? pastOrNow[pastOrNow.length - 1] : months[0];
    return window.SCHEDULE[chosen] || Object.keys(window.THEMES)[0];
  }

  function applyTheme() {
    const t = window.THEMES[pickTheme()];
    if (!t) return;
    const root = document.documentElement;
    for (const [k, v] of Object.entries(t.colors || {})) root.style.setProperty("--" + k, v);

    const fonts = [...new Set([t.fontDisplay, t.fontBody].filter(Boolean))];
    if (fonts.length) {
      const fam = fonts.map((f) => "family=" + encodeURIComponent(f) + ":wght@400;500;600;700").join("&");
      document.head.append(h("link", { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?" + fam + "&display=swap" }));
      if (t.fontDisplay) root.style.setProperty("--font-display", `"${t.fontDisplay}", system-ui, sans-serif`);
      if (t.fontBody) root.style.setProperty("--font-body", `"${t.fontBody}", system-ui, sans-serif`);
    }

    $("themeChip").textContent = t.anime ? "✦ " + t.anime : "";
    $("tagline").textContent = t.tagline || "";
    const bg = $("heroBg");
    if (t.bannerPosition) bg.style.backgroundPosition = t.bannerPosition;
    const setBanner = (url) => { if (url) bg.style.backgroundImage = `url("${encodeURI(url)}")`; };
    if (t.banner) setBanner(t.banner);
    else if (t.anilistId) {
      anilist(`query($id:Int){Media(id:$id){bannerImage coverImage{extraLarge}}}`, { id: t.anilistId })
        .then((d) => setBanner(d.Media.bannerImage || d.Media.coverImage.extraLarge))
        .catch(() => {});
    }

    const monthName = new Date().toLocaleString("en", { month: "long" });
    $("foot").replaceChildren(
      t.anime ? `${monthName} theme: ${t.anime} · ` : "",
      "Live data from ",
      extLink("https://www.chess.com/club/" + CFG.clubId, { text: "Chess.com" }),
      " & ",
      extLink("https://anilist.co", { text: "AniList" })
    );
  }

  function anilist(query, variables) {
    return fetchJSON("https://graphql.anilist.co", 0, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query, variables }),
    }).then((j) => { if (j.errors) throw new Error("AniList"); return j.data; });
  }

  // ---------- tabs ----------

  const onFirstOpen = {};
  function showTab(name) {
    document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("active", p.dataset.panel === name));
    moveInk();
    if (onFirstOpen[name]) { onFirstOpen[name](); delete onFirstOpen[name]; }
    store.set("at-tab", name);
  }
  document.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));

  // the sliding pill behind the active tab
  function moveInk() {
    const tab = document.querySelector(".tab.active");
    const ink = $("tabInk");
    if (!tab || !ink) return;
    ink.style.width = tab.offsetWidth + "px";
    ink.style.transform = "translateX(" + tab.offsetLeft + "px)";
  }
  addEventListener("resize", moveInk);
  if (document.fonts) document.fonts.ready.then(moveInk);

  // ---------- club ----------

  async function loadClub() {
    try {
      const c = await chess("/club/" + CFG.clubId);
      $("statMembers").textContent = fmt(c.members_count);
      $("statRating").textContent = c.average_daily_rating ? fmt(c.average_daily_rating) : "—";
      if (c.icon) $("clubIcon").src = c.icon;
      if (c.name) $("clubName").textContent = c.name;
      if (c.created) {
        const months = Math.floor((Date.now() / 1000 - c.created) / (86400 * 30.44));
        const age = $("statAge");
        age.textContent = `${Math.floor(months / 12)}y ${months % 12}m`;
        age.title = "Founded " + new Date(c.created * 1000).toLocaleDateString(undefined, { dateStyle: "long" });
      }
      renderLeaders(c.admin || []);
    } catch {
      $("statMembers").textContent = "10,000+";
      $("listLeaders").replaceChildren(h("div", { class: "empty", text: "Couldn't reach Chess.com right now." }));
    }
  }

  async function renderLeaders(adminUrls) {
    const roleKeys = Object.keys(CFG.roles || {});
    const names = adminUrls.map(idFrom).sort((a, b) => {
      const ia = roleKeys.indexOf(a), ib = roleKeys.indexOf(b);
      if (ia !== ib) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      return a.localeCompare(b);
    });
    const rows = names.map((name) => {
      const role = CFG.roles[name];
      const img = h("img", { class: "avatar", src: DEFAULT_AVATAR, alt: "", loading: "lazy" });
      const title = h("div", { class: "row-title", text: name });
      const sub = h("div", { class: "row-sub" });
      const row = extLink("https://www.chess.com/member/" + name, { class: "row" },
        img, h("div", { class: "row-main" }, title, sub),
        h("div", { class: "row-end" }, h("span", { class: "role" + (role ? " special" : ""), text: role || "Admin" })));
      player(name).then((p) => {
        if (!p) return;
        if (p.avatar) img.src = p.avatar;
        title.replaceChildren(p.title ? h("span", { class: "title-badge", text: p.title }) : "", p.username || name);
        if (p.last_online) sub.textContent = "Online " + ago(p.last_online);
      });
      return row;
    });
    setList($("listLeaders"), rows, "No admins listed.");
  }

  // ---------- members ----------

  let spotlightPool = [];
  let lastSpot = null;

  async function loadMembers() {
    try {
      const m = await chess(`/club/${CFG.clubId}/members`);
      const weekly = m.weekly || [];
      const everyone = [...weekly, ...(m.monthly || []), ...(m.all_time || [])];
      $("statActive").textContent = fmt(weekly.length);
      spotlightPool = weekly.length ? weekly : everyone;
      ranksPool = weekly.map((x) => x.username);

      const newest = everyone.slice().sort((a, b) => b.joined - a.joined).slice(0, 5);
      setList($("listNewest"), newest.map((x) => {
        const img = h("img", { class: "avatar", src: DEFAULT_AVATAR, alt: "", loading: "lazy" });
        player(x.username).then((p) => { if (p && p.avatar) img.src = p.avatar; });
        return extLink("https://www.chess.com/member/" + x.username, { class: "row" },
          img, h("div", { class: "row-main" }, h("div", { class: "row-title", text: x.username })),
          h("div", { class: "row-end", text: "Joined " + ago(x.joined) }));
      }), "No members found.");
      spotlight();
    } catch {
      $("statActive").textContent = "—";
      $("listNewest").replaceChildren(h("div", { class: "empty", text: "Couldn't load members right now." }));
      $("spotName").textContent = "Unavailable";
    }
  }

  async function spotlight() {
    if (!spotlightPool.length) return;
    let pick;
    do { pick = spotlightPool[Math.floor(Math.random() * spotlightPool.length)]; }
    while (spotlightPool.length > 1 && pick.username === lastSpot);
    lastSpot = pick.username;

    $("spotName").textContent = pick.username;
    $("spotName").href = "https://www.chess.com/member/" + pick.username;
    $("spotAvatar").src = DEFAULT_AVATAR;
    $("spotMeta").textContent = "Member since " + new Date(pick.joined * 1000).getFullYear();

    const p = await player(pick.username);
    if (!p || lastSpot !== pick.username) return;
    if (p.avatar) $("spotAvatar").src = p.avatar;
    const bits = [];
    if (p.title) bits.push(p.title);
    if (p.league) bits.push(p.league + " league");
    bits.push("Member since " + new Date(pick.joined * 1000).getFullYear());
    $("spotMeta").textContent = bits.join(" · ");
  }
  $("shuffleBtn").addEventListener("click", (e) => {
    const btn = e.currentTarget;
    btn.classList.remove("spin"); void btn.offsetWidth; btn.classList.add("spin");
    spotlight();
  });

  $("searchForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("searchInput").value.trim();
    const msg = $("searchMsg");
    if (!name) return;
    if (!/^[A-Za-z0-9_-]{2,30}$/.test(name)) { msg.className = "search-msg"; msg.textContent = "That doesn't look like a Chess.com username."; return; }
    msg.className = "search-msg"; msg.textContent = "Looking…";
    try {
      const p = await chess("/player/" + name.toLowerCase());
      msg.className = "search-msg ok";
      msg.textContent = `Found ${p.username} — opening profile.`;
      window.open("https://www.chess.com/member/" + encodeURIComponent(p.username), "_blank", "noopener");
      $("searchInput").value = "";
    } catch {
      msg.textContent = `No player named "${name}" found.`;
    }
  });

  // ---------- matches ----------

  let matches = null;
  const matchDetail = new Map();
  let matchFilter = "all";

  function matchUrl(m, detail) {
    if (detail && detail.url) return detail.url;
    const id = idFrom(m["@id"]);
    return `https://www.chess.com/club/matches/${m.time_class !== "daily" ? "live/" : ""}${id}`;
  }
  const isLive = (m) => m.time_class && m.time_class !== "daily";
  const passes = (m) => matchFilter === "all" || (matchFilter === "live" ? isLive(m) : !isLive(m));
  const timeLabel = (m) => (m.time_class || "daily").replace(/^./, (c) => c.toUpperCase());

  function detail(m) {
    const id = idFrom(m["@id"]);
    if (!matchDetail.has(id)) matchDetail.set(id, chess("/match/" + id).catch(() => null));
    return matchDetail.get(id);
  }

  function progressRow(m) {
    const name = h("div", { class: "row-title", text: m.name });
    const sub = h("div", { class: "row-sub", text: timeLabel(m) + " · started " + ago(m.start_time) });
    const score = h("div", { class: "score" });
    const row = extLink(matchUrl(m), { class: "row match" }, h("div", { class: "row-main" }, name, sub, score));
    detail(m).then((d) => {
      if (!d || !d.teams) return;
      row.href = matchUrl(m, d);
      const teams = Object.values(d.teams);
      const us = teams.find((t) => (t["@id"] || "").endsWith("/" + CFG.clubId)) || teams[0];
      const them = teams.find((t) => t !== us) || {};
      const a = Number(us.score) || 0, b = Number(them.score) || 0, total = a + b || 1;
      sub.textContent = `${timeLabel(m)} · vs ${them.name || "?"} · ${d.boards || "?"} boards`;
      score.replaceChildren(
        h("span", { class: "w", text: a }),
        h("span", { class: "sbar" }, h("i", { style: `width:${(a / total) * 100}%` }), h("i", { style: `width:${(b / total) * 100}%` })),
        h("span", { text: b })
      );
    });
    return row;
  }

  function renderMatches() {
    if (!matches) return;
    const prog = (matches.in_progress || []).filter(passes).sort((a, b) => b.start_time - a.start_time);
    const reg = (matches.registered || []).filter(passes);
    const done = (matches.finished || []).filter(passes).sort((a, b) => b.start_time - a.start_time).slice(0, 10);

    $("cntProgress").textContent = prog.length || "";
    $("cntReg").textContent = reg.length || "";
    setList($("listProgress"), prog.slice(0, 12).map(progressRow), "No matches in progress.");
    setList($("listReg"), reg.map((m) =>
      extLink(matchUrl(m), { class: "row" },
        h("div", { class: "row-main" }, h("div", { class: "row-title", text: m.name }), h("div", { class: "row-sub", text: timeLabel(m) })),
        h("div", { class: "row-end" }, h("span", { class: "pill join", text: "Join" })))
    ), "Nothing open right now.");
    const resultPill = { win: ["w", "Win"], lose: ["l", "Loss"], draw: ["d", "Draw"] };
    setList($("listDone"), done.map((m) => {
      const [cls, label] = resultPill[m.result] || ["", m.result || "—"];
      return extLink(matchUrl(m), { class: "row" },
        h("div", { class: "row-main" }, h("div", { class: "row-title", text: m.name }),
          h("div", { class: "row-sub", text: timeLabel(m) + " · " + new Date(m.start_time * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) })),
        h("div", { class: "row-end" }, h("span", { class: "pill " + cls, text: label })));
    }), "No finished matches.");
  }

  async function loadMatches() {
    try {
      matches = await chess(`/club/${CFG.clubId}/matches`);
    } catch {
      $("recordNums").textContent = "Unavailable";
      for (const id of ["listProgress", "listReg", "listDone", "homeLive"])
        $(id).replaceChildren(h("div", { class: "empty", text: "Couldn't load matches right now." }));
      return;
    }
    const fin = matches.finished || [];
    const w = fin.filter((m) => m.result === "win").length;
    const l = fin.filter((m) => m.result === "lose").length;
    const d = fin.filter((m) => m.result === "draw").length;
    const total = w + l + d || 1;
    $("recordNums").replaceChildren(
      h("span", { class: "w", text: w + "W" }), h("span", { class: "d", text: d + "D" }), h("span", { class: "l", text: l + "L" }),
      h("small", { text: Math.round((w / total) * 100) + "% win rate" }));
    requestAnimationFrame(() => {
      $("barW").style.width = (w / total) * 100 + "%";
      $("barD").style.width = (d / total) * 100 + "%";
      $("barL").style.width = (l / total) * 100 + "%";
    });

    const live = (matches.in_progress || []).slice().sort((a, b) => b.start_time - a.start_time).slice(0, 3);
    const homeLive = $("homeLive");
    setList(homeLive, live.map(progressRow), "No matches in progress.");
    if ((matches.in_progress || []).length > 3) {
      homeLive.append(h("button", { class: "see-all", text: `See all ${matches.in_progress.length} matches →` }));
      homeLive.lastChild.addEventListener("click", () => showTab("matches"));
    }
    renderMatches();
  }

  $("matchFilter").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    matchFilter = b.dataset.f;
    $("matchFilter").querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
    renderMatches();
  });

  // ---------- leaderboards ----------

  let ranksPool = null;
  let ranksData = null;
  let rankMode = "chess_rapid";
  const RANK_CACHE = "at-ranks-v1-" + CFG.clubId;
  const RANK_TTL = 12 * 3600 * 1000;

  async function loadRanks() {
    const cached = store.get(RANK_CACHE);
    if (cached && Date.now() - cached.t < RANK_TTL) {
      ranksData = cached.data;
      $("rankNote").textContent = `Top ratings among ${cached.n} members active this week · updated ${ago(cached.t / 1000)}.`;
      return renderRanks();
    }
    // wait for the member list if it's still loading
    for (let i = 0; !ranksPool && i < 50; i++) await new Promise((r) => setTimeout(r, 200));
    if (!ranksPool || !ranksPool.length) {
      $("listRanks").replaceChildren(h("div", { class: "empty", text: "Couldn't load members right now." }));
      return;
    }
    const names = ranksPool.slice(0, CFG.leaderboardScanLimit || 300);
    const scan = $("scan"); scan.hidden = false;
    ranksData = {};
    let done = 0;
    await Promise.all(names.map((name) =>
      chess("/player/" + name.toLowerCase() + "/stats").then((s) => {
        const r = {};
        for (const k of ["chess_rapid", "chess_blitz", "chess_bullet", "chess_daily"])
          if (s[k] && s[k].last) r[k] = s[k].last.rating;
        ranksData[name] = r;
      }).catch(() => {}).finally(() => {
        done++;
        $("scanText").textContent = `Scanning active members… ${done} / ${names.length}`;
        $("scanBar").style.width = (done / names.length) * 100 + "%";
        if (done % 25 === 0) renderRanks();
      })
    ));
    scan.hidden = true;
    store.set(RANK_CACHE, { t: Date.now(), n: names.length, data: ranksData });
    $("rankNote").textContent = `Top ratings among ${names.length} members active this week.`;
    renderRanks();
  }

  function renderRanks() {
    if (!ranksData) return;
    const top = Object.entries(ranksData)
      .filter(([, r]) => r[rankMode])
      .sort((a, b) => b[1][rankMode] - a[1][rankMode])
      .slice(0, 10);
    setList($("listRanks"), top.map(([name, r], i) => {
      const img = h("img", { class: "avatar", src: DEFAULT_AVATAR, alt: "", loading: "lazy" });
      const title = h("div", { class: "row-title", text: name });
      player(name).then((p) => {
        if (!p) return;
        if (p.avatar) img.src = p.avatar;
        if (p.title) title.replaceChildren(h("span", { class: "title-badge", text: p.title }), p.username || name);
      });
      return extLink("https://www.chess.com/member/" + name, { class: "row top" + (i + 1) },
        h("span", { class: "rank-n", text: i + 1 }), img, h("div", { class: "row-main" }, title),
        h("span", { class: "rating", text: r[rankMode] }));
    }), "No ratings found yet.");
  }

  $("rankFilter").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    rankMode = b.dataset.r;
    $("rankFilter").querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
    renderRanks();
  });
  onFirstOpen.ranks = loadRanks;

  // ---------- more ----------

  function renderMore() {
    renderDiscord();
    if (CFG.instagramUrl) {
      $("instaBtn").href = CFG.instagramUrl; $("instaBtn").hidden = false;
      $("instaHandle").textContent = CFG.instagramHandle || "Instagram";
    }
    $("links").replaceChildren(...(CFG.links || []).filter((l) => l.url).map((l) => extLink(l.url, { class: "link", text: l.label })));
  }

  const DISCORD_LOGO = "M20.3 4.4A19.6 19.6 0 0 0 15.4 3l-.6 1.3a18.2 18.2 0 0 0-5.6 0L8.6 3a19.5 19.5 0 0 0-4.9 1.5C.6 9.1-.3 13.6.1 18.1a19.7 19.7 0 0 0 6 3l1.3-2a12.7 12.7 0 0 1-2-1l.5-.4a14 14 0 0 0 12.2 0l.5.4-2 1 1.3 2a19.6 19.6 0 0 0 6-3c.5-5.2-.8-9.7-3.6-13.7ZM8 15.3c-1.2 0-2.2-1.1-2.2-2.4S6.8 10.5 8 10.5s2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z";

  function renderDiscord() {
    if (!CFG.discordUrl) return;
    const slots = [...document.querySelectorAll("[data-discord]")];
    const cards = slots.map((slot) => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", DISCORD_LOGO);
      svg.append(path);
      const parts = {
        icon: h("div", { class: "dc-icon" }, svg),
        title: h("div", { class: "dc-title", text: "Join our Discord" }),
        sub: h("div", { class: "dc-sub", text: "Chat, voice and match pings" }),
        faces: h("div", { class: "dc-faces", hidden: true }),
      };
      slot.replaceChildren(extLink(CFG.discordUrl, { class: "discord-card" },
        parts.icon, h("div", { class: "dc-main" }, parts.title, parts.sub, parts.faces),
        h("span", { class: "dc-join", text: "Join" })));
      return parts;
    });

    const code = CFG.discordUrl.replace(/\/+$/, "").split("/").pop();
    fetchJSON("https://discord.com/api/v10/invites/" + encodeURIComponent(code) + "?with_counts=true").then((inv) => {
      const g = inv.guild || {};
      for (const c of cards) {
        if (g.icon) c.icon.replaceChildren(h("img", { src: `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=96`, alt: "" }));
        if (g.name) c.title.textContent = g.name + " Discord";
        c.sub.replaceChildren(
          h("span", {}, h("i", { class: "dot" }), fmt(inv.approximate_presence_count || 0) + " online"),
          h("span", {}, h("i", { class: "dot grey" }), fmt(inv.approximate_member_count || 0) + " members"));
      }
    }).catch(() => {});

    // Only works if the server has Settings → Widget turned on.
    if (CFG.discordServerId) {
      fetchJSON("https://discord.com/api/guilds/" + encodeURIComponent(CFG.discordServerId) + "/widget.json").then((w) => {
        const faces = (w.members || []).filter((m) => m.avatar_url).slice(0, 7);
        if (!faces.length) return;
        for (const c of cards) {
          c.faces.replaceChildren(...faces.map((m) => h("img", { src: m.avatar_url, alt: "", title: m.username, loading: "lazy" })));
          c.faces.hidden = false;
        }
      }).catch(() => {});
    }
  }

  async function loadAnime() {
    try {
      const d = await anilist(`{Page(perPage:6){media(type:ANIME,sort:TRENDING_DESC,isAdult:false){title{english romaji} coverImage{large} averageScore siteUrl}}}`);
      $("animeGrid").replaceChildren(...d.Page.media.map((a, i) => {
        const title = a.title.english || a.title.romaji;
        return extLink(a.siteUrl, { class: "anime", title },
          h("img", { src: a.coverImage.large, alt: "", loading: "lazy" }),
          h("span", { class: "anime-rank", text: "#" + (i + 1) }),
          h("div", { class: "anime-info" }, h("div", { class: "anime-title", text: title }),
            a.averageScore ? h("div", { class: "anime-score", text: "★ " + (a.averageScore / 10).toFixed(1) }) : null));
      }));
    } catch {
      $("animeGrid").replaceChildren(h("div", { class: "empty", text: "Couldn't load trending anime right now." }));
    }
  }
  onFirstOpen.more = loadAnime;

  // ---------- go ----------

  applyTheme();
  renderMore();
  loadClub();
  loadMembers();
  loadMatches();
  const savedTab = store.get("at-tab");
  if (savedTab && document.querySelector(`.tab[data-tab="${savedTab}"]`)) showTab(savedTab);
  else moveInk();
})();
