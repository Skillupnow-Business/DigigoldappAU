import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { goldAPI } from '../../services/api';
import { COLORS, SPACING, RADIUS } from '../../utils/theme';
import { formatCurrency, formatGrams, getProfitColor } from '../../utils/helpers';

export default function PortfolioScreen() {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    try {
      const res = await goldAPI.getPortfolio();
      setPortfolio(res.data.data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetch(); }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  const p = portfolio;
  const profit = p?.profitINR || 0;
  const profitPct = p?.profitPercent || 0;
  const isUp = profit >= 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={COLORS.primary} />}
    >
      <LinearGradient colors={[COLORS.secondary, COLORS.background]} style={styles.header}>
        <Text style={styles.headerTitle}>My Portfolio</Text>
        <Text style={styles.headerSub}>Real-time gold investment tracker</Text>
      </LinearGradient>

      {/* Gold Balance */}
      <View style={styles.section}>
        <LinearGradient colors={['#2A1A00', '#1A1A2E']} style={styles.balanceCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.balanceLabel}>Total Gold Balance</Text>
          <Text style={styles.balanceGrams}>{formatGrams(p?.totalGoldGrams || 0, 4)}</Text>
          <View style={[styles.profitChip, { backgroundColor: isUp ? 'rgba(39,174,96,0.2)' : 'rgba(231,76,60,0.2)' }]}>
            <Ionicons name={isUp ? 'trending-up' : 'trending-down'} size={14} color={getProfitColor(profit)} />
            <Text style={[styles.profitChipText, { color: getProfitColor(profit) }]}>
              {profitPct >= 0 ? '+' : ''}{profitPct}% overall return
            </Text>
          </View>
        </LinearGradient>
      </View>

      {/* INR Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Indian Rupee (INR)</Text>
        <View style={styles.statsGrid}>
          {[
            { label: 'Invested', value: formatCurrency(p?.totalInvestedINR, 'INR'), icon: 'wallet-outline' },
            { label: 'Current Value', value: formatCurrency(p?.currentValueINR, 'INR'), icon: 'cash-outline' },
            { label: 'Profit / Loss', value: `${profit >= 0 ? '+' : ''}${formatCurrency(Math.abs(profit), 'INR')}`, icon: profit >= 0 ? 'trending-up' : 'trending-down', color: getProfitColor(profit) },
            { label: 'Gold Price/g', value: `₹${p?.goldPrice?.goldInrPerGram?.toFixed(2)}`, icon: 'pricetag-outline' },
          ].map(({ label, value, icon, color }) => (
            <View key={label} style={styles.statCard}>
              <Ionicons name={icon} size={22} color={color || COLORS.primary} style={{ marginBottom: 6 }} />
              <Text style={styles.statLabel}>{label}</Text>
              <Text style={[styles.statValue, color && { color }]}>{value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* USD Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>US Dollar (USD)</Text>
        <View style={styles.statsGrid}>
          {[
            { label: 'Invested', value: formatCurrency(p?.totalInvestedUSD, 'USD'), icon: 'wallet-outline' },
            { label: 'Current Value', value: formatCurrency(p?.currentValueUSD, 'USD'), icon: 'cash-outline' },
            { label: 'Profit / Loss', value: `${p?.profitUSD >= 0 ? '+' : ''}${formatCurrency(Math.abs(p?.profitUSD || 0), 'USD')}`, icon: p?.profitUSD >= 0 ? 'trending-up' : 'trending-down', color: getProfitColor(p?.profitUSD) },
            { label: 'Gold Price/g', value: `$${p?.goldPrice?.goldUsdPerGram?.toFixed(4)}`, icon: 'pricetag-outline' },
          ].map(({ label, value, icon, color }) => (
            <View key={label} style={styles.statCard}>
              <Ionicons name={icon} size={22} color={color || COLORS.info} style={{ marginBottom: 6 }} />
              <Text style={styles.statLabel}>{label}</Text>
              <Text style={[styles.statValue, color && { color }]}>{value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Exchange Rate */}
      <View style={styles.section}>
        <View style={styles.rateCard}>
          <Ionicons name="swap-horizontal" size={20} color={COLORS.primary} />
          <Text style={styles.rateText}>1 USD = ₹{p?.goldPrice?.usdToInr}</Text>
          <View style={styles.liveChip}>
            <Ionicons name="radio-button-on" size={10} color={COLORS.success} />
            <Text style={styles.liveText}>Live Rate</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.md, paddingTop: 50, paddingBottom: SPACING.lg },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  headerSub: { color: COLORS.textMuted, fontSize: 14, marginTop: 4 },
  section: { paddingHorizontal: SPACING.md, marginTop: SPACING.md },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: SPACING.sm },
  balanceCard: { borderRadius: RADIUS.xl, padding: SPACING.lg, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' },
  balanceLabel: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 8 },
  balanceGrams: { fontSize: 52, fontWeight: '900', color: COLORS.primary },
  profitChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.round, marginTop: SPACING.sm },
  profitChipText: { fontSize: 13, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  statCard: {
    width: '47%', backgroundColor: COLORS.card,
    borderRadius: RADIUS.md, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  statLabel: { color: COLORS.textMuted, fontSize: 11, marginBottom: 3 },
  statValue: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  rateCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  rateText: { flex: 1, color: COLORS.text, fontSize: 15, fontWeight: '700' },
  liveChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveText: { color: COLORS.success, fontSize: 11, fontWeight: '600' },
});
