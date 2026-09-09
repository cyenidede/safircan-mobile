export type LifecycleState='active'|'paused'|'suspended'|'deletion_pending';
export type AccountLifecycle={state:LifecycleState;pausedAt:string|null;suspendedAt:string|null;deletionRequestedAt:string|null;deletionGraceDays:number};
export function deletionDate(value:string,days:number){const date=new Date(value);date.setUTCDate(date.getUTCDate()+days);return date;}
