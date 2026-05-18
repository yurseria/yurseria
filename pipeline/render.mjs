import satori from 'satori';
import fs from 'node:fs';
import path from 'node:path';

// ── load data fetched by fetch-data.mjs ───────────────────────────────
const DATA = JSON.parse(fs.readFileSync(new URL('./data.json', import.meta.url), 'utf8'));
const fmtInt = (n) => n.toLocaleString('en-US');

// ── hyperscript helper ────────────────────────────────────────────────
const h = (type, props, ...children) => {
  const kids = children.flat().filter(c => c !== null && c !== undefined && c !== false);
  const p = props ? { ...props } : {};
  if (type === 'div') p.style = { display: 'flex', ...(p.style || {}) };
  return { type, props: { ...p, children: kids } };
};

const fonts = [
  { name: 'Inter', data: fs.readFileSync('fonts/Inter-Regular.ttf'), weight: 400, style: 'normal' },
  { name: 'Inter', data: fs.readFileSync('fonts/Inter-Bold.ttf'), weight: 700, style: 'normal' },
  { name: 'Inter', data: fs.readFileSync('fonts/Inter-Black.ttf'), weight: 900, style: 'normal' },
  { name: 'JetBrains Mono', data: fs.readFileSync('fonts/JetBrainsMono-Regular.ttf'), weight: 400, style: 'normal' },
  { name: 'JetBrains Mono', data: fs.readFileSync('fonts/JetBrainsMono-Bold.ttf'), weight: 700, style: 'normal' },
  { name: 'Noto Sans KR', data: fs.readFileSync('fonts/NotoSansKR-Regular.ttf'), weight: 400, style: 'normal' },
  { name: 'Noto Sans KR', data: fs.readFileSync('fonts/NotoSansKR-Bold.ttf'), weight: 700, style: 'normal' },
  { name: 'Noto Sans KR', data: fs.readFileSync('fonts/NotoSansKR-Black.ttf'), weight: 900, style: 'normal' },
];

const themes = {
  dark: {
    bg: '#0a0e1a', surface: '#0f1525', headerBg: '#0f1525', border: '#1e293b',
    text: '#e2e8f0', label: '#94a3b8', muted: '#64748b', dim: '#334155',
    mint: '#22d3a8', pink: '#f472b6', yellow: '#fbbf24', blue: '#60a5fa', red: '#ef4444',
    chipBg: '#1e293b',
    heatBg: '#161b22', heat: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
  },
  light: {
    bg: '#ffffff', surface: '#ffffff', headerBg: '#f1f5f9', border: '#e2e8f0',
    text: '#0f172a', label: '#475569', muted: '#64748b', dim: '#cbd5e1',
    mint: '#0d9488', pink: '#db2777', yellow: '#d97706', blue: '#2563eb', red: '#dc2626',
    chipBg: '#f1f5f9',
    heatBg: '#ebedf0', heat: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
  },
};

// ── update date shown in every terminal header (data refresh timestamp) ──
const UPDATED_DATE = (() => {
  const d = new Date(DATA.generatedAt);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
})();

// ── load skill-icons as base64 data URIs ──────────────────────────────
const iconDataUri = (filename) => {
  const buf = fs.readFileSync(`icons/${filename}`);
  const ext = filename.split('.').pop().toLowerCase();
  const mime = ext === 'png' ? 'image/png' : 'image/svg+xml';
  return `data:${mime};base64,${buf.toString('base64')}`;
};
const ICONS = {
  TypeScript:    iconDataUri('TypeScript.svg'),
  JavaScript:    iconDataUri('JavaScript.svg'),
  NodeJS:        iconDataUri('NodeJS-Dark.svg'),
  NestJS:        iconDataUri('NestJS-Dark.svg'),
  ExpressJS:     iconDataUri('ExpressJS-Dark.svg'),
  Bash:          iconDataUri('Bash-Dark.svg'),
  Jest:          iconDataUri('Jest.svg'),
  Yarn:          iconDataUri('Yarn-Dark.svg'),
  GithubActions: iconDataUri('GithubActions-Dark.svg'),
  GitLab:        iconDataUri('GitLab-Dark.svg'),
  Docker:        iconDataUri('Docker.svg'),
  Kubernetes:    iconDataUri('Kubernetes.svg'),
  MongoDB:       iconDataUri('MongoDB.svg'),
  PostgreSQL:    iconDataUri('PostgreSQL-Dark.svg'),
  MySQL:         iconDataUri('MySQL-Dark.svg'),
  Redis:         iconDataUri('Redis-Dark.svg'),
  SQLite:        iconDataUri('SQLite.svg'),
  Kafka:         iconDataUri('Kafka.svg'),
  MikroORM:      iconDataUri('MikroORM.png'),
  AWS:           iconDataUri('AWS-Dark.svg'),
  GCP:           iconDataUri('GCP-Dark.svg'),
  Nginx:         iconDataUri('Nginx.svg'),
  Argo:          iconDataUri('Argo.svg'),
  Grafana:       iconDataUri('Grafana-Dark.svg'),
  Arduino:       iconDataUri('Arduino.svg'),
  RaspberryPi:   iconDataUri('RaspberryPi-Dark.svg'),
};

