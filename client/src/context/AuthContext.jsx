import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setOrganization(null);
  };

  const loginWithToken = (newToken, userData, orgData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    if (userData) setUser(userData);
    if (orgData) setOrganization(orgData);
  };

  return (
    <AuthContext.Provider value={{
      token,
      setToken,
      user,
      setUser,
      organization,
      setOrganization,
      authLoading,
      setAuthLoading,
      authError,
      setAuthError,
      authSuccess,
      setAuthSuccess,
      loginWithToken,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
