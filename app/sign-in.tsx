import { AuthForm } from '@/components/AuthForm';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { useLocale } from '@/localization';

export default function SignInScreen() {
  const { locale } = useLocale();
  return <Screen><SectionHeader eyebrow={locale==='tr'?'TEKRAR HOŞ GELDİN':'WELCOME BACK'} title={locale==='tr'?'Hesabına giriş yap':'Sign in to your account'} description={locale==='tr'?'Kaldığın yerden devam etmek için bilgilerini gir.':'Enter your details to continue.'} /><AuthForm mode="sign-in" /></Screen>;
}
