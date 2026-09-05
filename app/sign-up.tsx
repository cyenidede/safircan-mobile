import { AuthForm } from '@/components/AuthForm';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { useLocale } from '@/localization';

export default function SignUpScreen() {
  const { locale } = useLocale();
  return <Screen><SectionHeader eyebrow="SAFİR CAN" title={locale==='tr'?'Yolculuğuna başla':'Start your journey'} description={locale==='tr'?'Haritanı kaydetmek ve kişisel deneyimini oluşturmak için üye ol.':'Create an account to save your chart and experience.'} /><AuthForm mode="sign-up" /></Screen>;
}