// ── shared chrome ─────────────────────────────────────────────────────
const TerminalFrame = (theme, title, page, body) =>
  h('div', { style: {
    width: '1200px', height: '675px', display: 'flex', flexDirection: 'column',
    backgroundColor: theme.bg, fontFamily: 'JetBrains Mono, Inter, Noto Sans KR',
    borderRadius: '12px', overflow: 'hidden',
    border: `1px solid ${theme.border}`,
  } },
    h('div', { style: {
      display: 'flex', alignItems: 'center', height: '38px',
      paddingLeft: '20px', paddingRight: '20px',
      backgroundColor: theme.headerBg, borderBottom: `1px solid ${theme.border}`,
    } },
      h('div', { style: { display: 'flex', gap: '8px' } },
        h('div', { style: { width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#e34c4c' } }),
        h('div', { style: { width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f0bd2e' } }),
        h('div', { style: { width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#1ec45c' } }),
      ),
      h('div', { style: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '8px', fontSize: '13px', color: theme.label, letterSpacing: '0.1em' } },
        h('span', { style: { fontWeight: 700 } }, title),
        h('span', { style: { color: theme.muted, fontWeight: 400 } }, `(${UPDATED_DATE})`),
      ),
      h('div', { style: { fontSize: '12px', color: theme.label, fontFamily: 'JetBrains Mono' } }, page),
    ),
    h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 32px' } }, body),
  );

const Prompt = (theme, cmd) =>
  h('div', { style: { display: 'flex', fontSize: '17px', fontFamily: 'JetBrains Mono', marginBottom: '8px' } },
    h('span', { style: { color: theme.mint, fontWeight: 700 } }, 'yurseria@github'),
    h('span', { style: { color: theme.muted, margin: '0 8px' } }, '$'),
    h('span', { style: { color: theme.text, fontWeight: 700 } }, cmd),
  );

const StdoutLine = (theme, text, color) =>
  h('div', { style: { fontSize: '14px', color: color || theme.muted, fontFamily: 'JetBrains Mono' } }, text);

// ── Card 01: HERO ─────────────────────────────────────────────────────
const HeroCard = (theme) =>
  TerminalFrame(theme, 'profile.sh', '01/05', [
    Prompt(theme, 'whoami && cat profile.json'),
    h('div', { style: { display: 'flex', flexDirection: 'column', marginBottom: '24px' } },
      StdoutLine(theme, '> yurseria'),
      StdoutLine(theme, '> parsing profile...'),
      StdoutLine(theme, '> done.', theme.mint),
    ),

    h('div', { style: { display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' } },
      h('div', { style: { fontSize: '16px', color: theme.label, fontFamily: 'JetBrains Mono', fontWeight: 700, letterSpacing: '0.1em' } }, '$ NAME'),
      h('div', { style: { fontSize: '170px', lineHeight: 0.95, color: theme.text, fontFamily: 'Inter', fontWeight: 900, letterSpacing: '-0.03em' } }, 'yurseria'),
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '14px', marginTop: '18px' } },
        h('div', { style: { width: '6px', height: '34px', backgroundColor: theme.mint } }),
        h('div', { style: { fontSize: '28px', color: theme.text, fontFamily: 'JetBrains Mono', fontWeight: 700 } }, 'Backend Developer'),
        h('div', { style: { fontSize: '28px', color: theme.muted, fontFamily: 'JetBrains Mono' } }, '·'),
        h('div', { style: { fontSize: '28px', color: theme.yellow, fontFamily: 'JetBrains Mono', fontWeight: 700 } }, 'Seoul'),
        h('div', { style: { fontSize: '28px', color: theme.muted, fontFamily: 'JetBrains Mono' } }, '·'),
        h('div', { style: { fontSize: '28px', color: theme.pink, fontFamily: 'JetBrains Mono', fontWeight: 700 } }, 'MSA / Cloud-Native'),
      ),
    ),

    h('div', { style: { display: 'flex', gap: '14px', marginTop: 'auto' } },
      ...[
        { k: 'COMMITS',      v: fmtInt(DATA.lifetime.commits) },
        { k: 'PRs OPENED',   v: fmtInt(DATA.lifetime.prsOpened) },
        { k: 'PRs REVIEWED', v: fmtInt(DATA.lifetime.prsReviewed) },
        { k: 'REPOS',        v: fmtInt(DATA.lifetime.repos) },
        { k: 'LANGUAGES',    v: fmtInt(DATA.lifetime.multiLang) },
      ].map(s =>
        h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 16px', backgroundColor: theme.chipBg, borderRadius: '8px', border: `1px solid ${theme.border}` } },
          h('div', { style: { fontSize: '13px', color: theme.label, fontFamily: 'JetBrains Mono', fontWeight: 700, letterSpacing: '0.1em' } }, s.k),
          h('div', { style: { fontSize: '34px', color: theme.text, fontFamily: 'Inter', fontWeight: 900, marginTop: '2px' } }, s.v),
        ),
      ),
    ),
  ]);

// ── Card 02: TECH STACK (skill-icons) ─────────────────────────────────
// Sorted by yurseria's README priority (top = most important per category)
// Dropped low-priority items: Bash, Yarn, Mocha, NPM, MikroORM, MariaDB, Apache,
//   MQTT, Argo, Backstage, OpenSearch, Datadog, Braze, Amplitude.
const stackRows = [
  { label: 'LANG /\nRUNTIME /\nTEST', items: [
    { name: 'TypeScript', icon: ICONS.TypeScript },
    { name: 'JavaScript', icon: ICONS.JavaScript },
    { name: 'Node.js',    icon: ICONS.NodeJS },
    { name: 'Express',    icon: ICONS.ExpressJS },
    { name: 'NestJS',     icon: ICONS.NestJS },
    { name: 'Jest',       icon: ICONS.Jest },
  ] },
  { label: 'DATA /\nMESSAGING', items: [
    { name: 'MongoDB',    icon: ICONS.MongoDB },
    { name: 'Redis',      icon: ICONS.Redis },
    { name: 'PostgreSQL', icon: ICONS.PostgreSQL },
    { name: 'MySQL',      icon: ICONS.MySQL },
    { name: 'MikroORM',   icon: ICONS.MikroORM },
    { name: 'Kafka',      icon: ICONS.Kafka },
  ] },
  { label: 'CLOUD /\nINFRA', items: [
    { name: 'AWS',        icon: ICONS.AWS },
    { name: 'GCP',        icon: ICONS.GCP },
    { name: 'Docker',     icon: ICONS.Docker },
    { name: 'Kubernetes', icon: ICONS.Kubernetes },
    { name: 'Argo',       icon: ICONS.Argo },
    { name: 'Grafana',    icon: ICONS.Grafana },
  ] },
  { label: 'DELIVERY /\nHARDWARE', items: [
    { name: 'GH Actions',   icon: ICONS.GithubActions },
    { name: 'GitLab',       icon: ICONS.GitLab },
    { name: 'Arduino',      icon: ICONS.Arduino },
    { name: 'Raspberry Pi', icon: ICONS.RaspberryPi },
    null,
    null,
  ] },
];

const StackCard = (theme) =>
  TerminalFrame(theme, 'stack.tsv', '02/05', [
    Prompt(theme, 'cat stack.tsv | sort -k priority'),
    h('div', { style: { display: 'flex', flexDirection: 'column', marginBottom: '18px' } },
      StdoutLine(theme, `> 22 entries · ranked by category, top-priority first`, theme.mint),
    ),
    h('div', { style: { display: 'flex', flexDirection: 'column', flex: 1, gap: '12px' } },
      ...stackRows.map(row =>
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '20px', flex: 1 } },
          h('div', { style: { width: '110px', display: 'flex', flexDirection: 'column' } },
            ...row.label.split('\n').map(l =>
              h('div', { style: { fontSize: '14px', color: theme.label, fontFamily: 'JetBrains Mono', fontWeight: 700, letterSpacing: '0.1em', lineHeight: 1.3 } }, l),
            ),
          ),
          h('div', { style: { display: 'flex', flex: 1, gap: '14px' } },
            ...row.items.map(it =>
              it
                ? h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px', backgroundColor: theme.chipBg, borderRadius: '10px', border: `1px solid ${theme.border}` } },
                    h('img', { src: it.icon, width: 56, height: 56, style: { width: '56px', height: '56px' } }),
                    h('div', { style: { fontSize: '12px', color: theme.text, fontFamily: 'JetBrains Mono', fontWeight: 700, marginTop: '6px' } }, it.name),
                  )
                : h('div', { style: { flex: 1 } }),
            ),
          ),
        ),
      ),
    ),
  ]);

// ── Card 03: TOP 10 LANGUAGES ─────────────────────────────────────────
const fmtBytes = (n) => {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} kB`;
  return `${n} B`;
};
const LANG_LIMIT = 10;
const langs = DATA.languages.slice(0, LANG_LIMIT).map((l) => ({
  name: l.name,
  pct: l.pct,
  color: l.color || '#888888',
  size: fmtBytes(l.size),
}));
const langTotalBytes = DATA.languages.reduce((s, l) => s + l.size, 0);
const langFileCount = DATA.languages.length; // distinct language count
const langSamplingLine = `> sampling ${fmtBytes(langTotalBytes)} across ${fmtInt(DATA.lifetime.repos)} repositories / ${langFileCount} languages...`;
const LangCard = (theme) =>
  TerminalFrame(theme, 'languages.tsv', '03/05', [
    Prompt(theme, `linguist --top ${langs.length} --by size`),
    h('div', { style: { display: 'flex', flexDirection: 'column', marginBottom: '14px' } },
      StdoutLine(theme, langSamplingLine, theme.muted),
      StdoutLine(theme, `> #1 winner: ${langs[0].name} (${langs[0].pct}%)`, theme.mint),
    ),

    h('div', { style: { display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '14px' } },
      h('div', { style: { fontSize: '14px', color: theme.label, fontFamily: 'JetBrains Mono', fontWeight: 700, letterSpacing: '0.1em' } }, 'TOP LANGUAGE'),
      h('div', { style: { width: '20px', height: '20px', borderRadius: '50%', backgroundColor: langs[0].color } }),
      h('div', { style: { fontSize: '80px', color: theme.text, fontFamily: 'Inter', fontWeight: 900, lineHeight: 1 } }, langs[0].name),
      h('div', { style: { fontSize: '44px', color: theme.yellow, fontFamily: 'Inter', fontWeight: 900, marginLeft: 'auto' } }, `${langs[0].pct}%`),
    ),

    // ranked bars — each row flex:1 so they fill the remaining card height evenly
    h('div', { style: { display: 'flex', flexDirection: 'column', flex: 1, gap: '4px', marginTop: '6px' } },
      ...langs.map((l, i) =>
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '14px', flex: 1 } },
          h('div', { style: { width: '32px', fontSize: '18px', color: i === 0 ? theme.yellow : theme.muted, fontFamily: 'Inter', fontWeight: 900, display: 'flex', justifyContent: 'flex-end' } }, String(i + 1)),
          h('div', { style: { width: '14px', height: '14px', borderRadius: '50%', backgroundColor: l.color } }),
          h('div', { style: { width: '160px', fontSize: '18px', color: theme.text, fontFamily: 'JetBrains Mono', fontWeight: 700 } }, l.name),
          h('div', { style: { width: '100px', fontSize: '13px', color: theme.muted, fontFamily: 'JetBrains Mono' } }, l.size),
          h('div', { style: { flex: 1, height: '16px', backgroundColor: theme.chipBg, borderRadius: '4px', overflow: 'hidden', display: 'flex' } },
            h('div', { style: { width: `${l.pct}%`, height: '100%', backgroundColor: l.color, borderRadius: '4px' } }),
          ),
          h('div', { style: { width: '80px', fontSize: '18px', color: theme.text, fontFamily: 'JetBrains Mono', fontWeight: 700, textAlign: 'right', display: 'flex', justifyContent: 'flex-end' } }, `${l.pct.toFixed(1)}%`),
        ),
      ),
    ),
  ]);

