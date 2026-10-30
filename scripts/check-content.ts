import { dataset } from '../src/content/dataset';
import manifest from '../src/content/review-manifest.json';
import { checkContent } from './lib/content-audit';
const r = checkContent(dataset, manifest);
console.log(JSON.stringify(r, null, 2));
if (!r.publishable) process.exitCode = 1;
