import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authAPI, setAdminToken } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, RADIUS } from '../../utils/theme';

export default function AdminLoginScreen({ navigation }) {
  const { adminLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) return Alert.alert('Error', 'Enter admin credentials');
    setLoading(true);
    try {
      const res = await authAPI.adminLogin({ email: email.trim(), password });
      if (res.data.success) {
        await setAdminToken(res.data.token);
        await adminLogin(res.data.token);
      }
    } catch (err) {
      Alert.alert('Access Denied', err.response?.data?.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#1A0A00', '#0F0F1A']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.shieldWrap}>
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.shield}>
              <Ionicons name="shield-checkmark" size={52} color="#fff" />
            </LinearGradient>
          </View>

          <Text style={styles.title}>Admin Portal</Text>
          <Text style={styles.subtitle}>Authorized personnel only</Text>

          <View style={styles.card}>
            <View style={styles.warningBanner}>
              <Ionicons name="warning-outline" size={16} color={COLORS.warning} />
              <Text style={styles.warningText}>This area is restricted to administrators only</Text>
            </View>

            <Text style={styles.label}>Admin Email</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="admin@digigold.com"
                placeholderTextColor={COLORS.textMuted}
                value={email} onChangeText={setEmail}
                keyboardType="email-address" autoCapitalize="none"
              />
            </View>

            <Text style={styles.label}>Admin Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.icon} />
              <TextInput
                style={[styles.input, { paddingRight: 48 }]}
                placeholder="Enter admin password"
                placeholderTextColor={COLORS.textMuted}
                value={password} onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity style={styles.eye} onPress={() => setShowPass(!showPass)}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
              <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.loginGrad}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
                    <Text style={styles.loginBtnText}>Admin Login</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  back: { marginTop: 50, marginLeft: SPACING.md },
  content: { flex: 1, padding: SPACING.lg, alignItems: 'center', justifyContent: 'center' },
  shieldWrap: { marginBottom: SPACING.lg },
  shield: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  subtitle: { color: COLORS.textMuted, fontSize: 14, marginBottom: SPACING.xl },
  card: {
    width: '100%', backgroundColor: '#1A0A00',
    borderRadius: 20, padding: SPACING.lg,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)',
  },
  warningBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(243,156,18,0.1)', borderRadius: RADIUS.md,
    padding: SPACING.sm, marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: 'rgba(243,156,18,0.3)',
  },
  warningText: { color: COLORS.warning, fontSize: 12, flex: 1 },
  label: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md,
  },
  icon: { padding: 12 },
  input: { flex: 1, color: COLORS.text, fontSize: 14, paddingVertical: 13 },
  eye: { padding: 12, position: 'absolute', right: 0 },
  loginBtn: { borderRadius: RADIUS.md, overflow: 'hidden', marginTop: SPACING.sm },
  loginGrad: { paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
