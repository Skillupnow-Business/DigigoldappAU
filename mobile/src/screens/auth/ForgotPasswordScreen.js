import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../../services/api';
import { COLORS, SPACING, RADIUS } from '../../utils/theme';

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!email.trim()) return Alert.alert('Error', 'Enter your email address');
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword({ email: email.trim() });
      setUserId(res.data.userId);
      setStep(2);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (otp.length < 6) return Alert.alert('Error', 'Enter the 6-digit OTP');
    if (newPassword.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters');
    if (newPassword !== confirm) return Alert.alert('Error', 'Passwords do not match');
    setLoading(true);
    try {
      await authAPI.resetPassword({ userId, otp, newPassword });
      Alert.alert('Success', 'Password reset successfully!', [
        { text: 'Login Now', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[COLORS.background, COLORS.secondary]} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.content}>
          <Ionicons name="key" size={56} color={COLORS.primary} />
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {step === 1 ? 'Enter your email to receive OTP' : 'Enter OTP and new password'}
          </Text>

          <View style={styles.card}>
            {step === 1 ? (
              <>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={styles.icon} />
                  <TextInput
                    style={styles.input} placeholder="your@email.com"
                    placeholderTextColor={COLORS.textMuted}
                    value={email} onChangeText={setEmail}
                    keyboardType="email-address" autoCapitalize="none"
                  />
                </View>
                <TouchableOpacity style={styles.btn} onPress={handleSendOTP} disabled={loading}>
                  <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.btnGrad}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send OTP</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {[
                  { label: 'OTP', value: otp, setter: setOtp, placeholder: '6-digit OTP', keyboard: 'number-pad' },
                  { label: 'New Password', value: newPassword, setter: setNewPassword, placeholder: 'Min 6 characters', secure: true },
                  { label: 'Confirm Password', value: confirm, setter: setConfirm, placeholder: 'Re-enter password', secure: true },
                ].map(({ label, value, setter, placeholder, keyboard, secure }) => (
                  <View key={label} style={{ marginBottom: SPACING.md }}>
                    <Text style={styles.label}>{label}</Text>
                    <TextInput
                      style={styles.simpleInput}
                      placeholder={placeholder}
                      placeholderTextColor={COLORS.textMuted}
                      value={value} onChangeText={setter}
                      keyboardType={keyboard || 'default'}
                      secureTextEntry={secure}
                      autoCapitalize="none"
                    />
                  </View>
                ))}
                <TouchableOpacity style={styles.btn} onPress={handleReset} disabled={loading}>
                  <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.btnGrad}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Reset Password</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  back: { marginTop: 50, marginLeft: SPACING.md },
  content: { flex: 1, padding: SPACING.lg, alignItems: 'center', paddingTop: SPACING.xl },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginTop: SPACING.md },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 6, marginBottom: SPACING.lg, textAlign: 'center' },
  card: {
    width: '100%', backgroundColor: COLORS.card,
    borderRadius: 20, padding: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border,
  },
  label: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md,
  },
  icon: { padding: 12 },
  input: { flex: 1, color: COLORS.text, fontSize: 14, paddingVertical: 13 },
  simpleInput: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 13, color: COLORS.text, fontSize: 14,
  },
  btn: { borderRadius: RADIUS.md, overflow: 'hidden', marginTop: SPACING.sm },
  btnGrad: { paddingVertical: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
