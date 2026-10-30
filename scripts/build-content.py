"""Build fixed, editable content from original editorial rows; not runtime text generation."""
import json
from pathlib import Path
root=Path(__file__).resolve().parent.parent
out=root/'src/content'
rows=[line.strip().split('|') for line in (out/'editorial.tsv').read_text().splitlines() if line.strip()]
table='https://dictionary.cambridge.org/uk/grammar/british-grammar/table-of-irregular-verbs'
bc='https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/irregular-verbs'
notes={
'be':'Was se usa con I/he/she/it; were con you/we/they en pasado indicativo. No son intercambiables. Hay otros usos, como el subjuntivo, fuera de estos ejercicios.',
'get':'Para el sentido de obtener ayuda, se practica got en inglés británico y gotten en americano. Have got también tiene usos de posesión; no confundir los contextos.',
'lie':'Esta entrada significa estar tumbado: lie–lay–lain. Mentir es otro uso con pasado regular lied. Lay–laid–laid significa colocar algo.',
'lay':'Lay necesita un objeto en el sentido de colocar. No confundirlo con lie–lay–lain, estar tumbado.',
'lie':'Estar tumbado: lie–lay–lain. Mentir usa lied. Lay–laid–laid es colocar y requiere objeto.',
'hang':'En el sentido de colgar objetos se usa hung. Otras acepciones pueden tener otras formas; no se evalúan aquí.',
'bear':'Aquí se practica soportar: bore–borne. Born aparece en construcciones sobre nacimiento y no sustituye a borne en estos ejemplos.',
'read':'La escritura no cambia: base /riːd/, pasado y participio /red/. La voz sintética aislada no garantiza esta diferencia; la escucha de estas formas queda desactivada.',
'forbid':'La biblioteca usa la forma común forbade; no se evalúan formas históricas.',
'awake':'Awoke–awoken es la serie enseñada aquí. Existen otras variantes; esta selección no pretende ser exhaustiva.'}
# Original examples with subject/meaning-sensitive uses; no source examples copied.
overrides={
'cost': [('One ticket can cost ten euros.','Una entrada puede costar diez euros.','cost'),('My ticket cost ten euros yesterday.','Ayer mi entrada costó diez euros.','cost'),('My ticket has cost more than I expected.','Mi entrada ha costado más de lo que esperaba.','cost')],
'arise':[('Several questions can arise during a discussion.','Pueden surgir varias preguntas durante un debate.','arise'),('Several questions arose during our discussion yesterday.','Ayer surgieron varias preguntas durante nuestro debate.','arose'),('Several questions have arisen during our discussion.','Han surgido varias preguntas durante nuestro debate.','arisen')],
'hurt':[('We can hurt our knees if we fall.','Podemos hacernos daño en las rodillas si nos caemos.','hurt'),('I hurt my knee during a game yesterday.','Ayer me hice daño en la rodilla durante un juego.','hurt'),('I have hurt my knee during a game.','Me he hecho daño en la rodilla durante un juego.','hurt')],
'steal':[('We must not steal other people\'s things.','No debemos robar las cosas de otras personas.','steal'),('Someone stole my bicycle yesterday.','Ayer alguien robó mi bicicleta.','stole'),('Someone has stolen my bicycle.','Alguien ha robado mi bicicleta.','stolen')],
}
verbs=[];coverage={};reviews={}
for i,(lemma,past,pp,meaning,tail,esinf,espast,espp) in enumerate(rows):
    base=lemma.strip(); p=past.split('/'); participles=pp.split('/');
    def variants(values):return [{'value':x,'dialect':'all'} for x in values]
    forms={'base':{'value':base},'pastSimple':{'variants':variants(p)},'pastParticiple':{'variants':variants(participles)}}
    if base=='be':forms['pastSimple']['variants']=[{'value':'was','dialect':'all','usageNote':'I/he/she/it en pasado indicativo'},{'value':'were','dialect':'all','usageNote':'you/we/they en pasado indicativo'}]
    if base=='get':forms['pastParticiple']['variants']=[{'value':'got','dialect':'uk','usageNote':'Obtener, inglés británico'},{'value':'gotten','dialect':'us','usageNote':'Obtener, inglés americano'}]
    allsame=len(p)==len(participles)==1 and base==p[0]==participles[0]
    relation='special' if base=='be' or len(p)>1 or len(participles)>1 or base=='get' else 'all_same' if allsame else 'past_participle_same' if p==participles else 'special' if base==participles[0] else 'all_different'
    family=['sin-cambio'] if allsame else ['pasado-y-participio'] if p==participles else ['formas-diferentes']
    if p[0].endswith('ought'):family+=['ought']
    if participles[0].endswith('en'):family+=['participio-en']
    course=1 if i<40 else 2 if i<70 else 3 if i<100 else 4
    topic='school' if any(x in tail for x in ['school','class','teacher','book','project','test','lesson','exercise','pages','pencil']) else 'nature' if any(x in tail for x in ['tree','garden','animals','farm','cat','grass','birds','planet','fruit']) else 'daily_life'
    source={'label':'Cambridge Dictionary · referencia de formas y uso','url':table if i<100 and base not in ['be','get','learn','deal','light','smell','spell','hang'] else f'https://dictionary.cambridge.org/us/dictionary/english/{base}','license':'Consulta lexicográfica; ejemplos y traducciones de VerbQuest originales. No se redistribuyen definiciones ni grabaciones.','checkedAt':'2026-10-29'}
    forms_list=['base','pastSimple','pastParticiple']
    triples=overrides.get(base,[(f'We can {base} {tail}.',f'Podemos {esinf}.',base),(f'We {p[0]} {tail} yesterday.',f'Ayer {espast}.',p[0]),(f'We have {participles[0]} {tail}.',f'Hemos {espp}.',participles[0])])
    examples=[]
    for n,((sentence,translation,target),form) in enumerate(zip(triples,forms_list)):
        answers=[target]
        if base not in ['be','get'] and form!='base':answers=p if form=='pastSimple' else participles
        examples.append({'id':f'{base}-original-{n+1}','sentence':sentence,'translation':translation,'targetForm':target,'grammarPoint':['modal + base form','past simple','present perfect'][n],'form':form,'acceptedAnswers':answers,'dialect':'uk' if base=='get' and form=='pastParticiple' else 'neutral','reviewStatus':'validated','source':'VerbQuest · ejemplo original · revisión asistida documentada'})
    if base=='be':examples.append({'id':'be-original-was','sentence':'I was ready for the trip yesterday.','translation':'Ayer estaba preparado para la excursión.','targetForm':'was','grammarPoint':'past simple · singular','form':'pastSimple','acceptedAnswers':['was'],'dialect':'neutral','reviewStatus':'validated','source':'VerbQuest · ejemplo original'})
    if base=='get':examples.append({'id':'get-original-us','sentence':'We have gotten help at the library.','translation':'Hemos conseguido ayuda en la biblioteca.','targetForm':'gotten','grammarPoint':'present perfect · US','form':'pastParticiple','acceptedAnswers':['gotten'],'dialect':'us','reviewStatus':'validated','source':'VerbQuest · ejemplo original'})
    translations={'fall':'Nos hemos quedado dormidos durante un viaje largo.','feel':'Nos hemos sentido orgullosos de nuestro equipo.','meet':'Nos hemos reunido con nuestros amigos en el parque.','become':'Nos hemos convertido en un equipo más fuerte.','forgive':'Nos hemos perdonado después de una discusión.','wake':'Nos hemos despertado temprano para la excursión.'}
    if base in translations:examples[2]['translation']=translations[base]
    v={'id':base,'lemma':base,'forms':forms,'meanings':[x.strip() for x in meaning.split(';')],'classification':{'formRelation':relation,'frequencyBand':'essential' if i<40 else 'common' if i<70 else 'less_common' if i<100 else 'advanced','patternGroups':family,'recommendedCourses':[f'eso{c}' for c in range(course,5)],'topics':[topic],'difficulty':'introductory' if i<40 else 'intermediate' if i<100 else 'advanced','spellingEndings':{k:sorted(set('-'+a['value'][-3:] for a in forms[k]['variants'])) for k in ['pastSimple','pastParticiple']},'phoneticEndings':{}},'examples':examples,'mnemonics':[],'notes':[notes[base]] if base in notes else [],'sources':[source],'editorialStatus':'validated','archivedAt':None,'contentVersion':'curated-1.0','createdAt':'2026-10-29T00:00:00Z','updatedAt':'2026-10-29T00:00:00Z'}
    # Only IPA explicitly visible in consulted reference excerpts is marked checked.
    ipa={'read':'/riːd/','bind':'/baɪnd/','kneel':'/niːl/','split':'/splɪt/','forbid':'/fəˈbɪd/'}
    if base in ipa:forms['base']['pronunciation']={'uk':{'ipa':ipa[base],'validated':True}}
    if base=='read':
        for f in ['pastSimple','pastParticiple']:forms[f]['variants'][0]['pronunciation']={'uk':{'ipa':'/red/','validated':True}}
    verbs.append(v)
    targets=[{'id':'base','form':'base','variantValue':base,'contextKey':None}]
    targets+=([{'id':'pastSimple:was','form':'pastSimple','variantValue':'was','contextKey':'singular'},{'id':'pastSimple:were','form':'pastSimple','variantValue':'were','contextKey':'plural'}] if base=='be' else [{'id':'pastSimple','form':'pastSimple','variantValue':p[0],'contextKey':None}])
    targets+=[{'id':'pastParticiple','form':'pastParticiple','variantValue':participles[0],'contextKey':None}]
    coverage[base]={'uk':targets,'us':[{**t,'variantValue':'gotten'} if base=='get' and t['form']=='pastParticiple' else t for t in targets]}
    reviews[base]={'forms':'checked','examples':'original-reviewed-assisted','translation':'reviewed-assisted','courses':'editorial-recommendation','ipa':'partial-checked' if base in ipa else 'not-provided','audio':'browser-tts-not-phonetic-validation','reviewer':'Codex · revisión asistida, no certificación docente independiente','date':'2026-10-29','source':source['url']}
(out/'verbs.curated.json').write_text(json.dumps(verbs,ensure_ascii=False,indent=2)+'\n')
(out/'coverage-targets.json').write_text(json.dumps(coverage,ensure_ascii=False,indent=2)+'\n')
(out/'review-manifest.json').write_text(json.dumps({'version':'1.0','method':'lexicographic-reference-and-assisted-editorial-review','independentHumanReview':False,'entries':reviews},ensure_ascii=False,indent=2)+'\n')
(out/'sources.json').write_text(json.dumps({'curriculum':'https://www.boe.es/buscar/act.php?id=BOE-A-2022-4975','forms':[table,bc],'examples':'Originales de VerbQuest; no copiados de los diccionarios.','limitations':'La revisión es asistida. No se ha realizado una revisión docente independiente.'},ensure_ascii=False,indent=2)+'\n')
print(f'{len(verbs)} verbos, {sum(len(v["examples"]) for v in verbs)} ejemplos originales.')
