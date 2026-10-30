import original from './original/verbs.seed.json';
import { adaptLegacyVerb } from '../../src/shared/domain/validation';
import type { Dataset } from '../../src/shared/domain/types';
export const dataset: Dataset = {
  version: 'fixture-0.1',
  kind: 'fixture',
  verbs: original.verbs.map((v) => {
    const r = adaptLegacyVerb(v);
    if (!r.ok) throw Error('Fixture no válido');
    return r.value;
  }),
};
