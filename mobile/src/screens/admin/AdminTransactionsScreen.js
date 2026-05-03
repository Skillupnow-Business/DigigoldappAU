import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '../../services/api';
import { COLORS, SPACING, RADIUS } from '../../utils/theme';
import { formatCurrency, formatGrams, formatDateTime } from '../../utils/helpers';

const FILTERS = ['ALL', 'BUY', 'SELL', 'WITHDRAW'];

const TYPE_CONFIG = {
  BUY:      { icon: 'arrow-down-circle', color: COLORS.success, bg: 'rgba(39,174,96,0.15)' },
  SELL:     { icon: 'arrow-up-circle',   color: COLORS.error,   bg: 'rgba(231,76,60,0.15)' },
  WITHDRAW: { icon: 'wallet-outline',    color: COLORS.warning,  bg: 'rgba(243,156,18,0.15)' },
};

const STATUS_COLOR = {
  SUCCESS: COLORS.success,
  PENDING: COLORS.warning,
  FAILED:  COLORS.error,
};

export default function AdminTransactionsScreen() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetch = useCallback(async (p = 1, type = 'ALL', refresh = false) => {
    try {
      const params = { page: p, limit: 20 };
      if (type !== 'ALL') params.type = type;

      const res = await adminAPI.getTransactions(params);
      const data = res.data.data;

      if (refresh || p === 1) setTransactions(data);
      else setTransactions((prev) => [...prev, ...data]);

      setHasMore(p < res.data.pagination.pages);
      setTotal(res.data.pagination.total);
      setPage(p);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetch(1, filter, true); }, [fetch, filter]);

  const handleFilter = (type) => {
    if (type === filter) return;
    setFilter(type);
    setLoading(true);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetch(1, filter, true);
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetch(page + 1, filter);
  };

  const renderItem = ({ item: txn }) => {
    const cfg = TYPE_CONFIG[txn.type] || TYPE_CONFIG.BUY;
    return (
      <View style={styles.card}>
        <View style={[styles.typeIcon, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={20} color={cfg.color} />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {txn.userId?.fullName || 'Unknown'}
            </Text>
            <Text style={[styles.amount, { color: cfg.color }]}>
              {formatCurrency(txn.amountPaid, txn.currency)}
            </Text>
          </View>

          <View style={styles.cardRow}>
            <Text style={styles.txnId} numberOfLines={1}>{txn.transactionId}</Text>
            <Text style={styles.grams}>{formatGrams(txn.goldGrams, 4)}</Text>
          </View>

          <View style={styles.cardRow}>
            <Text style={styles.date}>{formatDateTime(txn.createdAt)}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.typeBadge, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.typeBadgeText, { color: cfg.color }]}>{txn.type}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[txn.status] + '22' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLOR[txn.status] }]}>
                  {txn.status}
                </Text>
              </View>
            </View>
          </View>

          {txn.userId?.email && (
            <Text style={styles.email} numberOfLines={1}>{txn.userId.email}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1A0A00', '#0F0F1A']} style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
        <Text style={styles.headerSub}>{total} total transactions</Text>
      </LinearGradient>

      {/* Filter bar */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => handleFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 12 }} /> : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="swap-horizontal-outline" size={60} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No transactions found</Text>
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
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.primary },
  headerSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 3 },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterBtn: {
    flex: 1, paddingVertical: 8, borderRadius: RADIUS.round,
    alignItems: 'center', backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.border,
  },
  filterBtnActive: {
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderColor: COLORS.primary,
  },
  filterText: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted },
  filterTextActive: { color: COLORS.primary },

  card: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    padding: SPACING.sm, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  typeIcon: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginRight: SPACING.sm, marginTop: 2,
  },
  cardBody: { flex: 1 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  userName: { color: COLORS.text, fontSize: 13, fontWeight: '700', flex: 1, marginRight: 8 },
  amount: { fontSize: 14, fontWeight: '800' },
  txnId: { color: COLORS.textMuted, fontSize: 10, flex: 1, marginRight: 8 },
  grams: { color: COLORS.primary, fontSize: 11, fontWeight: '600' },
  date: { color: COLORS.textMuted, fontSize: 10 },
  statusRow: { flexDirection: 'row', gap: 4 },
  typeBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: RADIUS.round },
  typeBadgeText: { fontSize: 9, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: RADIUS.round },
  statusText: { fontSize: 9, fontWeight: '700' },
  email: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },

  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: COLORS.textMuted, fontSize: 16, marginTop: SPACING.md },
});
