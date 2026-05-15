import satori from 'satori';
import fs from 'node:fs';

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
    text: '#e2e8f0', muted: '#64748b', dim: '#334155',
    mint: '#22d3a8', pink: '#f472b6', yellow: '#fbbf24', blue: '#60a5fa', red: '#ef4444',
    chipBg: '#1e293b',
    heatBg: '#161b22', heat: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
  },
  light: {
    bg: '#ffffff', surface: '#ffffff', headerBg: '#f1f5f9', border: '#e2e8f0',
    text: '#0f172a', muted: '#64748b', dim: '#cbd5e1',
    mint: '#0d9488', pink: '#db2777', yellow: '#d97706', blue: '#2563eb', red: '#dc2626',
    chipBg: '#f1f5f9',
    heatBg: '#ebedf0', heat: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
  },
};

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
      h('div', { style: { flex: 1, display: 'flex', justifyContent: 'center', fontSize: '13px', color: theme.muted, letterSpacing: '0.1em' } }, title),
      h('div', { style: { fontSize: '12px', color: theme.muted, fontFamily: 'JetBrains Mono' } }, page),
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
      h('div', { style: { fontSize: '14px', color: theme.muted, fontFamily: 'JetBrains Mono', letterSpacing: '0.2em' } }, '$ NAME'),
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
          h('div', { style: { fontSize: '11px', color: theme.muted, fontFamily: 'JetBrains Mono', fontWeight: 700, letterSpacing: '0.18em' } }, s.k),
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
              h('div', { style: { fontSize: '12px', color: theme.muted, fontFamily: 'JetBrains Mono', fontWeight: 700, letterSpacing: '0.2em', lineHeight: 1.3 } }, l),
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

// ── Card 03: TOP 5 LANGUAGES ──────────────────────────────────────────
const fmtBytes = (n) => {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} kB`;
  return `${n} B`;
};
const langs = DATA.languages.slice(0, 5).map((l) => ({
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
    Prompt(theme, 'linguist --top 5 --by size'),
    h('div', { style: { display: 'flex', flexDirection: 'column', marginBottom: '20px' } },
      StdoutLine(theme, langSamplingLine, theme.muted),
      StdoutLine(theme, `> #1 winner: ${langs[0].name} (${langs[0].pct}%)`, theme.mint),
    ),

    h('div', { style: { display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '14px' } },
      h('div', { style: { fontSize: '14px', color: theme.muted, fontFamily: 'JetBrains Mono', fontWeight: 700, letterSpacing: '0.2em' } }, 'TOP LANGUAGE'),
      h('div', { style: { width: '20px', height: '20px', borderRadius: '50%', backgroundColor: langs[0].color } }),
      h('div', { style: { fontSize: '80px', color: theme.text, fontFamily: 'Inter', fontWeight: 900, lineHeight: 1 } }, langs[0].name),
      h('div', { style: { fontSize: '44px', color: theme.yellow, fontFamily: 'Inter', fontWeight: 900, marginLeft: 'auto' } }, `${langs[0].pct}%`),
    ),

    // bars
    h('div', { style: { display: 'flex', flexDirection: 'column', flex: 1, gap: '10px', marginTop: '12px' } },
      ...langs.map((l, i) =>
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '14px' } },
          h('div', { style: { width: '32px', fontSize: '20px', color: i === 0 ? theme.yellow : theme.muted, fontFamily: 'Inter', fontWeight: 900 } }, String(i + 1)),
          h('div', { style: { width: '14px', height: '14px', borderRadius: '50%', backgroundColor: l.color } }),
          h('div', { style: { width: '160px', fontSize: '20px', color: theme.text, fontFamily: 'JetBrains Mono', fontWeight: 700 } }, l.name),
          h('div', { style: { width: '110px', fontSize: '14px', color: theme.muted, fontFamily: 'JetBrains Mono' } }, l.size),
          h('div', { style: { flex: 1, height: '20px', backgroundColor: theme.chipBg, borderRadius: '4px', overflow: 'hidden', display: 'flex' } },
            h('div', { style: { width: `${l.pct}%`, height: '100%', backgroundColor: l.color, borderRadius: '4px' } }),
          ),
          h('div', { style: { width: '80px', fontSize: '20px', color: theme.text, fontFamily: 'JetBrains Mono', fontWeight: 700, textAlign: 'right', display: 'flex', justifyContent: 'flex-end' } }, `${l.pct.toFixed(1)}%`),
        ),
      ),
    ),
  ]);

