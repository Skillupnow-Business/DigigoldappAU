import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminCustomersScreen from '../screens/admin/AdminCustomersScreen';
import AdminTransactionsScreen from '../screens/admin/AdminTransactionsScreen';
import { COLORS } from '../utils/theme';

const Tab = createBottomTabNavigator();

export default function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A0A00',
          borderTopColor: COLORS.primaryDark,
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            Dashboard: focused ? 'grid' : 'grid-outline',
            Customers: focused ? 'people' : 'people-outline',
            Transactions: focused ? 'swap-horizontal' : 'swap-horizontal-outline',
          };
          return (
            <View style={[styles.iconWrap, focused && styles.iconActive]}>
              <Ionicons name={icons[route.name] || 'circle'} size={22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Customers" component={AdminCustomersScreen} />
      <Tab.Screen name="Transactions" component={AdminTransactionsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: { padding: 4, borderRadius: 8 },
  iconActive: { backgroundColor: 'rgba(201,168,76,0.2)' },
});