// ── Card 04: TROPHIES ─────────────────────────────────────────────────
// Ranks follow github-profile-trophy thresholds.
const rankFor = (value, tiers) => {
  for (const [rank, threshold] of tiers) if (value >= threshold) return rank;
  return 'UNKNOWN';
};
// Tier thresholds mirror ryo-ma/github-profile-trophy. Each tier list runs
// SSS → SS → S → AAA → AA → A → B → C; below C → UNKNOWN.
const TIERS = {
  stars:        [['SSS', 2000], ['SS', 700],  ['S', 200],  ['AAA', 100], ['AA', 50], ['A', 30], ['B', 10], ['C', 1]],
  commits:      [['SSS', 4000], ['SS', 2000], ['S', 1000], ['AAA', 500], ['AA', 200],['A', 100],['B', 10], ['C', 1]],
  followers:    [['SSS', 1000], ['SS', 400],  ['S', 200],  ['AAA', 100], ['AA', 50], ['A', 20], ['B', 10], ['C', 1]],
  issues:       [['SSS', 1000], ['SS', 500],  ['S', 200],  ['AAA', 100], ['AA', 50], ['A', 20], ['B', 10], ['C', 1]],
  pullRequests: [['SSS', 1000], ['SS', 500],  ['S', 200],  ['AAA', 100], ['AA', 50], ['A', 20], ['B', 10], ['C', 1]],
  repositories: [['SSS', 50],   ['SS', 45],   ['S', 40],   ['AAA', 35],  ['AA', 30], ['A', 20], ['B', 10], ['C', 1]],
  reviews:      [['SSS', 70],   ['SS', 57],   ['S', 45],   ['AAA', 30],  ['AA', 20], ['A', 8],  ['B', 3],  ['C', 1]],
  experience:   [['SSS', 70],   ['SS', 55],   ['S', 40],   ['AAA', 28],  ['AA', 18], ['A', 11], ['B', 6],  ['C', 2]],
  // LongTimeUser is a secret single-threshold trophy in ryo-ma; we render it
  // with a synthetic ladder where S triggers at the 10-year mark (Village Elder).
  longTime:     [['SSS', 20],   ['SS', 15],   ['S', 10],   ['AAA', 8],   ['AA', 6],  ['A', 4],  ['B', 2],  ['C', 1]],
};
const T = DATA.trophy || {};
const trophyDefs = [
  { cat: 'COMMITS',        glyph: 'commits',    rank: rankFor(T.commits      ?? 0, TIERS.commits),      count: fmtInt(T.commits      ?? 0), desc: 'Commits (1y, incl. private)' },
  { cat: 'PULL REQUEST',   glyph: 'pr',         rank: rankFor(T.pullRequests ?? 0, TIERS.pullRequests), count: fmtInt(T.pullRequests ?? 0), desc: 'Pull requests authored' },
  { cat: 'REVIEWS',        glyph: 'review',     rank: rankFor(T.reviews      ?? 0, TIERS.reviews),      count: fmtInt(T.reviews      ?? 0), desc: 'Reviews left (1y)' },
  { cat: 'ISSUES',         glyph: 'issues',     rank: rankFor(T.issues       ?? 0, TIERS.issues),       count: fmtInt(T.issues       ?? 0), desc: 'Issues opened' },
  { cat: 'STARS',          glyph: 'stars',      rank: rankFor(T.stars        ?? 0, TIERS.stars),        count: fmtInt(T.stars        ?? 0), desc: 'Stars received' },
  { cat: 'FOLLOWERS',      glyph: 'followers',  rank: rankFor(T.followers    ?? 0, TIERS.followers),    count: fmtInt(T.followers    ?? 0), desc: 'GitHub followers' },
  { cat: 'REPOSITORIES',   glyph: 'repos',      rank: rankFor(T.repositories ?? 0, TIERS.repositories), count: fmtInt(T.repositories ?? 0), desc: 'Public repositories' },
  { cat: 'EXPERIENCE',     glyph: 'experience', rank: rankFor(T.experience   ?? 0, TIERS.experience),   count: `${T.experience ?? 0} pt`,   desc: 'Account longevity score' },
  { cat: 'LONG-TIME USER', glyph: 'longtime',   rank: rankFor(T.longTimeYears?? 0, TIERS.longTime),     count: `${T.longTimeYears ?? 0} yr`,desc: 'Years since first activity' },
];
// Sort highest rank first so SSS/SS/S land in the top row of the 3×3 grid.
const RANK_WEIGHTS = { SSS: 8, SS: 7, S: 6, AAA: 5, AA: 4, A: 3, B: 2, C: 1, UNKNOWN: 0 };
const trophies = [...trophyDefs].sort((a, b) => RANK_WEIGHTS[b.rank] - RANK_WEIGHTS[a.rank]);