// ── Card 04: TROPHIES ─────────────────────────────────────────────────
// Ranks follow github-profile-trophy thresholds.
const rankFor = (value, tiers) => {
  for (const [rank, threshold] of tiers) if (value >= threshold) return rank;
  return 'C';
};
const TIERS = {
  commits:    [['SSS', 4000], ['SS', 2000], ['S', 1000], ['AAA', 500], ['AA', 200], ['A', 100], ['B', 50]],
  prIssue:    [['SSS', 1000], ['SS', 500],  ['S', 200],  ['AAA', 100], ['AA', 50],  ['A', 25],  ['B', 10]],
  repos:      [['SSS', 100],  ['SS', 50],   ['S', 30],   ['AAA', 15],  ['AA', 10],  ['A', 5],   ['B', 2]],
  stars:      [['SSS', 2000], ['SS', 1000], ['S', 500],  ['AAA', 200], ['AA', 100], ['A', 50],  ['B', 10]],
  experience: [['SSS', 15],   ['SS', 10],   ['S', 7],    ['AAA', 5],   ['AA', 4],   ['A', 3],   ['B', 1]],
  multiLang:  [['SSS', 30],   ['SS', 20],   ['S', 15],   ['AAA', 10],  ['AA', 8],   ['A', 6],   ['B', 4]],
};
const L = DATA.lifetime;
const trophies = [
  { cat: 'COMMITS',     rank: rankFor(L.commits,         TIERS.commits),    count: fmtInt(L.commits),               desc: 'Total commits' },
  { cat: 'PR · OPENED', rank: rankFor(L.prsOpened,       TIERS.prIssue),    count: fmtInt(L.prsOpened),             desc: 'Pull requests authored' },
  { cat: 'PR · REVIEW', rank: rankFor(L.prsReviewed,     TIERS.prIssue),    count: fmtInt(L.prsReviewed),           desc: 'Reviews left' },
  { cat: 'EXPERIENCE',  rank: rankFor(L.experienceYears, TIERS.experience), count: `${L.experienceYears} yr`,       desc: 'Active years on GitHub' },
  { cat: 'REPOS',       rank: rankFor(L.repos,           TIERS.repos),      count: fmtInt(L.repos),                 desc: 'Public repositories' },
  { cat: 'MULTI-LANG',  rank: rankFor(L.multiLang,       TIERS.multiLang),  count: fmtInt(L.multiLang),             desc: 'Languages shipped' },
  { cat: 'STARS',       rank: rankFor(L.stars,           TIERS.stars),      count: fmtInt(L.stars),                 desc: 'Stars received' },
  { cat: 'ISSUES',      rank: rankFor(L.issues,          TIERS.prIssue),    count: fmtInt(L.issues),                desc: 'Issues opened' },
];

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
  return { bg: theme.dim, fg: theme.muted };
};

const TrophyCard_ = (theme, t) => {
  const c = rankColor(theme, t.rank);
  return h('div', { style: {
    flex: 1, display: 'flex', flexDirection: 'column',
    padding: '14px 16px', backgroundColor: theme.chipBg,
    borderRadius: '10px', border: `1px solid ${theme.border}`,
    position: 'relative',
  } },
    h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
      h('div', { style: { fontSize: '11px', color: theme.muted, fontFamily: 'JetBrains Mono', fontWeight: 700, letterSpacing: '0.18em' } }, `[ ${t.cat} ]`),
      h('div', { style: {
        padding: '3px 10px', fontSize: '14px',
        backgroundColor: c.bg, color: c.fg,
        fontFamily: 'Inter', fontWeight: 900, letterSpacing: '0.1em',
        borderRadius: '6px',
      } }, t.rank),
    ),
    h('div', { style: { fontSize: '54px', color: theme.text, fontFamily: 'Inter', fontWeight: 900, lineHeight: 1.05, marginTop: '8px' } }, t.count),
    h('div', { style: { fontSize: '12px', color: theme.muted, fontFamily: 'JetBrains Mono', marginTop: '6px' } }, t.desc),
  );
};

