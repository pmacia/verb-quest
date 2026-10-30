import { performance } from 'node:perf_hooks';
import os from 'node:os';
import { dataset } from '../src/content/dataset';
import { queryCatalog } from '../src/features/catalog/query';
const verbs = Array.from({ length: 10000 }, (_, i) => ({
  ...dataset.verbs[i % dataset.verbs.length],
  id: 'benchmark-' + i,
}));
const query = {
  text: 'went',
  filter: { courses: ['eso2'] },
  sort: 'alphabetical',
  direction: 'asc',
} as const;
const context = { lists: [], progress: [], today: '2026-10-30' };
for (let i = 0; i < 3; i++)
  queryCatalog(verbs, { ...query, filter: { courses: ['eso2'] } }, context);
const times = [];
for (let i = 0; i < 20; i++) {
  const t = performance.now();
  queryCatalog(verbs, { ...query, filter: { courses: ['eso2'] } }, context);
  times.push(performance.now() - t);
}
times.sort((a, b) => a - b);
console.log(
  JSON.stringify(
    {
      entries: 10000,
      runs: 20,
      medianMs: +times[10].toFixed(2),
      p95Ms: +times[18].toFixed(2),
      referenceMs: 300,
      node: process.version,
      platform: process.platform,
      cpu: os.cpus()[0].model,
      query,
    },
    null,
    2,
  ),
);
