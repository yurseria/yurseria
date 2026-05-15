import { graphql } from '@octokit/graphql';
import { Octokit } from '@octokit/rest';
import fs from 'node:fs';

const USERNAME = process.env.RECAP_USER || 'yurseria';
const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error('GITHUB_TOKEN env var is required');
  process.exit(1);
}

const gql = graphql.defaults({ headers: { authorization: `bearer ${TOKEN}` } });
const octokit = new Octokit({ auth: TOKEN });

const now = new Date();
const yearAgo = new Date(now.getTime() - 365 * 24 * 3600 * 1000);

// ── 1. user profile + repos + last-year contribution calendar ────────────
const baseQuery = `
  query($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      createdAt
      repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC, isFork: false) {
        totalCount
        nodes {
          name
          stargazerCount
          languages(first: 20, orderBy: { field: SIZE, direction: DESC }) {
            edges { size node { name color } }
          }
        }
      }
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays { date contributionCount weekday }
          }
        }
      }
    }
  }
`;

const base = await gql(baseQuery, {
  login: USERNAME,
  from: yearAgo.toISOString(),
  to: now.toISOString(),
});

const user = base.user;
const createdAt = new Date(user.createdAt);

// ── 2. lifetime commit total: contributionsCollection caps at 1 year, iterate ──
const yearCommitQuery = `
  query($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
      }
    }
  }
`;

let lifetimeCommits = 0;
for (let year = createdAt.getFullYear(); year <= now.getFullYear(); year++) {
  const from = year === createdAt.getFullYear()
    ? createdAt
    : new Date(Date.UTC(year, 0, 1));
  const to = year === now.getFullYear()
    ? now
    : new Date(Date.UTC(year, 11, 31, 23, 59, 59));
  const r = await gql(yearCommitQuery, {
    login: USERNAME,
    from: from.toISOString(),
    to: to.toISOString(),
  });
  lifetimeCommits += r.user.contributionsCollection.totalCommitContributions;
}

// ── 3. lifetime PR/issue counts via search ────────────────────────────────
const searchCount = async (q) => {
  const r = await octokit.search.issuesAndPullRequests({ q, per_page: 1 });
  return r.data.total_count;
};
const prsOpened = await searchCount(`is:pr author:${USERNAME}`);
const prsReviewed = await searchCount(`is:pr reviewed-by:${USERNAME} -author:${USERNAME}`);
const issues = await searchCount(`is:issue author:${USERNAME}`);

// ── 4. languages aggregated across all owned non-fork public repos ────────
const langSize = new Map();
const langColor = new Map();
for (const repo of user.repositories.nodes) {
  for (const edge of repo.languages.edges) {
    const name = edge.node.name;
    langSize.set(name, (langSize.get(name) || 0) + edge.size);
    if (!langColor.has(name)) langColor.set(name, edge.node.color);
  }
}
const langTotal = [...langSize.values()].reduce((a, b) => a + b, 0) || 1;
const languages = [...langSize.entries()]
  .map(([name, size]) => ({
    name,
    size,
    pct: +((size / langTotal) * 100).toFixed(2),
    color: langColor.get(name) || '#888888',
  }))
  .sort((a, b) => b.size - a.size);

// ── 5. aggregates ─────────────────────────────────────────────────────────
const stars = user.repositories.nodes.reduce((s, r) => s + r.stargazerCount, 0);
// "significant" language = ≥0.5% of total bytes (filters out config/scripts noise)
const multiLang = languages.filter((l) => l.pct >= 0.5).length;
const experienceYears = Math.floor((now - createdAt) / (365.25 * 24 * 3600 * 1000));

const calendar = user.contributionsCollection.contributionCalendar;

const data = {
  generatedAt: now.toISOString(),
  username: USERNAME,
  lifetime: {
    commits: lifetimeCommits,
    prsOpened,
    prsReviewed,
    issues,
    repos: user.repositories.totalCount,
    stars,
    experienceYears,
    multiLang,
  },
  languages,
  contributionCalendar: {
    totalContributions: calendar.totalContributions,
    weeks: calendar.weeks,
  },
};

const outPath = new URL('./data.json', import.meta.url);
fs.writeFileSync(outPath, JSON.stringify(data, null, 2) + '\n');
console.log(`wrote ${outPath.pathname}`);
console.log(`  commits=${lifetimeCommits} prsOpened=${prsOpened} prsReviewed=${prsReviewed} repos=${user.repositories.totalCount} langs=${languages.length}`);
