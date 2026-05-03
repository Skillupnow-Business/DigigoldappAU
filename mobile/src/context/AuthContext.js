import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userAPI } from '../services/api';

const AuthContext = createContext(null);

const initialState = {
  isLoading: true,
  isLoggedIn: false,
  isAdmin: false,
  user: null,
  token: null,
  adminToken: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, isLoading: action.payload };
    case 'LOGIN':
      return { ...state, isLoggedIn: true, isAdmin: false, user: action.user, token: action.token, isLoading: false };
    case 'ADMIN_LOGIN':
      return { ...state, isLoggedIn: true, isAdmin: true, adminToken: action.token, isLoading: false };
    case 'UPDATE_USER': return { ...state, user: { ...state.user, ...action.payload } };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    default: return state;
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [token, adminToken] = await AsyncStorage.multiGet(['token', 'adminToken']);
      if (adminToken[1]) {
        dispatch({ type: 'ADMIN_LOGIN', token: adminToken[1] });
      } else if (token[1]) {
        const res = await userAPI.getProfile();
        dispatch({ type: 'LOGIN', user: res.data.data, token: token[1] });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (token, user) => {
    await AsyncStorage.setItem('token', token);
    dispatch({ type: 'LOGIN', token, user });
  };

  const adminLogin = async (token) => {
    await AsyncStorage.setItem('adminToken', token);
    dispatch({ type: 'ADMIN_LOGIN', token });
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'adminToken', 'user']);
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, adminLogin, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
