import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { goldAPI } from '../../services/api';
import { COLORS, SPACING, RADIUS } from '../../utils/theme';
import { formatCurrency, formatGrams } from '../../utils/helpers';

const QUICK_AMOUNTS_INR = [500, 1000, 2000, 5000, 10000];
const QUICK_AMOUNTS_USD = [10, 25, 50, 100, 250];

export default function SaveGoldScreen({ route }) {
  const initialMode = route?.params?.mode || 'BUY';
  const [mode, setMode] = useState(initialMode);
  const [currency, setCurrency] = useState('INR');
  const [amount, setAmount] = useState('');
  const [grams, setGrams] = useState('');
  const [inputType, setInputType] = useState('AMOUNT');
  const [goldPrice, setGoldPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(true);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (goldPrice) calculatePreview();
  }, [amount, grams, currency, inputType, goldPrice, mode]);

  const fetchPrice = async () => {
    try {
      const res = await goldAPI.getPrice();
      setGoldPrice(res.data.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch gold price');
    } finally {
      setPriceLoading(false);
    }
  };

  const calculatePreview = () => {
    if (!goldPrice) return;
    const price = currency === 'INR' ? goldPrice.goldInrPerGram : goldPrice.goldUsdPerGram;
    if (inputType === 'AMOUNT' && amount) {
      const amt = parseFloat(amount);
      if (!isNaN(amt) && amt > 0) {
        setPreview({ goldGrams: (amt / price).toFixed(6), amount: amt });
      } else setPreview(null);
    } else if (inputType === 'GRAMS' && grams) {
      const g = parseFloat(grams);
      if (!isNaN(g) && g > 0) {
        setPreview({ goldGrams: g, amount: (g * price).toFixed(2) });
      } else setPreview(null);
    } else setPreview(null);
  };

  const handleTransaction = async () => {
    if (!preview) return Alert.alert('Error', 'Enter a valid amount or grams');
    if (mode === 'BUY' && parseFloat(preview.amount) < (currency === 'INR' ? 10 : 1)) {
      return Alert.alert('Error', `Minimum buy is ${currency === 'INR' ? '₹10' : '$1'}`);
    }

    const confirmMsg = mode === 'BUY'
      ? `Buy ${parseFloat(preview.goldGrams).toFixed(4)}g gold for ${formatCurrency(preview.amount, currency)}?`
      : `Sell ${parseFloat(preview.goldGrams).toFixed(4)}g gold for ${formatCurrency(preview.amount, currency)}?`;

    Alert.alert(
      `Confirm ${mode === 'BUY' ? 'Purchase' : 'Sale'}`,
      confirmMsg,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: executeTransaction },
      ]
    );
  };

  const executeTransaction = async () => {
    setLoading(true);
    try {
      let res;
      if (mode === 'BUY') {
        res = await goldAPI.buy({ amount: parseFloat(preview.amount), currency });
      } else {
        res = await goldAPI.sell({ grams: parseFloat(preview.goldGrams), currency });
      }
      if (res.data.success) {
        Alert.alert(
          mode === 'BUY' ? 'Gold Purchased!' : 'Gold Sold!',
          res.data.message + '\n\nA confirmation has been sent to your email & SMS.',
          [{ text: 'Great!', onPress: () => { setAmount(''); setGrams(''); setPreview(null); } }]
        );
      }
    } catch (err) {
      Alert.alert('Transaction Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const price = goldPrice ? (currency === 'INR' ? goldPrice.goldInrPerGram : goldPrice.goldUsdPerGram) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <LinearGradient colors={[COLORS.secondary, COLORS.background]} style={styles.header}>
        <Text style={styles.headerTitle}>Invest in Gold</Text>
        <Text style={styles.headerSub}>Safe. Transparent. Digital.</Text>
      </LinearGradient>

      {/* Mode Toggle */}
      <View style={styles.section}>
        <View style={styles.modeToggle}>
          {['BUY', 'SELL'].map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.modeBtn, mode === m && styles.modeBtnActive(m)]}
              onPress={() => setMode(m)}
            >
              <Ionicons
                name={m === 'BUY' ? 'add-circle-outline' : 'remove-circle-outline'}
                size={18}
                color={mode === m ? '#fff' : COLORS.textMuted}
              />
              <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
                {m === 'BUY' ? 'Buy Gold' : 'Sell Gold'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Live Price Card */}
      {priceLoading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.md }} />
      ) : goldPrice && (
        <View style={styles.section}>
          <View style={styles.priceCard}>
            <Ionicons name="pulse" size={16} color={COLORS.success} />
            <Text style={styles.liveDot}>LIVE</Text>
            <Text style={styles.priceCardText}>
              {currency === 'INR' ? `₹${goldPrice.goldInrPerGram?.toFixed(2)}` : `$${goldPrice.goldUsdPerGram?.toFixed(4)}`}
              <Text style={styles.perGram}> / gram</Text>
            </Text>
          </View>
        </View>
      )}

      {/* Currency Toggle */}
      <View style={styles.section}>
        <Text style={styles.label}>Currency</Text>
        <View style={styles.currencyRow}>
          {['INR', 'USD'].map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.currencyBtn, currency === c && styles.currencyBtnActive]}
              onPress={() => { setCurrency(c); setAmount(''); setGrams(''); }}
            >
              <Text style={[styles.currencyBtnText, currency === c && styles.currencyBtnTextActive]}>
                {c === 'INR' ? '₹ Indian Rupee' : '$ US Dollar'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Input Type Toggle */}
      <View style={styles.section}>
        <View style={styles.inputTypeRow}>
          {['AMOUNT', 'GRAMS'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.inputTypeBtn, inputType === t && styles.inputTypeBtnActive]}
              onPress={() => { setInputType(t); setAmount(''); setGrams(''); }}
            >
              <Text style={[styles.inputTypeBtnText, inputType === t && styles.inputTypeBtnTextActive]}>
                {t === 'AMOUNT' ? `Enter Amount (${currency === 'INR' ? '₹' : '$'})` : 'Enter Grams (g)'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Amount / Grams Input */}
      <View style={styles.section}>
        <View style={styles.amountCard}>
          <Text style={styles.amountSymbol}>
            {inputType === 'AMOUNT' ? (currency === 'INR' ? '₹' : '$') : 'g'}
          </Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor={COLORS.textMuted}
            value={inputType === 'AMOUNT' ? amount : grams}
            onChangeText={(v) => {
              if (inputType === 'AMOUNT') setAmount(v);
              else setGrams(v);
            }}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Quick amounts */}
        <View style={styles.quickRow}>
          {(currency === 'INR' ? QUICK_AMOUNTS_INR : QUICK_AMOUNTS_USD).map((q) => (
            <TouchableOpacity
              key={q}
              style={styles.quickBtn}
              onPress={() => { setInputType('AMOUNT'); setAmount(q.toString()); }}
            >
              <Text style={styles.quickBtnText}>
                {currency === 'INR' ? `₹${q >= 1000 ? q / 1000 + 'K' : q}` : `$${q}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Preview */}
      {preview && (
        <View style={styles.section}>
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Transaction Preview</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Gold {mode === 'BUY' ? 'Received' : 'Sold'}</Text>
              <Text style={styles.previewValue}>{formatGrams(preview.goldGrams, 6)}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Amount {mode === 'BUY' ? 'Paid' : 'Received'}</Text>
              <Text style={styles.previewValue}>{formatCurrency(preview.amount, currency)}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Gold Price</Text>
              <Text style={styles.previewValue}>{formatCurrency(price.toFixed(2), currency)}/g</Text>
            </View>
          </View>
        </View>
      )}

      {/* Action Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.actionBtn, !preview && styles.actionBtnDisabled]}
          onPress={handleTransaction}
          disabled={loading || !preview}
        >
          <LinearGradient
            colors={mode === 'BUY' ? [COLORS.success, '#1a6e3c'] : [COLORS.error, '#8b0000']}
            style={styles.actionBtnGrad}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name={mode === 'BUY' ? 'add-circle' : 'remove-circle'} size={20} color="#fff" />
                <Text style={styles.actionBtnText}>{mode === 'BUY' ? 'Buy Now' : 'Sell Now'}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.safetyRow}>
          <Ionicons name="shield-checkmark" size={14} color={COLORS.success} />
          <Text style={styles.safetyText}>100% secure · Insured gold storage · Instant delivery</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.md, paddingTop: 50, paddingBottom: SPACING.lg },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  headerSub: { color: COLORS.textMuted, fontSize: 14, marginTop: 4 },
  section: { paddingHorizontal: SPACING.md, marginTop: SPACING.md },
  label: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  modeToggle: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: 4, borderWidth: 1, borderColor: COLORS.border },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: RADIUS.sm },
  modeBtnActive: (m) => ({ backgroundColor: m === 'BUY' ? COLORS.success : COLORS.error }),
  modeBtnText: { color: COLORS.textMuted, fontWeight: '600', fontSize: 14 },
  modeBtnTextActive: { color: '#fff' },
  priceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)',
  },
  liveDot: { color: COLORS.success, fontWeight: '700', fontSize: 12 },
  priceCardText: { flex: 1, textAlign: 'right', color: COLORS.primary, fontSize: 20, fontWeight: '800' },
  perGram: { color: COLORS.textMuted, fontSize: 13, fontWeight: '400' },
  currencyRow: { flexDirection: 'row', gap: SPACING.sm },
  currencyBtn: {
    flex: 1, paddingVertical: 12, borderRadius: RADIUS.md,
    backgroundColor: COLORS.card, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  currencyBtnActive: { backgroundColor: 'rgba(201,168,76,0.15)', borderColor: COLORS.primary },
  currencyBtnText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  currencyBtnTextActive: { color: COLORS.primary },
  inputTypeRow: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: 4, borderWidth: 1, borderColor: COLORS.border },
  inputTypeBtn: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.sm, alignItems: 'center' },
  inputTypeBtnActive: { backgroundColor: COLORS.surface },
  inputTypeBtnText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  inputTypeBtnTextActive: { color: COLORS.primary },
  amountCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    borderWidth: 2, borderColor: COLORS.primary + '55',
    padding: SPACING.md,
  },
  amountSymbol: { color: COLORS.primary, fontSize: 28, fontWeight: '700', marginRight: SPACING.sm },
  amountInput: { flex: 1, color: COLORS.text, fontSize: 36, fontWeight: '800' },
  quickRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm, flexWrap: 'wrap' },
  quickBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: 8,
    backgroundColor: COLORS.card, borderRadius: RADIUS.round,
    borderWidth: 1, borderColor: COLORS.border,
  },
  quickBtnText: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },
  previewCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)',
  },
  previewTitle: { color: COLORS.primary, fontSize: 14, fontWeight: '700', marginBottom: SPACING.sm },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  previewLabel: { color: COLORS.textMuted, fontSize: 13 },
  previewValue: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  actionBtn: { borderRadius: RADIUS.md, overflow: 'hidden' },
  actionBtnDisabled: { opacity: 0.5 },
  actionBtnGrad: { paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  safetyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: SPACING.sm },
  safetyText: { color: COLORS.textMuted, fontSize: 11 },
});
