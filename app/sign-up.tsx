import { AuthForm } from '@/components/AuthForm';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';

export default function SignUpScreen() {
  return <Screen><SectionHeader eyebrow="SAFİR CAN" title="Yolculuğuna başla" description="Haritanı kaydetmek ve kişisel deneyimini oluşturmak için üye ol." /><AuthForm mode="sign-up" /></Screen>;
}
