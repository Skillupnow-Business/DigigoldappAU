import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../../services/api';
import { COLORS, SPACING, RADIUS } from '../../utils/theme';
import { validateEmail, validatePhone } from '../../utils/helpers';

export default function SignUpScreen({ navigation }) {
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
    panNumber: '', address: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const update = (key, val) => setForm({ ...form, [key]: val });

  const validateStep1 = () => {
    if (!form.fullName.trim() || form.fullName.length < 2)
      return Alert.alert('Error', 'Enter your full name (min 2 characters)');
    if (!validateEmail(form.email))
      return Alert.alert('Error', 'Enter a valid email address');
    if (!validatePhone(form.phone))
      return Alert.alert('Error', 'Enter a valid 10-digit Indian mobile number');
    setStep(2);
  };

  const validateStep2 = () => {
    if (form.password.length < 6)
      return Alert.alert('Error', 'Password must be at least 6 characters');
    if (form.password !== form.confirmPassword)
      return Alert.alert('Error', 'Passwords do not match');
    handleRegister();
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const res = await authAPI.register({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        panNumber: form.panNumber.trim().toUpperCase(),
        address: form.address.trim(),
      });
      if (res.data.success) {
        Alert.alert('OTP Sent!', 'We sent an OTP to your email and phone number.', [
          {
            text: 'Verify Now',
            onPress: () => navigation.navigate('OTPVerify', { userId: res.data.userId, email: form.email }),
          },
        ]);
      }
    } catch (err) {
      Alert.alert('Registration Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[COLORS.background, COLORS.secondary]} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => step === 1 ? navigation.goBack() : setStep(1)}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="diamond" size={40} color={COLORS.primary} />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join DigiGold & start investing</Text>
          </View>

          {/* Step indicator */}
          <View style={styles.stepRow}>
            {[1, 2].map((s) => (
              <View key={s} style={styles.stepItem}>
                <View style={[styles.stepCircle, step >= s && styles.stepCircleActive]}>
                  {step > s ? (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  ) : (
                    <Text style={[styles.stepNum, step >= s && styles.stepNumActive]}>{s}</Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, step >= s && styles.stepLabelActive]}>
                  {s === 1 ? 'Personal Info' : 'Security'}
                </Text>
              </View>
            ))}
            <View style={styles.stepLine} />
          </View>

          <View style={styles.card}>
            {step === 1 ? (
              <>
                <Field icon="person-outline" label="Full Name" placeholder="Enter your full name"
                  value={form.fullName} onChangeText={(v) => update('fullName', v)} />
                <Field icon="mail-outline" label="Email Address" placeholder="Enter your email"
                  value={form.email} onChangeText={(v) => update('email', v)}
                  keyboardType="email-address" autoCapitalize="none" />
                <Field icon="call-outline" label="Mobile Number" placeholder="10-digit mobile number"
                  value={form.phone} onChangeText={(v) => update('phone', v)}
                  keyboardType="phone-pad" />
                <Field icon="card-outline" label="PAN Number (Optional)" placeholder="e.g. ABCDE1234F"
                  value={form.panNumber} onChangeText={(v) => update('panNumber', v)}
                  autoCapitalize="characters" />
                <Field icon="location-outline" label="Address (Optional)" placeholder="Your address"
                  value={form.address} onChangeText={(v) => update('address', v)}
                  multiline />

                <TouchableOpacity style={styles.nextBtn} onPress={validateStep1}>
                  <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.btnGrad}>
                    <Text style={styles.btnText}>Next</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.securityNote}>
                  <Ionicons name="shield-checkmark" size={14} color={COLORS.success} /> Secure your account with a strong password
                </Text>

                <PasswordField label="Password" placeholder="Min 6 characters"
                  value={form.password} onChangeText={(v) => update('password', v)}
                  show={showPassword} toggle={() => setShowPassword(!showPassword)} />
                <PasswordField label="Confirm Password" placeholder="Re-enter password"
                  value={form.confirmPassword} onChangeText={(v) => update('confirmPassword', v)}
                  show={showPassword} toggle={() => setShowPassword(!showPassword)} />

                <View style={styles.termsRow}>
                  <Text style={styles.termsText}>
                    By creating an account, you agree to our{' '}
                    <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                    <Text style={styles.termsLink}>Privacy Policy</Text>
                  </Text>
                </View>

                <TouchableOpacity style={styles.nextBtn} onPress={validateStep2} disabled={loading}>
                  <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.btnGrad}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.loginRow} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginText}>Already have an account? <Text style={styles.loginLink}>Sign In</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function Field({ icon, label, value, onChangeText, placeholder, keyboardType, autoCapitalize, multiline }) {
  return (
    <View style={fieldStyles.group}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={fieldStyles.wrap}>
        <Ionicons name={icon} size={18} color={COLORS.textMuted} style={fieldStyles.icon} />
        <TextInput
          style={[fieldStyles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'words'}
          multiline={multiline}
        />
      </View>
    </View>
  );
}

function PasswordField({ label, value, onChangeText, placeholder, show, toggle }) {
  return (
    <View style={fieldStyles.group}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={fieldStyles.wrap}>
        <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={fieldStyles.icon} />
        <TextInput
          style={[fieldStyles.input, { paddingRight: 48 }]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!show}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={toggle} style={fieldStyles.eye}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  group: { marginBottom: SPACING.md },
  label: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 6 },
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
  },
  icon: { padding: 12 },
  input: { flex: 1, color: COLORS.text, fontSize: 14, paddingVertical: 13, paddingRight: 12 },
  eye: { padding: 12, position: 'absolute', right: 0 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: SPACING.md, paddingTop: 50 },
  backBtn: { marginBottom: SPACING.md },
  header: { alignItems: 'center', marginBottom: SPACING.lg },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginTop: 8 },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  stepRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.lg, gap: SPACING.xl, position: 'relative',
  },
  stepLine: {
    position: 'absolute', height: 2, backgroundColor: COLORS.border,
    left: '30%', right: '30%', top: 20,
  },
  stepItem: { alignItems: 'center', zIndex: 1 },
  stepCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
  },
  stepCircleActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepNum: { color: COLORS.textMuted, fontWeight: '700' },
  stepNumActive: { color: '#fff' },
  stepLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  stepLabelActive: { color: COLORS.primary },
  card: {
    backgroundColor: COLORS.card, borderRadius: 20,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border,
  },
  securityNote: { color: COLORS.success, fontSize: 13, marginBottom: SPACING.md },
  nextBtn: { borderRadius: RADIUS.md, overflow: 'hidden', marginTop: SPACING.sm },
  btnGrad: { paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  termsRow: { marginBottom: SPACING.md },
  termsText: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  termsLink: { color: COLORS.primary },
  loginRow: { alignItems: 'center', marginTop: SPACING.md },
  loginText: { color: COLORS.textSecondary, fontSize: 14 },
  loginLink: { color: COLORS.primary, fontWeight: '700' },
});
