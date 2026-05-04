import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '../components/Toast';

const LOG_STYLE = {
  info:    { text: 'text-gray-300',   prefix: 'INFO ', badge: 'bg-gray-700 text-gray-300' },
  success: { text: 'text-green-400',  prefix: 'OK   ', badge: 'bg-green-900 text-green-300' },
  warn:    { text: 'text-yellow-400', prefix: 'WARN ', badge: 'bg-yellow-900 text-yellow-300' },
  error:   { text: 'text-red-400',    prefix: 'ERR  ', badge: 'bg-red-900 text-red-300' },
  skip:    { text: 'text-orange-400', prefix: 'SKIP ', badge: 'bg-orange-900 text-orange-300' },
};

export default function Import() {
  const toast = useToast();
  const [file, setFile]         = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult]     = useState(null);
  const [filter, setFilter]     = useState('all'); // all | info | warn | error | skip | success
  const [search, setSearch]     = useState('');
  const logRef  = useRef(null);
  const inputRef = useRef(null);

  // 日志到底部自动滚动
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [result?.logs]);

  const handleFile = useCallback((f) => {
    if (!f) return;
    if (!f.name.endsWith('.xlsx')) {
      toast('仅支持 .xlsx 格式的文件', 'error');
      return;
    }
    setFile(f);
    setResult(null);
    setSearch('');
    setFilter('all');
  }, [toast]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    let res;
    try {
      const token = localStorage.getItem('admin_token');
      res = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (networkErr) {
      // 网络层错误（服务器未启动、端口错误等）
      const msg = `无法连接到服务器（${networkErr.message}）。请确认后端服务已在端口 5100 启动。`;
      setResult({ success: false, message: msg, logs: [{ level: 'error', msg }] });
      toast(msg, 'error');
      setUploading(false);
      return;
    }

    // 先读取文本，再尝试解析 JSON；防止服务端返回 HTML 时 .json() 抛出不可读的错误
    let text;
    try {
      text = await res.text();
    } catch (readErr) {
      const msg = `读取响应失败: ${readErr.message}`;
      setResult({ success: false, message: msg, logs: [{ level: 'error', msg }] });
      toast(msg, 'error');
      setUploading(false);
      return;
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // 服务端返回了 HTML（比如 Express 默认错误页）
      const preview = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
      const msg = `服务器返回非 JSON 响应（HTTP ${res.status}）。可能原因：路由不存在、服务崩溃或端口配置错误。\n原始内容预览: ${preview}`;
      setResult({
        success: false,
        message: `服务器返回非 JSON（HTTP ${res.status}）`,
        logs: [
          { level: 'error', msg: `HTTP 状态: ${res.status} ${res.statusText}` },
          { level: 'error', msg: `响应内容预览: ${preview}` },
          { level: 'warn',  msg: '请检查：1) 后端服务是否运行  2) vite.config.js 代理端口是否与后端端口一致  3) /admin/import 路由是否注册' },
        ],
      });
      toast(`服务器返回非 JSON（HTTP ${res.status}）`, 'error');
      setUploading(false);
      return;
    }

    setResult(data);
    if (data.success) {
      toast(`导入完成：${data.saved} 条已保存，${data.skipped} 条跳过`);
    } else {
      toast(data.message || '导入失败', 'error');
    }
    setUploading(false);
  };

  // 日志过滤
  const filteredLogs = result?.logs?.filter((entry) => {
    const matchLevel  = filter === 'all' || entry.level === filter;
    const matchSearch = !search || entry.msg.toLowerCase().includes(search.toLowerCase());
    return matchLevel && matchSearch;
  }) ?? [];

  // 各级别计数
  const counts = result?.logs?.reduce((acc, e) => {
    acc[e.level] = (acc[e.level] || 0) + 1;
    return acc;
  }, {}) ?? {};

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">导入预约记录</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          上传 Excel (.xlsx) 文件，自动解析上个月工作表并导入预约记录
        </p>
      </div>

      <div className="max-w-3xl space-y-5">
        {/* ── 拖放上传区 ── */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer select-none ${
            dragging
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-gray-50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />

          {file ? (
            <div className="pointer-events-none">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-400 mt-1">
                {(file.size / 1024).toFixed(1)} KB &nbsp;·&nbsp; 点击可更换文件
              </p>
            </div>
          ) : (
            <div className="pointer-events-none">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">拖放文件到此处，或点击选择</p>
              <p className="text-sm text-gray-400 mt-1">仅支持 .xlsx 格式</p>
            </div>
          )}
        </div>

        {/* ── 导入按钮 ── */}
        {file && (
          <button
            onClick={upload}
            disabled={uploading}
            className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                正在解析并导入，请稍候...
              </>
            ) : '开始导入'}
          </button>
        )}

        {/* ── 结果摘要 ── */}
        {result && (
          <div className={`rounded-xl p-4 border ${
            result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              {result.success ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <p className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.success ? '导入完成' : '导入失败'}
              </p>
            </div>
            <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
              {result.message}
            </p>
            {result.success && (
              <div className="flex flex-wrap gap-5 mt-3">
                <Stat label="解析记录" value={result.total}        color="text-gray-800" />
                <Stat label="成功导入" value={result.saved}        color="text-green-700" />
                <Stat label="跳过冲突" value={result.skipped}      color="text-yellow-700" />
                {result.parseErrors > 0 && (
                  <Stat label="解析异常" value={result.parseErrors} color="text-red-600" />
                )}
              </div>
            )}
          </div>
        )}

        {/* ── 日志面板 ── */}
        {result?.logs && result.logs.length > 0 && (
          <div className="rounded-xl overflow-hidden border border-gray-800 shadow-lg">
            {/* 工具栏 */}
            <div className="bg-gray-800 px-4 py-2.5 flex flex-wrap items-center gap-3">
              <span className="text-gray-200 text-xs font-mono font-bold tracking-wider">
                处理日志
              </span>

              {/* 级别过滤按钮 */}
              <div className="flex items-center gap-1 flex-wrap">
                <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')}
                  label={`全部 ${result.logs.length}`} color="bg-gray-600 hover:bg-gray-500" />
                {[
                  { key: 'success', label: '成功', color: 'bg-green-800 hover:bg-green-700' },
                  { key: 'warn',    label: '警告', color: 'bg-yellow-800 hover:bg-yellow-700' },
                  { key: 'error',   label: '错误', color: 'bg-red-800 hover:bg-red-700' },
                  { key: 'skip',    label: '跳过', color: 'bg-orange-800 hover:bg-orange-700' },
                  { key: 'info',    label: '信息', color: 'bg-gray-700 hover:bg-gray-600' },
                ].map(({ key, label, color }) =>
                  counts[key] ? (
                    <FilterBtn
                      key={key}
                      active={filter === key}
                      onClick={() => setFilter(f => f === key ? 'all' : key)}
                      label={`${label} ${counts[key]}`}
                      color={color}
                    />
                  ) : null
                )}
              </div>

              {/* 搜索框 */}
              <div className="ml-auto">
                <input
                  className="bg-gray-700 text-gray-200 text-xs rounded px-2 py-1 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-40"
                  placeholder="搜索日志..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* 滚动到底部 */}
              <button
                onClick={() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }}
                title="滚动到底部"
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* 日志内容 */}
            <div
              ref={logRef}
              className="bg-gray-950 p-4 h-96 overflow-y-auto font-mono text-xs leading-5"
            >
              {filteredLogs.length === 0 ? (
                <p className="text-gray-600 italic">无匹配日志</p>
              ) : (
                filteredLogs.map((entry, i) => {
                  const style = LOG_STYLE[entry.level] || LOG_STYLE.info;
                  return (
                    <div key={i} className={`flex items-start gap-2 mb-0.5 ${style.text}`}>
                      <span className="text-gray-700 select-none w-8 text-right flex-shrink-0">
                        {String(i + 1).padStart(3, '0')}
                      </span>
                      <span className={`flex-shrink-0 px-1 rounded text-xs font-semibold ${style.badge}`}>
                        {style.prefix}
                      </span>
                      <span className="break-all whitespace-pre-wrap">{entry.msg}</span>
                    </div>
                  );
                })
              )}
            </div>

            {/* 状态栏 */}
            <div className="bg-gray-800 px-4 py-1.5 flex items-center gap-4 text-xs text-gray-500">
              <span>显示 {filteredLogs.length} / {result.logs.length} 条</span>
              {search && <span>搜索: 「{search}」</span>}
              {filter !== 'all' && <span>筛选: {filter}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="text-sm">
      <span className="text-gray-500">{label} </span>
      <strong className={color}>{value}</strong>
    </div>
  );
}

function FilterBtn({ active, onClick, label, color }) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${color} ${
        active ? 'ring-1 ring-white text-white' : 'text-gray-300 opacity-70 hover:opacity-100'
      }`}
    >
      {label}
    </button>
  );
}
