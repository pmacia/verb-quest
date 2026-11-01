import { dataset } from '../src/content/dataset';
import { auditPronunciations, pronunciationReview } from '../src/content/pronunciation-review';
const result = auditPronunciations(dataset.verbs, pronunciationReview);
console.log(
  JSON.stringify(
    { datasetVersion: dataset.version, verbs: dataset.verbs.length, ...result },
    null,
    2,
  ),
);
if (result.issues.length || result.expected !== result.validated) process.exitCode = 1;
