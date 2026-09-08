import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { BirthChartForm } from '@/features/astrology/BirthChartForm';
import { useLocale } from '@/localization';
export default function BirthChartScreen() { const {messages}=useLocale(); const m=messages.birthForm; return <Screen><SectionHeader eyebrow={m.eyebrow} title={m.title} description={m.description} /><BirthChartForm /></Screen>; }
