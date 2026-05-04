const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('admin_token');
}

async function request(method, path, body) {
  const token = getToken();
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);
  const json = await res.json().catch(() => ({}));

  if (res.status === 401) {
    // Token 过期或无效，触发全局退出登录
    localStorage.removeItem('admin_token');
    window.dispatchEvent(new Event('admin-unauthorized'));
    throw new Error(json.message || '登录已过期，请重新登录');
  }

  if (!res.ok) {
    throw new Error(json.error || json.message || `请求失败: ${res.status}`);
  }
  return json;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  delete: (path) => request('DELETE', path),
};
