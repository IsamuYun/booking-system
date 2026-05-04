import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken]   = useState(() => localStorage.getItem('admin_token'));
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true); // 验证 token 期间显示加载中

  // 应用挂载时验证已存储的 token 是否仍然有效
  useEffect(() => {
    const stored = localStorage.getItem('admin_token');
    if (!stored) { setLoading(false); return; }

    fetch('/api/admin/auth/me', {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          setToken(stored);
        } else {
          localStorage.removeItem('admin_token');
          setToken(null);
        }
      })
      .catch(() => {
        localStorage.removeItem('admin_token');
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // API client 发出 401 时触发此事件强制退出
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('admin-unauthorized', handler);
    return () => window.removeEventListener('admin-unauthorized', handler);
  }, []);

  const login = (newToken, userData) => {
    localStorage.setItem('admin_token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, isLoggedIn: !!token && !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
