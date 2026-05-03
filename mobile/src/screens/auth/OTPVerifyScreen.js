import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, RADIUS } from '../../utils/theme';

export default function OTPVerifyScreen({ navigation, route }) {
  const { login } = useAuth();
  const { userId, email } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const refs = useRef([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOTPChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    if (val && idx < 5) refs.current[idx + 1]?.focus();
    if (!val && idx > 0) refs.current[idx - 1]?.focus();
  };

  const handleVerify = async () => {
    const otpStr = otp.join('');
    if (otpStr.length < 6) return Alert.alert('Error', 'Enter the 6-digit OTP');
    setLoading(true);
    try {
      const res = await authAPI.verifyOTP({ userId, otp: otpStr });
      if (res.data.success) {
        Alert.alert('Verified!', 'Your account is ready.', [
          { text: 'Start Investing', onPress: () => login(res.data.token, res.data.user) },
        ]);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    try {
      await authAPI.resendOTP({ userId });
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      Alert.alert('OTP Resent', 'New OTP sent to your email and phone');
    } catch (err) {
      Alert.alert('Error', 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <LinearGradient colors={[COLORS.background, COLORS.secondary]} style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="mail" size={56} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit OTP to{'\n'}
          <Text style={styles.email}>{email}</Text>
          {'\n'}and your registered mobile number
        </Text>

        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(r) => (refs.current[i] = r)}
              style={[styles.otpBox, digit && styles.otpBoxFilled]}
              value={digit}
              onChangeText={(v) => handleOTPChange(v, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity style={styles.verifyBtn} onPress={handleVerify} disabled={loading}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.verifyGrad}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.verifyText}>Verify & Continue</Text>}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} disabled={countdown > 0 || resending} style={styles.resendBtn}>
          {resending ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={[styles.resendText, countdown > 0 && styles.resendDisabled]}>
              {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.tip}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} />
          <Text style={styles.tipText}>Check your spam/junk folder if you didn't receive the email</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  back: { marginTop: 50, marginLeft: SPACING.md },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl },
  iconWrap: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(201,168,76,0.12)',
    borderWidth: 2, borderColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg,
  },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.sm },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.xl },
  email: { color: COLORS.primary, fontWeight: '700' },
  otpRow: { flexDirection: 'row', gap: 10, marginBottom: SPACING.xl },
  otpBox: {
    width: 48, height: 58, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.border,
    textAlign: 'center', fontSize: 22, fontWeight: '700', color: COLORS.text,
  },
  otpBoxFilled: { borderColor: COLORS.primary, backgroundColor: 'rgba(201,168,76,0.1)' },
  verifyBtn: { width: '100%', borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: SPACING.md },
  verifyGrad: { paddingVertical: 16, alignItems: 'center' },
  verifyText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resendBtn: { paddingVertical: SPACING.sm, marginBottom: SPACING.lg },
  resendText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  resendDisabled: { color: COLORS.textMuted },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.md },
  tipText: { color: COLORS.textMuted, fontSize: 12, flex: 1, lineHeight: 18 },
});
