import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import { COLORS, SPACING, RADIUS } from '../../utils/theme';
import { formatDate, maskPhone } from '../../utils/helpers';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: user?.fullName || '', address: user?.address || '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await userAPI.updateProfile(form);
      updateUser(res.data.data);
      setEditing(false);
      Alert.alert('Saved', 'Profile updated successfully');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = user?.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <LinearGradient colors={[COLORS.secondary, COLORS.background]} style={styles.header}>
        <View style={styles.avatarWrap}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          {user?.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            </View>
          )}
        </View>
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.memberChip}>
          <Ionicons name="diamond" size={12} color={COLORS.primary} />
          <Text style={styles.memberText}>DigiGold Member</Text>
        </View>
      </LinearGradient>

      {/* Gold Summary */}
      <View style={styles.section}>
        <View style={styles.summaryRow}>
          {[
            { label: 'Total Gold', value: `${(user?.totalGoldGrams || 0).toFixed(4)}g`, icon: 'diamond' },
            { label: 'Invested (INR)', value: `₹${(user?.totalInvestedINR || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: 'wallet' },
            { label: 'Invested (USD)', value: `$${(user?.totalInvestedUSD || 0).toFixed(2)}`, icon: 'cash' },
          ].map(({ label, value, icon }) => (
            <View key={label} style={styles.summaryCard}>
              <Ionicons name={icon} size={18} color={COLORS.primary} style={{ marginBottom: 4 }} />
              <Text style={styles.summaryValue}>{value}</Text>
              <Text style={styles.summaryLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Profile Info */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <TouchableOpacity onPress={() => editing ? handleSave() : setEditing(true)} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.editBtn}>{editing ? 'Save' : 'Edit'}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          {[
            { icon: 'person-outline', label: 'Full Name', value: user?.fullName, field: 'fullName', editable: true },
            { icon: 'mail-outline', label: 'Email', value: user?.email, editable: false },
            { icon: 'call-outline', label: 'Phone', value: maskPhone(user?.phone), editable: false },
            { icon: 'calendar-outline', label: 'Member Since', value: formatDate(user?.createdAt), editable: false },
            { icon: 'card-outline', label: 'PAN Number', value: user?.panNumber || 'Not provided', editable: false },
            { icon: 'location-outline', label: 'Address', value: user?.address || 'Not provided', field: 'address', editable: true },
          ].map(({ icon, label, value, field, editable }) => (
            <View key={label} style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name={icon} size={16} color={COLORS.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{label}</Text>
                {editing && editable && field ? (
                  <TextInput
                    style={styles.infoInput}
                    value={form[field]}
                    onChangeText={(v) => setForm({ ...form, [field]: v })}
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="words"
                  />
                ) : (
                  <Text style={styles.infoValue}>{value}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}><Ionicons name="cash-outline" size={16} color={COLORS.primary} /></View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Preferred Currency</Text>
              <Text style={styles.infoValue}>{user?.preferredCurrency || 'INR'}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}><Ionicons name="shield-checkmark-outline" size={16} color={COLORS.success} /></View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Account Status</Text>
              <Text style={[styles.infoValue, { color: COLORS.success }]}>
                {user?.isVerified ? 'Verified' : 'Pending Verification'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>DigiGold v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 50, paddingBottom: SPACING.xl, alignItems: 'center' },
  avatarWrap: { position: 'relative', marginBottom: SPACING.md },
  avatar: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.background, borderRadius: 12 },
  name: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  email: { color: COLORS.textMuted, fontSize: 14, marginTop: 4 },
  memberChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: SPACING.sm, backgroundColor: 'rgba(201,168,76,0.15)',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.round,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)',
  },
  memberText: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },
  section: { paddingHorizontal: SPACING.md, marginTop: SPACING.md },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: SPACING.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  editBtn: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  summaryRow: { flexDirection: 'row', gap: SPACING.sm },
  summaryCard: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    padding: SPACING.sm, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  summaryValue: { color: COLORS.text, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  summaryLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 2, textAlign: 'center' },
  infoCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(201,168,76,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  infoContent: { flex: 1 },
  infoLabel: { color: COLORS.textMuted, fontSize: 11, marginBottom: 3 },
  infoValue: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  infoInput: { color: COLORS.text, fontSize: 14, fontWeight: '600', borderBottomWidth: 1, borderBottomColor: COLORS.primary, paddingVertical: 2 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(231,76,60,0.1)', borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(231,76,60,0.3)',
  },
  logoutText: { color: COLORS.error, fontSize: 16, fontWeight: '700' },
  version: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', marginTop: SPACING.lg },
});
