import { auditPronunciations, pronunciationReview } from '../src/content/pronunciation-review';
import { dataset } from '../src/content/dataset';
import manifest from '../src/content/review-manifest.json';
import { checkContent } from './lib/content-audit';
const r = checkContent(dataset, manifest);
const ipa = auditPronunciations(dataset.verbs, pronunciationReview);
for (const issue of ipa.issues)
  r.errors.push({ verbId: issue.verbId, message: `IPA: ${issue.reason}` });
r.publishable = r.errors.length === 0;
console.log(JSON.stringify({ ...r, ipa }, null, 2));
if (!r.publishable) process.exitCode = 1;
