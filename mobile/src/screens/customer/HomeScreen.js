import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { goldAPI } from '../../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { formatCurrency, formatGrams, formatDateTime, getGreeting, getProfitColor } from '../../utils/helpers';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [goldPrice, setGoldPrice] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [portRes, txRes] = await Promise.all([
        goldAPI.getPortfolio(),
        goldAPI.getTransactions({ limit: 5 }),
      ]);
      setPortfolio(portRes.data.data);
      setGoldPrice(portRes.data.data.goldPrice);
      setTransactions(txRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your portfolio...</Text>
      </View>
    );
  }

  const profit = portfolio?.profitINR || 0;
  const profitPct = portfolio?.profitPercent || 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {/* Header */}
      <LinearGradient colors={[COLORS.secondary, COLORS.background]} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.fullName?.split(' ')[0]} 👋</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Live Gold Price Banner */}
        {goldPrice && (
          <View style={styles.priceBanner}>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Gold (INR/g)</Text>
              <Text style={styles.priceValue}>₹{goldPrice.goldInrPerGram?.toFixed(2)}</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Gold (USD/g)</Text>
              <Text style={styles.priceValue}>${goldPrice.goldUsdPerGram?.toFixed(4)}</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>USD/INR</Text>
              <Text style={styles.priceValue}>₹{goldPrice.usdToInr}</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Portfolio Card */}
      <View style={styles.section}>
        <LinearGradient
          colors={['#2A1A00', '#1A1A2E']}
          style={styles.portfolioCard}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <View style={styles.goldIconRow}>
            <Ionicons name="diamond" size={20} color={COLORS.primary} />
            <Text style={styles.portfolioLabel}>My Gold Portfolio</Text>
            <View style={[styles.profitBadge, { backgroundColor: profit >= 0 ? 'rgba(39,174,96,0.2)' : 'rgba(231,76,60,0.2)' }]}>
              <Ionicons name={profit >= 0 ? 'trending-up' : 'trending-down'} size={12} color={getProfitColor(profit)} />
              <Text style={[styles.profitBadgeText, { color: getProfitColor(profit) }]}>
                {profitPct >= 0 ? '+' : ''}{profitPct}%
              </Text>
            </View>
          </View>

          <Text style={styles.goldGrams}>{formatGrams(portfolio?.totalGoldGrams || 0, 4)}</Text>
          <Text style={styles.goldLabel}>Total Gold Held</Text>

          <View style={styles.valueRow}>
            <View style={styles.valueItem}>
              <Text style={styles.valueLabel}>Current Value (INR)</Text>
              <Text style={styles.valueAmount}>{formatCurrency(portfolio?.currentValueINR || 0, 'INR')}</Text>
            </View>
            <View style={styles.valueDivider} />
            <View style={styles.valueItem}>
              <Text style={styles.valueLabel}>Current Value (USD)</Text>
              <Text style={styles.valueAmount}>{formatCurrency(portfolio?.currentValueUSD || 0, 'USD')}</Text>
            </View>
          </View>

          <View style={[styles.profitRow, { borderTopColor: 'rgba(255,255,255,0.1)' }]}>
            <Text style={styles.investedText}>
              Invested: {formatCurrency(portfolio?.totalInvestedINR || 0, 'INR')}
            </Text>
            <Text style={[styles.profitText, { color: getProfitColor(profit) }]}>
              {profit >= 0 ? '+' : ''}{formatCurrency(Math.abs(profit), 'INR')}
            </Text>
          </View>
        </LinearGradient>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {[
            { icon: 'add-circle', label: 'Buy Gold', color: COLORS.success, screen: 'Invest', params: { mode: 'BUY' } },
            { icon: 'remove-circle', label: 'Sell Gold', color: COLORS.error, screen: 'Invest', params: { mode: 'SELL' } },
            { icon: 'stats-chart', label: 'Portfolio', color: COLORS.info, screen: 'Portfolio' },
            { icon: 'receipt', label: 'History', color: COLORS.warning, screen: 'Transactions' },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionCard}
              onPress={() => navigation.navigate(action.screen, action.params)}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '22' }]}>
                <Ionicons name={action.icon} size={28} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {transactions.map((txn) => (
            <View key={txn._id} style={styles.txnCard}>
              <View style={[styles.txnIcon, { backgroundColor: txn.type === 'BUY' ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.15)' }]}>
                <Ionicons
                  name={txn.type === 'BUY' ? 'arrow-down-circle' : 'arrow-up-circle'}
                  size={24}
                  color={txn.type === 'BUY' ? COLORS.success : COLORS.error}
                />
              </View>
              <View style={styles.txnInfo}>
                <Text style={styles.txnType}>{txn.type === 'BUY' ? 'Gold Purchase' : 'Gold Sold'}</Text>
                <Text style={styles.txnDate}>{formatDateTime(txn.createdAt)}</Text>
              </View>
              <View style={styles.txnAmounts}>
                <Text style={[styles.txnAmount, { color: txn.type === 'BUY' ? COLORS.error : COLORS.success }]}>
                  {txn.type === 'BUY' ? '-' : '+'}{formatCurrency(txn.amountPaid, txn.currency)}
                </Text>
                <Text style={styles.txnGrams}>{formatGrams(txn.goldGrams)}</Text>
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
  loadingText: { color: COLORS.textMuted, marginTop: SPACING.md },
  header: { paddingHorizontal: SPACING.md, paddingTop: 50, paddingBottom: SPACING.md },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  greeting: { color: COLORS.textMuted, fontSize: 14 },
  userName: { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  notifBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  priceBanner: {
    flexDirection: 'row', backgroundColor: COLORS.card,
    borderRadius: RADIUS.md, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center',
  },
  priceItem: { flex: 1, alignItems: 'center' },
  priceLabel: { color: COLORS.textMuted, fontSize: 11, marginBottom: 3 },
  priceValue: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
  priceDivider: { width: 1, height: 36, backgroundColor: COLORS.border },
  section: { paddingHorizontal: SPACING.md, marginTop: SPACING.md },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700', marginBottom: SPACING.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  viewAll: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  portfolioCard: { borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' },
  goldIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.sm },
  portfolioLabel: { flex: 1, color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  profitBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.round },
  profitBadgeText: { fontSize: 11, fontWeight: '700' },
  goldGrams: { fontSize: 42, fontWeight: '900', color: COLORS.primary, letterSpacing: -1 },
  goldLabel: { color: COLORS.textMuted, fontSize: 13, marginBottom: SPACING.md },
  valueRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: SPACING.md },
  valueItem: { flex: 1 },
  valueDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: SPACING.md },
  valueLabel: { color: COLORS.textMuted, fontSize: 11, marginBottom: 3 },
  valueAmount: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  profitRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, marginTop: SPACING.md, paddingTop: SPACING.sm },
  investedText: { color: COLORS.textMuted, fontSize: 12 },
  profitText: { fontSize: 13, fontWeight: '700' },
  actionsGrid: { flexDirection: 'row', gap: SPACING.sm },
  actionCard: {
    flex: 1, backgroundColor: COLORS.card,
    borderRadius: RADIUS.md, padding: SPACING.md,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  actionIcon: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { color: COLORS.text, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  txnCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
    borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  txnIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  txnInfo: { flex: 1 },
  txnType: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  txnDate: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  txnAmounts: { alignItems: 'flex-end' },
  txnAmount: { fontSize: 14, fontWeight: '700' },
  txnGrams: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
});