const rankColor = (theme, rank) => {
  // SSS = legendary gold, SS = magenta, S = violet (top tier)
  // AAA = mint, AA = teal-green, A = blue (mid tier)
  // B/C = grey (low tier)
  if (rank === 'SSS') return { bg: '#fbbf24', fg: '#0a0e1a' };
  if (rank === 'SS')  return { bg: '#f472b6', fg: '#0a0e1a' };
  if (rank === 'S')   return { bg: '#a78bfa', fg: '#0a0e1a' };
  if (rank === 'AAA') return { bg: '#22d3a8', fg: '#0a0e1a' };
  if (rank === 'AA')  return { bg: '#34d399', fg: '#0a0e1a' };
  if (rank === 'A')   return { bg: '#60a5fa', fg: '#0a0e1a' };
  if (rank === 'B')   return { bg: '#94a3b8', fg: theme.bg };
  if (rank === 'C')   return { bg: theme.dim, fg: theme.muted };
  return { bg: theme.dim, fg: theme.muted };
};

// ── laurel wreath watermark (loaded from laurel-wreath.svg) ────────────
const LAUREL_PATHS = (() => {
  const raw = fs.readFileSync(new URL('./laurel-wreath.svg', import.meta.url), 'utf8');
  const paths = raw.match(/<path[\s\S]*?\/>/g) || [];
  // drop the background rectangle (very high brightness fills like #FDFDFD)
  return paths.filter(p => !/fill="#[EeFf][0-9A-Fa-f][EeFf][0-9A-Fa-f][EeFf][0-9A-Fa-f]"/i.test(p));
})();
const laurelWreathSvg = (color) => {
  // replace every fill regardless of the original color value
  const colored = LAUREL_PATHS.map(p => p.replace(/fill="#[0-9A-Fa-f]{6}"/g, `fill="${color}"`)).join('');
  const svg = `<svg viewBox="0 0 1254 1254" xmlns="http://www.w3.org/2000/svg">${colored}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

const RANK_HAS_WREATH = new Set(['SSS', 'SS', 'S']);
// scale watermark font down for longer rank strings so visual size stays similar
const rankFontSize = (rank) => ({ 1: 88, 2: 70, 3: 56 }[rank.length] || 72);

// ── trophy category pictograms (single-stroke geometric, rank-colored) ─
const trophyGlyphSvg = (kind, color) => {
  const s = `stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  const paths = {
    commits:    `<circle cx="12" cy="12" r="3.2" ${s}/><path d="M2 12h6.8M15.2 12H22" ${s}/>`,
    pr:         `<circle cx="6" cy="5" r="2" ${s}/><circle cx="6" cy="19" r="2" ${s}/><circle cx="18" cy="19" r="2" ${s}/><path d="M6 7v10M6 7c0 6 6 6 12 6v4" ${s}/>`,
    review:     `<path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" ${s}/><circle cx="12" cy="12" r="2.6" ${s}/>`,
    experience: `<circle cx="12" cy="12" r="9" ${s}/><path d="M12 7v5l3.5 2" ${s}/>`,
    repos:      `<path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" ${s}/>`,
    langs:      `<circle cx="12" cy="12" r="9" ${s}/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" ${s}/>`,
    stars:      `<path d="M12 3l2.7 5.7 6.3.9-4.6 4.4 1.1 6.3L12 17.4l-5.5 2.9 1.1-6.3L3 9.6l6.3-.9z" ${s}/>`,
    issues:     `<circle cx="12" cy="12" r="9" ${s}/><path d="M12 7.5v5" ${s}/><circle cx="12" cy="16" r="0.5" fill="${color}"/>`,
    followers:  `<circle cx="9" cy="9" r="3.2" ${s}/><circle cx="16.5" cy="9.5" r="2.4" ${s}/><path d="M3 19c0-3.4 3-5.4 6-5.4s6 2 6 5.4" ${s}/><path d="M14.5 16.2c2.8-.3 5.5 1 6.5 3.3" ${s}/>`,
    longtime:   `<path d="M7 3h10v4l-4.5 5L17 17v4H7v-4l4.5-5L7 7z" ${s}/><path d="M9 4.5h6M9 19.5h6" ${s}/>`,
  };
  return `data:image/svg+xml;base64,${Buffer.from(`<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${paths[kind]}</svg>`).toString('base64')}`;
};

