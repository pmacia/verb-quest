export type ProfileId=string; export type VerbId=string; export type PlanId=string; export type SessionId=string; export type AttemptId=string;
export type ISOInstant=string; export type LocalDate=string; export type TimeZone=string;
export type Skill='recognition'|'recall'|'listening'|'spelling'|'pronunciation'|'context';
export type EvaluatedSkill=Exclude<Skill,'pronunciation'>;
export type FormKey='base'|'pastSimple'|'pastParticiple';
export type LearningState='new'|'learning'|'needs_review'|'consolidating'|'mastered';
export type Dialect='uk'|'us';
export interface Source {label?:string;url?:string;license?:string;checkedAt?:string}
export interface Pronunciation {ipa?:string;audioUrl?:string|null;audioSource?:string;audioLicense?:string;validated?:boolean}
export interface Variant {value:string;dialect?:'all'|'uk'|'us'|'other';usageNote?:string;pronunciation?:Partial<Record<Dialect,Pronunciation>>}
export interface Example {id:string;sentence:string;translation:string;targetForm:string;grammarPoint:string;dialect?:'uk'|'us'|'neutral';reviewStatus:'draft'|'needs_review'|'validated';source?:string;audioUrl?:string|null;form?:FormKey;acceptedAnswers?:string[]}
export interface Verb {id:VerbId;lemma:string;forms:{base:{value:string;pronunciation?:Partial<Record<Dialect,Pronunciation>>};pastSimple:{variants:Variant[];usageNotes?:string[]};pastParticiple:{variants:Variant[];usageNotes?:string[]};thirdPersonSingular?:{variants:Variant[]};presentParticiple?:{variants:Variant[]}};meanings:string[];meaningNotes?:string;classification:{formRelation:'all_same'|'past_participle_same'|'all_different'|'special';frequencyBand:'essential'|'common'|'less_common'|'advanced';patternGroups:string[];recommendedCourses:string[];spellingEndings?:Record<string,string[]>;phoneticEndings?:Record<string,string[]>;topics?:string[];difficulty?:'introductory'|'intermediate'|'advanced'};examples:Example[];mnemonics?:string[];notes?:string[];sources:Source[];editorialStatus:'draft'|'needs_review'|'validated';archivedAt:ISOInstant|null;contentVersion:string;createdAt?:ISOInstant;updatedAt?:ISOInstant}
export interface CoverageTarget {id:string;form:FormKey;variantValue:string;contextKey:string|null}
export type QuestionMode='flashcards'|'matching'|'quiz'|'audio_detective'|'sentence_gap'|'written_recall';
export interface Question {id:string;version:string;verbId:VerbId;contentVersion:string;mode:QuestionMode;skill:EvaluatedSkill;target:FormKey;coverageTargetIds:string[];prompt:string;acceptedAnswers:string[];options:string[];explanation:string;audioText?:string;evidenceKind:'objective'|'self_report';isWritten:boolean;retryOf?:string}
export interface AnswerInput {attemptId:AttemptId;sessionId:SessionId;questionId:string;answer:string|string[];selfRating?:'known'|'unsure'|'unknown';hintsUsed:boolean;revealed:boolean;at:ISOInstant}
export interface Attempt extends AnswerInput {profileId:ProfileId;verbId:VerbId;questionVersion:string;contentVersion:string;skill:EvaluatedSkill;target:FormKey;coverageTargetIds:string[];mode:QuestionMode;evidenceKind:'objective'|'self_report';correct:boolean|null;hasOptions:boolean;isWritten:boolean;assisted:boolean;localDate:LocalDate;snapshot:Question}
export interface SkillProgress {profileId:ProfileId;verbId:VerbId;skill:EvaluatedSkill;state:LearningState;stage:0|1|2|3|4;dueDate:LocalDate|null;lastAdvanceDate:LocalDate|null;eligibleDates:LocalDate[];coverage:string[];hasWrittenContextEvidence:boolean;objectiveError:boolean;selfReportReview:boolean;started:boolean}
export interface LearningConfig {version:string;intervalDays:[number,number,number,number];masteryMinAdvances:number;maxAdvancePerDay:1;maxRetryPerQuestion:1}
export interface Clock {now():ISOInstant}
export interface Profile {id:ProfileId;name:string;timeZone:TimeZone;createdAt:ISOInstant}
export interface VerbList {id:string;profileId:ProfileId;name:string;verbIds:VerbId[]}
export interface CatalogFilter {courses?:string[];frequencies?:string[];states?:LearningState[];relations?:string[];families?:string[];spelling?:{form:FormKey;ending:string}[];phonetic?:{form:FormKey;dialect:Dialect;ending:string}[];topics?:string[];listIds?:string[]}
export interface CatalogQuery {text:string;filter:CatalogFilter;sort:'alphabetical'|'frequency'|'course'|'mastery'|'difficulty'|'review';direction:'asc'|'desc'}
export type PlanSource={type:'course';course:string}|{type:'saved_list';listId:string}|{type:'manual'|'imported';verbIds:VerbId[]}|{type:'filter';filter:CatalogFilter};
export type PlanGoal='learn'|'review'|'listening'|'spelling'|'pronunciation'|'context'|'mixed';
export interface StudyPlan {id:PlanId;profileId:ProfileId;name:string;description?:string;source:PlanSource;goals:PlanGoal[];schedule:{minutesPerSession:5|10|15;newVerbsPerSession:number;daysPerWeek?:string[];remindersEnabled:false};questionModes:QuestionMode[];order:'adaptive'|'alphabetical';difficulty:'all'|'introductory'|'intermediate'|'advanced';selectionPolicy:'resolve_at_start';isTemplate?:boolean;createdAt:ISOInstant;updatedAt?:ISOInstant}
export interface ResolvedSelection {verbIds:VerbId[];excludedIds:VerbId[];reasons:string[]}
export interface StudySession {id:SessionId;profileId:ProfileId;planId:string|null;selection:VerbId[];queue:Question[];cursor:number;attemptIds:string[];retriedQuestionIds:string[];status:'active'|'paused'|'completed';createdAt:ISOInstant;completedAt:ISOInstant|null}
export interface AppSettings {profileId:string;volume:number;rate:number;dialect:Dialect;voiceURI:string|null;sounds:boolean;theme:'light'|'dark'|'system';reducedMotion:boolean;minutes:5|10|15;timeZone:TimeZone;remindersEnabled:false;learning:LearningConfig}
export interface CatalogEntry {verb:Verb;baseVersion:string|null;locallyModified:boolean;pendingBase:Verb|null}
export interface Dataset {version:string;kind:'fixture'|'curated';verbs:Verb[]}
export interface UserAchievement {id:string;profileId:string;verbId:string|null;kind:string;earnedAt:string}
export interface XpEntry {id:string;profileId:string;sessionId:string;points:number;at:string}
export interface BackupV1 {format:'verbquest-backup';schemaVersion:1;exportedAt:string;profile:Profile;settings:AppSettings;baseDatasetVersion:string;verbs:CatalogEntry[];lists:VerbList[];plans:StudyPlan[];sessions:StudySession[];attempts:Attempt[];progress:SkillProgress[];awards:UserAchievement[];xpLedger:XpEntry[]}
export interface ValidationIssue {path:string;code:string;message:string}
export type ValidationResult<T>={ok:true;value:T}|{ok:false;issues:ValidationIssue[]};
