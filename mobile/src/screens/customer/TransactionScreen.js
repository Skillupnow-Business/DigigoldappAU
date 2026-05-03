import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { goldAPI } from '../../services/api';
import { COLORS, SPACING, RADIUS } from '../../utils/theme';
import { formatCurrency, formatGrams, formatDateTime } from '../../utils/helpers';

export default function TransactionScreen() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const fetch = useCallback(async (p = 1, refresh = false) => {
    try {
      const res = await goldAPI.getTransactions({ page: p, limit: 20 });
      const data = res.data.data;
      if (refresh || p === 1) setTransactions(data);
      else setTransactions((prev) => [...prev, ...data]);
      setHasMore(p < res.data.pagination.pages);
      setPage(p);
    } catch {}
    finally { setLoading(false); setRefreshing(false); setLoadingMore(false); }
  }, []);

  useEffect(() => { fetch(1, true); }, [fetch]);

  const onRefresh = () => { setRefreshing(true); fetch(1, true); };
  const onEndReached = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      fetch(page + 1);
    }
  };

  const filtered = filter === 'ALL' ? transactions : transactions.filter((t) => t.type === filter);

  const renderItem = ({ item: txn }) => (
    <View style={styles.txnCard}>
      <View style={[styles.txnIcon, { backgroundColor: txn.type === 'BUY' ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.15)' }]}>
        <Ionicons
          name={txn.type === 'BUY' ? 'arrow-down-circle' : 'arrow-up-circle'}
          size={28}
          color={txn.type === 'BUY' ? COLORS.success : COLORS.error}
        />
      </View>
      <View style={styles.txnInfo}>
        <Text style={styles.txnType}>{txn.type === 'BUY' ? 'Gold Purchase' : 'Gold Sold'}</Text>
        <Text style={styles.txnId} numberOfLines={1}>#{txn.transactionId}</Text>
        <Text style={styles.txnDate}>{formatDateTime(txn.createdAt)}</Text>
      </View>
      <View style={styles.txnRight}>
        <Text style={[styles.txnAmount, { color: txn.type === 'BUY' ? COLORS.error : COLORS.success }]}>
          {txn.type === 'BUY' ? '-' : '+'}{formatCurrency(txn.amountPaid, txn.currency)}
        </Text>
        <View style={styles.gramsChip}>
          <Ionicons name="diamond" size={10} color={COLORS.primary} />
          <Text style={styles.txnGrams}>{formatGrams(txn.goldGrams, 4)}</Text>
        </View>
        <View style={[styles.statusChip, { backgroundColor: txn.status === 'SUCCESS' ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.15)' }]}>
          <Text style={[styles.statusText, { color: txn.status === 'SUCCESS' ? COLORS.success : COLORS.error }]}>
            {txn.status}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.secondary, COLORS.background]} style={styles.header}>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <Text style={styles.headerSub}>{transactions.length} transactions</Text>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {['ALL', 'BUY', 'SELL'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.md }} /> : null}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={64} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubText}>Start investing in gold to see your history</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: SPACING.md, paddingTop: 50, paddingBottom: SPACING.md },
  headerTitle: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  headerSub: { color: COLORS.textMuted, fontSize: 13, marginTop: 3 },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: SPACING.md,
    gap: SPACING.sm, paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  filterBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: 8,
    borderRadius: RADIUS.round, backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.border,
  },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterBtnText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  filterBtnTextActive: { color: '#fff' },
  txnCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  txnIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  txnInfo: { flex: 1 },
  txnType: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  txnId: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  txnDate: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  txnRight: { alignItems: 'flex-end', gap: 4 },
  txnAmount: { fontSize: 14, fontWeight: '800' },
  gramsChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  txnGrams: { color: COLORS.primary, fontSize: 11, fontWeight: '600' },
  statusChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: RADIUS.round },
  statusText: { fontSize: 10, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginTop: SPACING.md },
  emptySubText: { color: COLORS.textMuted, fontSize: 13, marginTop: 6, textAlign: 'center' },
});