const TrophyCard_ = (theme, t) => {
  const c = rankColor(theme, t.rank);
  const glyph = trophyGlyphSvg(t.glyph, c.bg);
  const hasWreath = RANK_HAS_WREATH.has(t.rank);
  const watermarkColor = theme.label;
  const wreath = hasWreath ? laurelWreathSvg(watermarkColor) : null;
  return h('div', { style: {
    flex: 1, display: 'flex', flexDirection: 'column',
    padding: '14px 16px', backgroundColor: theme.chipBg,
    borderRadius: '10px', border: `1px solid ${theme.border}`,
    position: 'relative', overflow: 'hidden',
  } },
    // watermark layer: laurel wreath (S+) + giant rank letter, faded grey
    h('div', { style: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: 0.05,
    } },
      h('div', { style: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '180px', height: '160px' } },
        hasWreath ? h('img', { src: wreath, width: 180, height: 160, style: { position: 'absolute', top: 0, left: 0 } }) : null,
        h('div', { style: {
          fontSize: `${rankFontSize(t.rank)}px`,
          fontFamily: 'Inter', fontWeight: 900,
          color: watermarkColor, letterSpacing: '-0.04em', lineHeight: 1,
          display: 'flex',
        } }, t.rank),
      ),
    ),
    // foreground content
    h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
      h('div', { style: { fontSize: '13px', color: theme.label, fontFamily: 'JetBrains Mono', fontWeight: 700, letterSpacing: '0.1em' } }, `[ ${t.cat} ]`),
      h('div', { style: {
        padding: '3px 10px', fontSize: '14px',
        backgroundColor: c.bg, color: c.fg,
        fontFamily: 'Inter', fontWeight: 900, letterSpacing: '0.1em',
        borderRadius: '6px',
      } }, t.rank),
    ),
    h('div', { style: { fontSize: '44px', color: theme.text, fontFamily: 'Inter', fontWeight: 900, lineHeight: 1.05, marginTop: '6px' } }, t.count),
    h('div', { style: { fontSize: '11px', color: theme.muted, fontFamily: 'JetBrains Mono', marginTop: '4px' } }, t.desc),
    h('img', { src: glyph, width: 52, height: 52, style: { position: 'absolute', right: '12px', bottom: '10px', opacity: 0.9 } }),
  );
};

