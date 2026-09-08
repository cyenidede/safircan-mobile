export const LEGAL_DOCUMENTS = {
  privacy: { url: 'https://safircan.com/gizlilik' },
  terms: { url: 'https://safircan.com/kullanim-kosullari' },
  kvkk: { url: 'https://safircan.com/aydinlatma-metni' },
} as const;
export type LegalDocumentId = keyof typeof LEGAL_DOCUMENTS;
export function isLegalDocumentId(value: unknown): value is LegalDocumentId { return typeof value === 'string' && Object.hasOwn(LEGAL_DOCUMENTS, value); }
const ENTITIES: Record<string,string>={'&amp;':'&','&quot;':'"','&#39;':"'",'&apos;':"'",'&lt;':'<','&gt;':'>','&nbsp;':' '};
export function extractLegalText(html:string){const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]??html;return main.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<(?:br\s*\/|\/p|\/h[1-6]|\/li|\/section|\/article)>/gi,'\n').replace(/<li\b[^>]*>/gi,'• ').replace(/<[^>]+>/g,' ').replace(/&(amp|quot|#39|apos|lt|gt|nbsp);/g,(entity)=>ENTITIES[entity]??entity).replace(/&#(\d+);/g,(_,code:string)=>String.fromCodePoint(Number(code))).replace(/[ \t]+/g,' ').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim();}
export async function fetchLegalDocument(id:LegalDocumentId){const response=await fetch(LEGAL_DOCUMENTS[id].url,{headers:{Accept:'text/html'}});if(!response.ok)throw new Error('legal_content_unavailable');const text=extractLegalText(await response.text());if(text.length<120)throw new Error('legal_content_invalid');return text;}
