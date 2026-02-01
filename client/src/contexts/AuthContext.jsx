import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    // 监听 storage 变化（其他标签页的登录/登出）
    const handleStorageChange = (e) => {
      if (e.key === 'accessToken') {
        if (!e.newValue) {
          // Token 被删除（其他标签页登出）
          setUser(null);
        } else if (e.oldValue !== e.newValue) {
          // Token 改变（其他标签页登录了不同账户）
          checkAuth();
        }
      }
    };

    // 监听窗口获得焦点（切换回此标签页时重新验证）
    const handleFocus = () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        // 重新验证当前用户
        checkAuth();
      } else if (user) {
        // 没有 token 但还有 user 状态，清除用户
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('认证检查失败:', error);
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { user, accessToken, refreshToken } = await authService.login(email, password);
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(user);
    return user;
  };

  const register = async (userData) => {
    const { user, accessToken, refreshToken } = await authService.register(userData);
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(user);
    return user;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