const TrophiesCard = (theme) =>
  TerminalFrame(theme, 'trophies.tsv', '04/05', [
    Prompt(theme, 'gh-trophy --user yurseria --rank-all'),
    h('div', { style: { display: 'flex', flexDirection: 'column', marginBottom: '18px' } },
      StdoutLine(theme, `> ${trophies.length} categories · sorted by rank · github-profile-trophy parity`, theme.mint),
    ),
    h('div', { style: { display: 'flex', flexDirection: 'column', flex: 1, gap: '12px' } },
      h('div', { style: { display: 'flex', gap: '12px', flex: 1 } }, ...trophies.slice(0, 3).map(t => TrophyCard_(theme, t))),
      h('div', { style: { display: 'flex', gap: '12px', flex: 1 } }, ...trophies.slice(3, 6).map(t => TrophyCard_(theme, t))),
      h('div', { style: { display: 'flex', gap: '12px', flex: 1 } }, ...trophies.slice(6, 9).map(t => TrophyCard_(theme, t))),
    ),
  ]);

// ── Card 05: CONTRIBUTION ─────────────────────────────────────────────
// Build heatmap from GitHub's contributionCalendar.weeks (last 52 weeks).
// Each week has up to 7 contributionDays { date, contributionCount, weekday }.
// We bucket counts into 5 intensity levels using quantiles over non-zero days.
const buildCalendarGrid = (weeks) => {
  // Trim to the most recent 52 weeks if more are returned.
  const trimmed = weeks.slice(-52);
  // Compute quantile thresholds over positive counts so empty days stay at 0.
  const positives = [];
  for (const w of trimmed) for (const d of w.contributionDays) {
    if (d.contributionCount > 0) positives.push(d.contributionCount);
  }
  positives.sort((a, b) => a - b);
  const q = (p) => positives.length ? positives[Math.min(positives.length - 1, Math.floor(positives.length * p))] : 1;
  const t1 = q(0.25), t2 = q(0.55), t3 = q(0.80);
  const intensity = (c) => {
    if (c <= 0) return 0;
    if (c <= t1) return 1;
    if (c <= t2) return 2;
    if (c <= t3) return 3;
    return 4;
  };
  // Pad each week's days to 7 (start of timeline may have <7 days from GitHub).
  const grid = trimmed.map((w) => {
    const col = new Array(7).fill(0);
    for (const d of w.contributionDays) col[d.weekday] = intensity(d.contributionCount);
    return col;
  });
  // Pad week columns to 52 if fewer.
  while (grid.length < 52) grid.unshift(new Array(7).fill(0));
  return grid;
};

