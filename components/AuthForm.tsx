import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, layout } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthProvider';

type FormValues = { firstName: string; lastName: string; email: string; password: string; passwordAgain: string };
type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = { firstName: '', lastName: '', email: '', password: '', passwordAgain: '' };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthForm({ mode }: { mode: 'sign-up' | 'sign-in' }) {
  const { signIn, signUp } = useAuth();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isSignUp = mode === 'sign-up';

  const update = (key: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setMessage(null);
  };

  const validate = () => {
    const next: FormErrors = {};
    if (isSignUp && !values.firstName.trim()) next.firstName = 'Adını yazmalısın.';
    if (isSignUp && !values.lastName.trim()) next.lastName = 'Soyadını yazmalısın.';
    if (!values.email.trim()) next.email = 'E-posta adresini yazmalısın.';
    else if (!emailPattern.test(values.email.trim())) next.email = 'Geçerli bir e-posta adresi yazmalısın.';
    if (!values.password) next.password = 'Şifreni yazmalısın.';
    else if (values.password.length < 8) next.password = 'Şifren en az 8 karakter olmalı.';
    if (isSignUp && !values.passwordAgain) next.passwordAgain = 'Şifreni tekrar yazmalısın.';
    else if (isSignUp && values.password !== values.passwordAgain) next.passwordAgain = 'Şifreler eşleşmiyor.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (submitting || !validate()) return;
    setSubmitting(true);
    setMessage(null);
    const result = isSignUp
      ? await signUp({ firstName: values.firstName, lastName: values.lastName, email: values.email, password: values.password })
      : await signIn({ email: values.email, password: values.password });
    setSubmitting(false);

    if (!result.ok) {
      setMessage({ type: 'error', text: result.message });
      return;
    }
    if (result.requiresEmailVerification) {
      setMessage({ type: 'success', text: 'Üyeliğini tamamlamak için e-posta adresine gönderdiğimiz doğrulama bağlantısını aç. Doğrulamadan sonra uygulamaya dönüp giriş yap.' });
      return;
    }
    router.replace('/');
  };

  return (
    <View style={styles.form}>
      {isSignUp ? <>
        <Field label="Ad" value={values.firstName} onChangeText={(text) => update('firstName', text)} error={errors.firstName} autoCapitalize="words" autoComplete="given-name" />
        <Field label="Soyad" value={values.lastName} onChangeText={(text) => update('lastName', text)} error={errors.lastName} autoCapitalize="words" autoComplete="family-name" />
      </> : null}
      <Field label="E-posta" value={values.email} onChangeText={(text) => update('email', text)} error={errors.email} autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="ornek@eposta.com" />
      <Field label="Şifre" value={values.password} onChangeText={(text) => update('password', text)} error={errors.password} autoCapitalize="none" autoComplete={isSignUp ? 'new-password' : 'current-password'} placeholder="En az 8 karakter" secureTextEntry />
      {isSignUp ? <Field label="Şifre Tekrar" value={values.passwordAgain} onChangeText={(text) => update('passwordAgain', text)} error={errors.passwordAgain} autoCapitalize="none" autoComplete="new-password" placeholder="Şifreni tekrar yaz" secureTextEntry /> : null}
      {message ? <Text accessibilityRole="alert" style={[styles.message, message.type === 'error' ? styles.errorMessage : styles.successMessage]}>{message.text}</Text> : null}
      <Pressable accessibilityRole="button" disabled={submitting} onPress={() => void submit()} style={({ pressed }) => [styles.button, (pressed || submitting) && styles.pressed]}>
        {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>{isSignUp ? 'Üyeliğimi Oluştur' : 'Giriş Yap'}</Text>}
      </Pressable>
    </View>
  );
}

type FieldProps = TextInputProps & { label: string; error?: string };
function Field({ label, error, ...props }: FieldProps) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...props} placeholderTextColor="#8B90A0" style={[styles.input, error && styles.inputError]} />{error ? <Text style={styles.fieldError}>{error}</Text> : null}</View>;
}

const styles = StyleSheet.create({
  form: { gap: 18 }, field: { gap: 8 }, label: { color: colors.navy, fontSize: 16, fontWeight: '700' },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 15, borderWidth: 1, color: colors.navy, fontSize: 17, minHeight: layout.controlHeight, paddingHorizontal: 16 },
  inputError: { borderColor: colors.danger }, fieldError: { color: colors.danger, fontSize: 14 },
  message: { borderRadius: 14, fontSize: 15, lineHeight: 22, padding: 14 }, errorMessage: { backgroundColor: '#F8E8E8', color: colors.danger }, successMessage: { backgroundColor: '#E8F3EC', color: '#24623B' },
  button: { alignItems: 'center', backgroundColor: colors.sapphire, borderRadius: 16, justifyContent: 'center', minHeight: 58, marginTop: 4 }, buttonText: { color: colors.white, fontSize: 17, fontWeight: '800' }, pressed: { opacity: 0.65 },
});
