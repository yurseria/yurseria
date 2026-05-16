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
//
// extra fields here back the github-profile-trophy-style ranks on card 04:
//   - repositories.nodes.createdAt → earliest-repo date (durationDays for Experience / LongTimeUser)
//   - contributionsCollection.totalCommitContributions + restrictedContributionsCount → Commits
//   - contributionsCollection.totalPullRequestReviewContributions → Reviews
//   - followers / organizations / openIssues / closedIssues / pullRequests totalCount → Followers / Issues / PullRequest
const baseQuery = `
  query($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      createdAt
      followers { totalCount }
      organizations { totalCount }
      openIssues:  issues(states: OPEN)   { totalCount }
      closedIssues: issues(states: CLOSED) { totalCount }
      pullRequests { totalCount }
      repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC, isFork: false) {
        totalCount
        nodes {
          name
          createdAt
          stargazerCount
          languages(first: 20, orderBy: { field: SIZE, direction: DESC }) {
            edges { size node { name color } }
          }
        }
      }
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        restrictedContributionsCount
        totalPullRequestReviewContributions
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

// ── 6. trophy inputs (github-profile-trophy parity) ──────────────────────
// Earliest repo date is min(user.createdAt, min(repo.createdAt)) — matches
// ryo-ma's UserInfo. Duration drives both Experience (days/100) and
// LongTimeUser (full years).
const repoCreatedAts = user.repositories.nodes
  .map((r) => new Date(r.createdAt))
  .filter((d) => !Number.isNaN(d.getTime()));
const earliestRepoDate = new Date(Math.min(createdAt.getTime(), ...repoCreatedAts.map((d) => d.getTime())));
const durationMs = now.getTime() - earliestRepoDate.getTime();
const durationDays = Math.floor(durationMs / 86_400_000);
const experienceScore = Math.floor(durationDays / 100); // ryo-ma AccountDurationTrophy score
const longTimeYears = new Date(durationMs).getUTCFullYear() - 1970;
const yearCommits = user.contributionsCollection.totalCommitContributions + user.contributionsCollection.restrictedContributionsCount;
const yearReviews = user.contributionsCollection.totalPullRequestReviewContributions;
const issueTotal = user.openIssues.totalCount + user.closedIssues.totalCount;
const trophy = {
  commits:      yearCommits,                    // ryo-ma "Commits" (1 yr, includes private)
  pullRequests: user.pullRequests.totalCount,   // ryo-ma "PullRequest" (lifetime)
  reviews:      yearReviews,                    // ryo-ma "Reviews" (1 yr)
  issues:       issueTotal,                     // ryo-ma "Issues"
  stars,                                         // ryo-ma "Stars"
  followers:    user.followers.totalCount,      // ryo-ma "Followers"
  repositories: user.repositories.totalCount,   // ryo-ma "Repositories"
  experience:   experienceScore,                // ryo-ma "Experience" (durationDays/100)
  longTimeYears,                                 // ryo-ma "LongTimeUser" (full years)
  earliestRepoDate: earliestRepoDate.toISOString(),
  durationDays,
};

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
  trophy,
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
console.log(`  trophy: commits=${trophy.commits} reviews=${trophy.reviews} prs=${trophy.pullRequests} issues=${trophy.issues} stars=${trophy.stars} followers=${trophy.followers} repos=${trophy.repositories} exp=${trophy.experience} longTime=${trophy.longTimeYears}yr`);