const computeContribStats = (weeks) => {
  const trimmed = weeks.slice(-52);
  const days = [];
  for (const w of trimmed) for (const d of w.contributionDays) {
    days.push({ date: d.date, count: d.contributionCount });
  }
  let longest = 0, run = 0;
  for (const d of days) {
    if (d.count > 0) { run++; longest = Math.max(longest, run); } else { run = 0; }
  }
  let current = 0;
  for (let i = days.length - 1; i >= 0 && days[i].count > 0; i--) current++;
  const total = days.reduce((s, d) => s + d.count, 0);
  const avg = days.length ? total / days.length : 0;
  return { current, longest, total, avg };
};

const monthLabelsFromWeeks = (weeks) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const trimmed = weeks.slice(-52);
  const labels = new Array(52).fill('');
  let lastMonth = -1;
  for (let i = 0; i < trimmed.length; i++) {
    const firstDay = trimmed[i].contributionDays[0];
    if (!firstDay) continue;
    const m = new Date(firstDay.date).getUTCMonth();
    if (m !== lastMonth) {
      labels[52 - trimmed.length + i] = months[m];
      lastMonth = m;
    }
  }
  return labels;
};

// last-30-day daily contribution series (chronological order)
const last30FromWeeks = (weeks) => {
  const all = [];
  for (const w of weeks) for (const d of w.contributionDays) all.push(d);
  return all.slice(-30);
};

// daily series → smooth line chart SVG (polyline + soft area fill + dots)
const lineChartSvg = (color, values, vMax, w, h) => {
  const padX = 6, padTop = 6, padBottom = 4;
  const innerW = w - 2 * padX;
  const innerH = h - padTop - padBottom;
  const max = Math.max(1, vMax);
  const points = values.map((v, i) => {
    const x = padX + (innerW * i) / Math.max(1, values.length - 1);
    const y = padTop + innerH - (innerH * v) / max;
    return { x: +x.toFixed(1), y: +y.toFixed(1) };
  });
  const lineD = points.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
  const baseline = (padTop + innerH).toFixed(1);
  const areaD = `${lineD} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;
  const dots = points.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="2.5" fill="${color}"/>`).join('');
  const svg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">` +
    `<path d="${areaD}" fill="${color}" fill-opacity="0.16"/>` +
    `<path d="${lineD}" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
    dots +
    `</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

