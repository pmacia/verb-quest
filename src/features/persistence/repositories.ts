import {liveQuery} from 'dexie';
import {AppDatabase} from './db';
export type AppRepositories=AppDatabase & {db:AppDatabase;runAtomic:<T>(work:()=>Promise<T>)=>Promise<T>;subscribe:(listener:()=>void)=>()=>void};
export async function openAppDatabase(name?:string):Promise<AppRepositories>{
 const databaseName=name??'verbquest';
 const nativeVersion=await new Promise<number>((resolve,reject)=>{const request=indexedDB.open(databaseName);request.onupgradeneeded=()=>{request.transaction?.abort();resolve(0);};request.onsuccess=()=>{const version=request.result.version;request.result.close();resolve(version);};request.onerror=()=>{if(request.error?.name==='AbortError')resolve(0);else reject(request.error);};});
 if(nativeVersion>10)throw Error('Versión de datos más reciente: actualiza la aplicación.');
 const db=new AppDatabase(databaseName);await db.open();if(db.verno>1){db.close();throw Error('Versión de datos más reciente: utiliza la aplicación actualizada.');}
 const repos=db as AppRepositories;repos.db=db;repos.runAtomic=<T>(work:()=>Promise<T>)=>db.transaction('rw',db.tables,work);
 repos.subscribe=listener=>{const sub=liveQuery(async()=>Promise.all(db.tables.map(t=>t.toArray()))).subscribe({next:()=>listener(),error:()=>listener()});return()=>sub.unsubscribe();};return repos;
}
