import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext,useCallback,useContext,useEffect,useMemo,useState,type PropsWithChildren } from 'react';
import { Appearance } from 'react-native';
import { useAuth } from '@/features/auth/AuthProvider';
import { getPreferences,savePreferences } from '@/features/settings/api';
import tr from './messages/tr'; import en from './messages/en';

export const supportedLocales=['tr','en','ar','es','de','fr','el'] as const;
export type AppLocale=typeof supportedLocales[number]; export type ActiveLocale='tr'|'en'; export type ThemePreference='system'|'light'|'dark';
type Messages={ [K in keyof typeof tr]: { [P in keyof (typeof tr)[K]]: string } }; const catalogs:Record<ActiveLocale,Messages>={tr,en};
const KEY='safircan.preferences.v1';
function systemLocale():ActiveLocale { const language=Intl.DateTimeFormat().resolvedOptions().locale.split('-')[0]; return language==='tr'?'tr':'en'; }
function normalizedScheme(value: ReturnType<typeof Appearance.getColorScheme>): 'light'|'dark'|null { return value==='dark'?'dark':value==='light'?'light':null; }
type State={locale:ActiveLocale;localeSource:'system'|'manual';theme:ThemePreference;hideLastName:boolean};
type Value=State&{messages:Messages;colorScheme:'light'|'dark';setLocale:(v:ActiveLocale)=>Promise<void>;setTheme:(v:ThemePreference)=>Promise<void>;setHideLastName:(v:boolean)=>Promise<void>};
const Context=createContext<Value|null>(null);
export function LocaleProvider({children}:PropsWithChildren){const {session}=useAuth(); const [state,setState]=useState<State>({locale:systemLocale(),localeSource:'system',theme:'system',hideLastName:false}); const [systemScheme,setSystemScheme]=useState<'light'|'dark'|null>(normalizedScheme(Appearance.getColorScheme()));
 useEffect(()=>{const sub=Appearance.addChangeListener(({colorScheme})=>setSystemScheme(normalizedScheme(colorScheme))); return()=>sub.remove();},[]);
 useEffect(()=>{let active=true; void AsyncStorage.getItem(KEY).then(raw=>{if(raw&&active)setState(current=>({...current,...JSON.parse(raw)}));}); return()=>{active=false};},[]);
 useEffect(()=>{if(!session?.access_token)return; let active=true; void getPreferences(session.access_token).then(p=>{if(!p||!active)return; const locale=p.localeSource==='manual'&&(p.preferredLocale==='tr'||p.preferredLocale==='en')?p.preferredLocale:systemLocale(); setState({locale,localeSource:p.localeSource,theme:p.theme,hideLastName:p.hideLastName});}).catch(()=>undefined); return()=>{active=false};},[session?.access_token]);
 const persist=useCallback(async(next:State)=>{setState(next); await AsyncStorage.setItem(KEY,JSON.stringify(next)); if(session?.access_token)await savePreferences(session.access_token,next);},[session?.access_token]);
 const value=useMemo<Value>(()=>({...state,messages:catalogs[state.locale],colorScheme:state.theme==='system'?(systemScheme==='dark'?'dark':'light'):state.theme,setLocale:locale=>persist({...state,locale,localeSource:'manual'}),setTheme:theme=>persist({...state,theme}),setHideLastName:hideLastName=>persist({...state,hideLastName})}),[persist,state,systemScheme]); return <Context.Provider value={value}>{children}</Context.Provider>}
export function useLocale(){const value=useContext(Context);if(!value)throw new Error('useLocale must be used within LocaleProvider');return value;}
export function formatDate(value:Date|string,locale:ActiveLocale,options?:Intl.DateTimeFormatOptions){return new Intl.DateTimeFormat(locale==='tr'?'tr-TR':'en-US',options).format(new Date(value));}
export function formatNumber(value:number,locale:ActiveLocale,options?:Intl.NumberFormatOptions){return new Intl.NumberFormat(locale==='tr'?'tr-TR':'en-US',options).format(value);}
