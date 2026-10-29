import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import legacyVerb from './schemas/verb.schema.json';
import legacyPlan from './schemas/study-plan.schema.json';
import type {ValidationIssue,ValidationResult,Verb} from './types';
const ajv=new Ajv2020({allErrors:true,strict:false}); addFormats(ajv);
const verbSchema=structuredClone(legacyVerb) as any;
verbSchema.$id='verbquest:verb';delete verbSchema.properties.contentStatus;
verbSchema.required=verbSchema.required.filter((x:string)=>x!=='contentStatus').concat(['editorialStatus','archivedAt','contentVersion','examples','sources']);
Object.assign(verbSchema.properties,{editorialStatus:{enum:['draft','needs_review','validated']},archivedAt:{type:['string','null'],format:'date-time'},contentVersion:{type:'string',minLength:1}});
Object.assign(verbSchema.$defs.example.properties,{form:{enum:['base','pastSimple','pastParticiple']},acceptedAnswers:{type:'array',minItems:1,items:{type:'string',minLength:1}}});
const planSchema=structuredClone(legacyPlan) as any;planSchema.$id='verbquest:plan';
Object.assign(planSchema.properties,{profileId:{type:'string',minLength:1},order:{enum:['adaptive','alphabetical']},difficulty:{enum:['all','introductory','intermediate','advanced']},selectionPolicy:{const:'resolve_at_start'}});
planSchema.properties.questionModes.items.enum.push('written_recall');
planSchema.allOf=['course','saved_list','manual','filter','imported'].map(type=>({if:{properties:{source:{properties:{type:{const:type}}}}},then:{properties:{source:{required:[({course:'course',saved_list:'listId',manual:'verbIds',filter:'filter',imported:'verbIds'} as Record<string,string>)[type]]}}}}));
const compiled:Record<string,ReturnType<typeof ajv.compile>>={verb:ajv.compile(verbSchema),legacyVerb:ajv.compile(legacyVerb),plan:ajv.compile(planSchema)};
function issue(path:string,message:string):ValidationIssue{return{path,code:'invalid',message};}
export function validate<T>(kind:string,input:unknown):ValidationResult<T>{
 const errors:ValidationIssue[]=[];
 const check=compiled[kind];
 if(check&&!check(input))errors.push(...(check.errors??[]).map(e=>issue(e.instancePath,e.message??'Dato no válido')));
 if(!input||typeof input!=='object'||Array.isArray(input))errors.push(issue('','Se esperaba un objeto'));
 function scan(value:unknown,path=''){if(typeof value==='string'&&value.length>20000)errors.push(issue(path,'Texto demasiado largo'));if(value&&typeof value==='object')for(const [k,v]of Object.entries(value)){if(k==='__proto__'||k==='constructor'||k==='prototype')errors.push(issue(path,'Clave no admitida'));if(/^(url|audioUrl)$/i.test(k)&&typeof v==='string'&&v&&!((k==='audioUrl'&&/^\/(?!\/)/.test(v))||/^https?:\/\//i.test(v)))errors.push(issue(`${path}/${k}`,'URL debe usar HTTP o HTTPS'));scan(v,`${path}/${k}`);}}
 scan(input);
 if(kind==='backup'){
  const b=input as any;
  if(b?.format!=='verbquest-backup'||b?.schemaVersion!==1)errors.push(issue('/schemaVersion','Versión de copia no compatible'));
  if(!b?.profile?.id||!b?.settings||!b?.exportedAt||typeof b?.baseDatasetVersion!=='string')errors.push(issue('','Copia incompleta'));
  for(const key of ['verbs','lists','plans','sessions','attempts','progress','awards','xpLedger'])if(!Array.isArray(b?.[key]))errors.push(issue('/'+key,'Se esperaba una colección'));
 }
 if(!check&&kind!=='backup')errors.push(issue('','Tipo de validación no registrado'));
 return errors.length?{ok:false,issues:errors}:{ok:true,value:structuredClone(input) as T};
}
export function adaptLegacyVerb(input:unknown):ValidationResult<Verb>{
 const old=validate<any>('legacyVerb',input);if(!old.ok)return old;
 const {contentStatus,...rest}=old.value;
 return validate<Verb>('verb',{...rest,examples:rest.examples??[],sources:rest.sources??[],editorialStatus:contentStatus==='archived'?'needs_review':contentStatus,archivedAt:contentStatus==='archived'?new Date().toISOString():null,contentVersion:'fixture-0.1'});
}
