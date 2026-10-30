"""Extract only additive metadata from the user-supplied catalog; never copy its examples/forms."""
import sys, json, hashlib
from pathlib import Path
root = Path(__file__).resolve().parents[1]
path = Path(sys.argv[1])
raw = path.read_bytes()
source = json.loads(raw)
base = json.loads((root/'src/content/verbs.curated.json').read_text())
ids = {v['id'] for v in base}
entries = []
for v in source['verbs']:
    if v['id'] not in ids:
        continue
    forms = {}
    for form in ['base','pastSimple','pastParticiple']:
        variants = [v['forms']['base']] if form == 'base' else v['forms'][form]['variants']
        forms[form] = [{'value':a['value'], 'pronunciation':{d:{'ipa':p['ipa'],'validated':False} for d,p in a.get('pronunciation',{}).items() if d in ['uk','us'] and isinstance(p.get('ipa'),str)}} for a in variants]
    entries.append({'id':v['id'],'patternGroups':v['classification'].get('patternGroups',[]),'topics':v['classification'].get('topics',[]),'forms':forms})
result = {'sourceFile':path.name,'sha256':hashlib.sha256(raw).hexdigest(),'sourceCount':len(source['verbs']),'excludedIds':[v['id'] for v in source['verbs'] if v['id'] not in ids], 'entries':entries}
(root/'src/content/catalog-enrichment.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(f'{len(entries)} enrichment candidates; {len(result["excludedIds"])} additional verbs deferred.')
