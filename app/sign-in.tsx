import { AuthForm } from '@/components/AuthForm';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';

export default function SignInScreen() {
  return <Screen><SectionHeader eyebrow="TEKRAR HOŞ GELDİN" title="Hesabına giriş yap" description="Kaldığın yerden devam etmek için bilgilerini gir." /><AuthForm mode="sign-in" /></Screen>;
}
