import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, RADIUS } from '../../utils/theme';
import { formatCurrency, formatGrams, formatDateTime } from '../../utils/helpers';

export default function AdminDashboardScreen() {
  const { logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    try {
      const res = await adminAPI.getDashboard();
      setData(res.data.data);
    } catch (err) {
      if (err.response?.status === 401) logout();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetch(); }, []);
  const onRefresh = () => { setRefreshing(true); fetch(); };

  const handleLogout = () => {
    Alert.alert('Logout', 'Logout from admin panel?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  const stats = data?.stats || {};

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {/* Admin Header */}
      <LinearGradient colors={['#1A0A00', '#0F0F1A']} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerSub}>DigiGold Management Portal</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        {/* Live Gold Price */}
        {data?.goldPrice && (
          <View style={styles.goldPriceRow}>
            <Ionicons name="diamond" size={14} color={COLORS.primary} />
            <Text style={styles.goldPriceText}>
              Gold: ₹{data.goldPrice.goldInrPerGram?.toFixed(2)}/g · ${data.goldPrice.goldUsdPerGram?.toFixed(4)}/g
            </Text>
            <View style={styles.liveChip}>
              <Ionicons name="radio-button-on" size={8} color={COLORS.success} />
              <Text style={styles.liveText}>{data.goldPrice.source === 'live' ? 'LIVE' : 'CACHED'}</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Stats Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Platform Overview</Text>
        <View style={styles.statsGrid}>
          {[
            { label: 'Total Users', value: stats.totalUsers || 0, icon: 'people', color: COLORS.info },
            { label: 'Active Users', value: stats.activeUsers || 0, icon: 'person-check', color: COLORS.success },
            { label: 'Total Buys', value: stats.buyTransactions || 0, icon: 'arrow-down-circle', color: COLORS.success },
            { label: 'Total Sells', value: stats.sellTransactions || 0, icon: 'arrow-up-circle', color: COLORS.error },
            { label: 'Gold Held (g)', value: formatGrams(stats.totalGoldGrams || 0, 2), icon: 'diamond', color: COLORS.primary },
            { label: 'Revenue (INR)', value: formatCurrency(stats.totalRevenueINR || 0, 'INR', 0), icon: 'cash', color: COLORS.warning },
          ].map(({ label, value, icon, color }) => (
            <View key={label} style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: color + '22' }]}>
                <Ionicons name={icon} size={22} color={color} />
              </View>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Transactions */}
      {data?.recentTransactions?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {data.recentTransactions.slice(0, 8).map((txn) => (
            <View key={txn._id} style={styles.txnCard}>
              <View style={[styles.txnIcon, { backgroundColor: txn.type === 'BUY' ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.15)' }]}>
                <Ionicons name={txn.type === 'BUY' ? 'arrow-down' : 'arrow-up'} size={16} color={txn.type === 'BUY' ? COLORS.success : COLORS.error} />
              </View>
              <View style={styles.txnInfo}>
                <Text style={styles.txnUser} numberOfLines={1}>{txn.userId?.fullName || 'Unknown'}</Text>
                <Text style={styles.txnDate}>{formatDateTime(txn.createdAt)}</Text>
              </View>
              <View style={styles.txnRight}>
                <Text style={[styles.txnAmount, { color: txn.type === 'BUY' ? COLORS.success : COLORS.error }]}>
                  {formatCurrency(txn.amountPaid, txn.currency)}
                </Text>
                <Text style={styles.txnGrams}>{parseFloat(txn.goldGrams).toFixed(4)}g</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Recent Users */}
      {data?.recentUsers?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>New Members</Text>
          {data.recentUsers.map((u) => (
            <View key={u._id} style={styles.userCard}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {u.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{u.fullName}</Text>
                <Text style={styles.userEmail}>{u.email}</Text>
              </View>
              <View style={[styles.statusChip, { backgroundColor: u.isVerified ? 'rgba(39,174,96,0.15)' : 'rgba(243,156,18,0.15)' }]}>
                <Text style={[styles.statusText, { color: u.isVerified ? COLORS.success : COLORS.warning }]}>
                  {u.isVerified ? 'Verified' : 'Pending'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.md, paddingTop: 50, paddingBottom: SPACING.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.primary },
  headerSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 3 },
  logoutBtn: { padding: 8, backgroundColor: 'rgba(231,76,60,0.1)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(231,76,60,0.3)' },
  goldPriceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(201,168,76,0.1)', borderRadius: RADIUS.sm,
    padding: SPACING.sm, borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)',
  },
  goldPriceText: { flex: 1, color: COLORS.primary, fontSize: 12, fontWeight: '600' },
  liveChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  liveText: { color: COLORS.success, fontSize: 10, fontWeight: '700' },
  section: { paddingHorizontal: SPACING.md, marginTop: SPACING.md },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: SPACING.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  statCard: {
    width: '47%', backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'flex-start',
  },
  statIconWrap: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  txnCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
    borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  txnIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  txnInfo: { flex: 1 },
  txnUser: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  txnDate: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
  txnRight: { alignItems: 'flex-end' },
  txnAmount: { fontSize: 13, fontWeight: '700' },
  txnGrams: { color: COLORS.primary, fontSize: 10, marginTop: 2 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
    borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  userAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(201,168,76,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm,
  },
  userAvatarText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  userInfo: { flex: 1 },
  userName: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  userEmail: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  statusChip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADIUS.round },
  statusText: { fontSize: 11, fontWeight: '700' },
});
