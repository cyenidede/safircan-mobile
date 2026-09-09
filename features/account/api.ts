import { requestJson } from '@/lib/api';
import type { AccountLifecycle } from './domain';
type R={success:boolean;lifecycle:AccountLifecycle;code?:string};
const auth=(token:string)=>({Authorization:`Bearer ${token}`});
export async function loadLifecycleState(token:string){return (await requestJson<R>('/api/account/lifecycle',{headers:auth(token)})).lifecycle;}
async function action(token:string,path:string){const r=await requestJson<R>(path,{method:'POST',headers:{...auth(token),'Content-Type':'application/json'},body:'{}'});return r.lifecycle;}
export const pauseAccount=(token:string)=>action(token,'/api/account/pause');
export const resumeAccount=(token:string)=>action(token,'/api/account/resume');
export const requestAccountDeletion=(token:string)=>action(token,'/api/account/deletion-request');
export const cancelAccountDeletion=(token:string)=>action(token,'/api/account/deletion-cancel');
