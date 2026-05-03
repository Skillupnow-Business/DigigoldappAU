import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, RADIUS, FONTS } from '../../utils/theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!form.email.trim() || !form.password) {
      return Alert.alert('Error', 'Please fill all fields');
    }
    setLoading(true);
    try {
      const res = await authAPI.login({ email: form.email.trim().toLowerCase(), password: form.password });
      if (res.data.success) {
        await login(res.data.token, res.data.user);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Try again.';
      const data = err.response?.data;
      if (data?.requireVerification) {
        navigation.navigate('OTPVerify', { userId: data.userId, email: form.email });
      } else {
        Alert.alert('Login Failed', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[COLORS.background, COLORS.secondary]} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Ionicons name="diamond" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.appName}>DigiGold</Text>
            <Text style={styles.tagline}>Your Digital Gold Investment</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSubtitle}>Sign in to your account</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={COLORS.textMuted}
                  value={form.email}
                  onChangeText={(v) => setForm({ ...form, email: v })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { paddingRight: 48 }]}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.textMuted}
                  value={form.password}
                  onChangeText={(v) => setForm({ ...form, password: v })}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotWrap}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
              <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.btnGradient}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginBtnText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.signupBtn}
              onPress={() => navigation.navigate('SignUp')}
            >
              <Text style={styles.signupText}>New to DigiGold? <Text style={styles.signupLink}>Create Account</Text></Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.adminBtn}
              onPress={() => navigation.navigate('AdminLogin')}
            >
              <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.textMuted} />
              <Text style={styles.adminBtnText}>Admin Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: SPACING.md, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  logoCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderWidth: 2, borderColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.md,
  },
  appName: { fontSize: 36, fontWeight: '800', color: COLORS.primary, letterSpacing: 2 },
  tagline: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: SPACING.lg },
  inputGroup: { marginBottom: SPACING.md },
  label: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
  },
  inputIcon: { padding: 14 },
  input: {
    flex: 1, color: COLORS.text, fontSize: 15,
    paddingVertical: 14, paddingRight: 14,
  },
  eyeBtn: { padding: 14, position: 'absolute', right: 0 },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: SPACING.md },
  forgotText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  loginBtn: { borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: SPACING.md },
  btnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  loginBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.textMuted, marginHorizontal: SPACING.sm, fontSize: 12 },
  signupBtn: { alignItems: 'center', marginBottom: SPACING.md },
  signupText: { color: COLORS.textSecondary, fontSize: 14 },
  signupLink: { color: COLORS.primary, fontWeight: '700' },
  adminBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: SPACING.sm,
  },
  adminBtnText: { color: COLORS.textMuted, fontSize: 13 },
});
