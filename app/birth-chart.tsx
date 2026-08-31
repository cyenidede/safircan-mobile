import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { BirthChartForm } from '@/features/astrology/BirthChartForm';
export default function BirthChartScreen() { return <Screen><SectionHeader eyebrow="DOĞUM HARİTASI" title="Gökyüzü bilgilerini ekle" description="Doğduğun ana ait bilgiler, haritanın doğru hesaplanması için kullanılır." /><BirthChartForm /></Screen>; }