const TrophiesCard = (theme) =>
  TerminalFrame(theme, 'trophies.tsv', '04/05', [
    Prompt(theme, 'gh-trophy --user yurseria --rank-all'),
    h('div', { style: { display: 'flex', flexDirection: 'column', marginBottom: '18px' } },
      StdoutLine(theme, '> 8 categories · ranks computed from totals', theme.mint),
    ),
    h('div', { style: { display: 'flex', flexDirection: 'column', flex: 1, gap: '14px' } },
      h('div', { style: { display: 'flex', gap: '14px', flex: 1 } }, ...trophies.slice(0, 4).map(t => TrophyCard_(theme, t))),
      h('div', { style: { display: 'flex', gap: '14px', flex: 1 } }, ...trophies.slice(4, 8).map(t => TrophyCard_(theme, t))),
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

const ContribCard = (theme) => {
  const weeks = DATA.contributionCalendar.weeks;
  const grid = buildCalendarGrid(weeks);
  const monthLabels = monthLabelsFromWeeks(weeks);
  const stats = computeContribStats(weeks);
  const totalLastYear = fmtInt(DATA.contributionCalendar.totalContributions);
  const avgPerDay = stats.avg.toFixed(1);
  return TerminalFrame(theme, 'contributions.log', '05/05', [
    Prompt(theme, 'git log --since=1.year --pretty=oneline | wc -l'),
    h('div', { style: { display: 'flex', flexDirection: 'column', marginBottom: '14px' } },
      StdoutLine(theme, `> aggregating contributions across ${fmtInt(DATA.lifetime.repos)} repositories...`),
      StdoutLine(theme, '> done.', theme.mint),
    ),

    h('div', { style: { display: 'flex', alignItems: 'flex-end', gap: '40px', marginBottom: '20px' } },
      h('div', { style: { display: 'flex', flexDirection: 'column' } },
        h('div', { style: { fontSize: '13px', color: theme.muted, fontFamily: 'JetBrains Mono', fontWeight: 700, letterSpacing: '0.2em' } }, 'LAST 12 MONTHS'),
        h('div', { style: { fontSize: '120px', lineHeight: 0.95, color: theme.yellow, fontFamily: 'Inter', fontWeight: 900 } }, totalLastYear),
      ),
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' } },
        h('div', { style: { display: 'flex', gap: '24px' } },
          h('div', { style: { display: 'flex', flexDirection: 'column' } },
            h('div', { style: { fontSize: '11px', color: theme.muted, fontFamily: 'JetBrains Mono', fontWeight: 700, letterSpacing: '0.18em' } }, 'CURRENT STREAK'),
            h('div', { style: { fontSize: '36px', color: theme.mint, fontFamily: 'Inter', fontWeight: 900 } }, `${stats.current} days`),
          ),
          h('div', { style: { display: 'flex', flexDirection: 'column' } },
            h('div', { style: { fontSize: '11px', color: theme.muted, fontFamily: 'JetBrains Mono', fontWeight: 700, letterSpacing: '0.18em' } }, 'LONGEST STREAK'),
            h('div', { style: { fontSize: '36px', color: theme.pink, fontFamily: 'Inter', fontWeight: 900 } }, `${stats.longest} days`),
          ),
          h('div', { style: { display: 'flex', flexDirection: 'column' } },
            h('div', { style: { fontSize: '11px', color: theme.muted, fontFamily: 'JetBrains Mono', fontWeight: 700, letterSpacing: '0.18em' } }, 'AVG / DAY'),
            h('div', { style: { fontSize: '36px', color: theme.blue, fontFamily: 'Inter', fontWeight: 900 } }, avgPerDay),
          ),
        ),
      ),
    ),

    // heatmap
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } },
      // month labels derived from contributionCalendar (label at the first week of each month)
      h('div', { style: { display: 'flex', height: '14px', marginBottom: '4px', marginLeft: '24px' } },
        ...monthLabels.map((m) =>
          h('div', { style: { flex: 1, fontSize: '11px', color: theme.muted, fontFamily: 'JetBrains Mono', fontWeight: 700, display: 'flex', justifyContent: 'flex-start' } }, m),
        ),
      ),
      h('div', { style: { display: 'flex', gap: '4px' } },
        // day labels column
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px', width: '20px' } },
          ...['', 'Mon', '', 'Wed', '', 'Fri', ''].map(d =>
            h('div', { style: { height: '14px', fontSize: '11px', color: theme.muted, fontFamily: 'JetBrains Mono', fontWeight: 700 } }, d),
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
        h('div', { style: { fontSize: '11px', color: theme.muted, fontFamily: 'JetBrains Mono', fontWeight: 700, marginRight: '4px' } }, 'less'),
        ...theme.heat.map(c => h('div', { style: { width: '12px', height: '12px', borderRadius: '3px', backgroundColor: c } })),
        h('div', { style: { fontSize: '11px', color: theme.muted, fontFamily: 'JetBrains Mono', fontWeight: 700, marginLeft: '4px' } }, 'more'),
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

const outDir = new URL('../recap/', import.meta.url);
fs.mkdirSync(outDir, { recursive: true });

let failures = 0;
for (const [key, Render] of Object.entries(renderers)) {
  for (const themeName of ['dark', 'light']) {
    try {
      const tree = Render(themes[themeName]);
      const svg = await satori(tree, { width: 1200, height: 675, fonts });
      fs.writeFileSync(new URL(`./${key}-${themeName}.svg`, outDir), svg);
      console.log(`wrote recap/${key}-${themeName}.svg`);
    } catch (e) {
      failures++;
      console.error(`FAIL ${key} (${themeName}): ${e.message}`);
    }
  }
}
if (failures) process.exit(1);
