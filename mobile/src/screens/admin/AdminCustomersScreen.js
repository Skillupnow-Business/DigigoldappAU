import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '../../services/api';
import { COLORS, SPACING, RADIUS } from '../../utils/theme';
import { formatDate, formatGrams } from '../../utils/helpers';

export default function AdminCustomersScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const fetch = useCallback(async (p = 1, q = '', refresh = false) => {
    try {
      const res = await adminAPI.getUsers({ page: p, limit: 20, search: q });
      const data = res.data.data;
      if (refresh || p === 1) setUsers(data);
      else setUsers((prev) => [...prev, ...data]);
      setHasMore(p < res.data.pagination.pages);
      setTotal(res.data.pagination.total);
      setPage(p);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetch(1, '', true); }, [fetch]);

  const handleSearch = useCallback((text) => {
    setSearch(text);
    fetch(1, text, true);
  }, [fetch]);

  const toggleStatus = async (userId, currentStatus, name) => {
    Alert.alert(
      currentStatus ? 'Suspend User' : 'Activate User',
      `${currentStatus ? 'Suspend' : 'Activate'} account for ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: currentStatus ? 'destructive' : 'default',
          onPress: async () => {
            try {
              const res = await adminAPI.toggleUserStatus(userId);
              setUsers((prev) =>
                prev.map((u) => u._id === userId ? { ...u, isActive: res.data.isActive } : u)
              );
            } catch {
              Alert.alert('Error', 'Failed to update user status');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item: user }) => (
    <View style={styles.userCard}>
      <View style={styles.avatarWrap}>
        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </Text>
        </LinearGradient>
        {user.isVerified && (
          <View style={styles.verifiedDot}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
          </View>
        )}
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.fullName}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <Text style={styles.userPhone}>{user.phone}</Text>
        <View style={styles.goldRow}>
          <Ionicons name="diamond" size={11} color={COLORS.primary} />
          <Text style={styles.goldText}>{formatGrams(user.totalGoldGrams, 4)} · Joined {formatDate(user.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <View style={[styles.statusChip, { backgroundColor: user.isActive ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.15)' }]}>
          <Text style={[styles.statusText, { color: user.isActive ? COLORS.success : COLORS.error }]}>
            {user.isActive ? 'Active' : 'Suspended'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.toggleBtn, { backgroundColor: user.isActive ? 'rgba(231,76,60,0.1)' : 'rgba(39,174,96,0.1)' }]}
          onPress={() => toggleStatus(user._id, user.isActive, user.fullName)}
        >
          <Ionicons name={user.isActive ? 'ban-outline' : 'checkmark-circle-outline'} size={16} color={user.isActive ? COLORS.error : COLORS.success} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1A0A00', '#0F0F1A']} style={styles.header}>
        <Text style={styles.headerTitle}>Customers</Text>
        <Text style={styles.headerSub}>{total} registered users</Text>
      </LinearGradient>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, phone..."
          placeholderTextColor={COLORS.textMuted}
          value={search} onChangeText={handleSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(1, search, true); }} tintColor={COLORS.primary} />}
          onEndReached={() => { if (!loading && hasMore) fetch(page + 1, search); }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={60} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No customers found</Text>
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
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    margin: SPACING.md, backgroundColor: COLORS.card,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
  },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, color: COLORS.text, paddingVertical: 12, fontSize: 14 },
  userCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    padding: SPACING.sm, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  avatarWrap: { position: 'relative', marginRight: SPACING.sm },
  avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  verifiedDot: { position: 'absolute', bottom: -2, right: -2, backgroundColor: COLORS.background, borderRadius: 8 },
  userInfo: { flex: 1 },
  userName: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  userEmail: { color: COLORS.textMuted, fontSize: 11, marginTop: 1 },
  userPhone: { color: COLORS.textMuted, fontSize: 11 },
  goldRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  goldText: { color: COLORS.primary, fontSize: 10, fontWeight: '600' },
  actions: { alignItems: 'flex-end', gap: 6 },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.round },
  statusText: { fontSize: 10, fontWeight: '700' },
  toggleBtn: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: COLORS.textMuted, fontSize: 16, marginTop: SPACING.md },
});