const ContribCard = (theme) => {
  const weeks = DATA.contributionCalendar.weeks;
  const grid = buildCalendarGrid(weeks);
  const monthLabels = monthLabelsFromWeeks(weeks);
  const stats = computeContribStats(weeks);
  const totalLastYear = fmtInt(DATA.contributionCalendar.totalContributions);
  const avgPerDay = stats.avg.toFixed(1);
  const last30 = last30FromWeeks(weeks);
  const last30Counts = last30.map(d => d.contributionCount);
  const last30Max = Math.max(1, ...last30Counts);
  const last30Total = last30Counts.reduce((s, n) => s + n, 0);
  const last30Peak = Math.max(0, ...last30Counts);
  const CHART_W = 1108; // card inner width (1136) minus the 28px paddingLeft
  const CHART_H = 110;
  const lineChart = lineChartSvg(theme.blue, last30Counts, last30Max, CHART_W, CHART_H);
  return TerminalFrame(theme, 'contributions.log', '05/05', [
    Prompt(theme, 'git log --since=1.year --pretty=oneline | wc -l'),
    h('div', { style: { display: 'flex', flexDirection: 'column', marginBottom: '14px' } },
      StdoutLine(theme, `> aggregating contributions across ${fmtInt(DATA.lifetime.repos)} repositories...`),
      StdoutLine(theme, '> done.', theme.mint),
    ),

    h('div', { style: { display: 'flex', alignItems: 'flex-end', gap: '40px', marginBottom: '30px' } },
      h('div', { style: { display: 'flex', flexDirection: 'column' } },
        h('div', { style: { fontSize: '15px', color: theme.label, fontFamily: 'JetBrains Mono', fontWeight: 700, letterSpacing: '0.1em' } }, 'LAST 12 MONTHS'),
        h('div', { style: { fontSize: '120px', lineHeight: 0.95, color: theme.yellow, fontFamily: 'Inter', fontWeight: 900 } }, totalLastYear),
      ),
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' } },
        h('div', { style: { display: 'flex', gap: '24px' } },
          h('div', { style: { display: 'flex', flexDirection: 'column' } },
            h('div', { style: { fontSize: '13px', color: theme.label, fontFamily: 'JetBrains Mono', fontWeight: 700, letterSpacing: '0.1em' } }, 'CURRENT STREAK'),
            h('div', { style: { fontSize: '36px', color: theme.mint, fontFamily: 'Inter', fontWeight: 900 } }, `${stats.current} days`),
          ),
          h('div', { style: { display: 'flex', flexDirection: 'column' } },
            h('div', { style: { fontSize: '13px', color: theme.label, fontFamily: 'JetBrains Mono', fontWeight: 700, letterSpacing: '0.1em' } }, 'LONGEST STREAK'),
            h('div', { style: { fontSize: '36px', color: theme.pink, fontFamily: 'Inter', fontWeight: 900 } }, `${stats.longest} days`),
          ),
          h('div', { style: { display: 'flex', flexDirection: 'column' } },
            h('div', { style: { fontSize: '13px', color: theme.label, fontFamily: 'JetBrains Mono', fontWeight: 700, letterSpacing: '0.1em' } }, 'AVG / DAY'),
            h('div', { style: { fontSize: '36px', color: theme.blue, fontFamily: 'Inter', fontWeight: 900 } }, avgPerDay),
          ),
        ),
      ),
    ),

    // last-30-day daily line chart
    h('div', { style: { display: 'flex', flexDirection: 'column', marginBottom: '28px' } },
      h('div', { style: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '8px' } },
        h('div', { style: { fontSize: '13px', color: theme.label, fontFamily: 'JetBrains Mono', fontWeight: 700, letterSpacing: '0.1em' } }, 'LAST 30 DAYS · DAILY'),
        h('div', { style: { display: 'flex', gap: '14px', fontSize: '12px', fontFamily: 'JetBrains Mono', fontWeight: 700, color: theme.label } },
          h('div', { style: { display: 'flex', gap: '4px' } },
            h('span', { style: { color: theme.muted } }, 'peak'),
            h('span', { style: { color: theme.blue } }, String(last30Peak)),
          ),
          h('div', { style: { display: 'flex', gap: '4px' } },
            h('span', { style: { color: theme.muted } }, 'total'),
            h('span', { style: { color: theme.text } }, fmtInt(last30Total)),
          ),
        ),
      ),
      h('div', { style: { display: 'flex', paddingLeft: '28px' } },
        h('img', { src: lineChart, width: CHART_W, height: CHART_H, style: { display: 'block' } }),
      ),
      h('div', { style: { display: 'flex', justifyContent: 'space-between', marginTop: '4px', paddingLeft: '28px', fontSize: '11px', color: theme.muted, fontFamily: 'JetBrains Mono', fontWeight: 700 } },
        h('div', {}, '-29d'),
        h('div', {}, 'today'),
      ),
    ),

    // heatmap
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } },
      // month labels derived from contributionCalendar (label at the first week of each month)
      h('div', { style: { display: 'flex', height: '16px', marginBottom: '4px', marginLeft: '28px' } },
        ...monthLabels.map((m) =>
          h('div', { style: { flex: 1, fontSize: '13px', color: theme.label, fontFamily: 'JetBrains Mono', fontWeight: 700, display: 'flex', justifyContent: 'flex-start' } }, m),
        ),
      ),
      h('div', { style: { display: 'flex', gap: '4px' } },
        // day labels column
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px', width: '24px' } },
          ...['', 'Mon', '', 'Wed', '', 'Fri', ''].map(d =>
            h('div', { style: { height: '14px', fontSize: '12px', color: theme.label, fontFamily: 'JetBrains Mono', fontWeight: 700 } }, d),
          ),
        ),
        // heatmap cells
        h('div', { style: { display: 'flex', flex: 1, gap: '4px' } },
          ...grid.map(col =>
            h('div', { style: { display: 'flex', flexDirection: 'column', flex: 1, gap: '4px' } },
              ...col.map(v =>
                h('div', { style: { width: '14px', height: '14px', borderRadius: '3px', backgroundColor: theme.heat[v] } }),
              ),
            ),
          ),
        ),
      ),
      // legend
      h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '6px' } },
        h('div', { style: { fontSize: '12px', color: theme.label, fontFamily: 'JetBrains Mono', fontWeight: 700, marginRight: '4px' } }, 'less'),
        ...theme.heat.map(c => h('div', { style: { width: '12px', height: '12px', borderRadius: '3px', backgroundColor: c } })),
        h('div', { style: { fontSize: '12px', color: theme.label, fontFamily: 'JetBrains Mono', fontWeight: 700, marginLeft: '4px' } }, 'more'),
      ),
    ),
  ]);
};

// ── render all ────────────────────────────────────────────────────────
const renderers = {
  '01-hero':    HeroCard,
  '02-stack':   StackCard,
  '03-langs':   LangCard,
  '04-trophy':  TrophiesCard,
  '05-contrib': ContribCard,
};

const oIdx = process.argv.indexOf('-o');
const outDir = oIdx !== -1
  ? new URL(`file://${path.resolve(process.argv[oIdx + 1])}/`)
  : new URL('../recap/', import.meta.url);
fs.mkdirSync(outDir, { recursive: true });

let failures = 0;
for (const [key, Render] of Object.entries(renderers)) {
  for (const themeName of ['dark', 'light']) {
    try {
      const tree = Render(themes[themeName]);
      const svg = await satori(tree, { width: 1200, height: 675, fonts });
      const svgUrl = new URL(`./${key}-${themeName}.svg`, outDir);
      fs.writeFileSync(svgUrl, svg);
      console.log(`wrote ${svgUrl.pathname}`);
    } catch (e) {
      failures++;
      console.error(`FAIL ${key} (${themeName}): ${e.message}`);
    }
  }
}
if (failures) process.exit(1);
