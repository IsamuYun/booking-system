import { useState } from 'react';
import { useToast } from '../components/Toast';

function getCurrentMonth() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function prevMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function nextMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatLabel(ym) {
  const [y, m] = ym.split('-');
  return `${y} 年 ${Number(m)} 月`;
}

export default function Report() {
  const toast = useToast();
  const [month, setMonth]     = useState(getCurrentMonth());
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null); // { month, ok, time }

  const download = async () => {
    setLoading(true);
    setLastResult(null);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/admin/report?month=${month}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        // 错误响应可能是文本或 JSON
        const ct = res.headers.get('content-type') || '';
        let errMsg = `HTTP ${res.status}`;
        if (ct.includes('application/json')) {
          const json = await res.json();
          errMsg = json.message || errMsg;
        } else {
          const text = await res.text();
          errMsg = text.replace(/<[^>]+>/g, '').trim().slice(0, 200) || errMsg;
        }
        throw new Error(errMsg);
      }

      const blob = await res.blob();
      if (blob.size === 0) throw new Error('服务器返回了空文件');

      // 触发浏览器下载
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${month}-租赁报表.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setLastResult({ month, ok: true, time: new Date().toLocaleTimeString() });
      toast(`${formatLabel(month)} 报表已下载`);
    } catch (err) {
      setLastResult({ month, ok: false, msg: err.message, time: new Date().toLocaleTimeString() });
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const canGoNext = nextMonth(month) <= getCurrentMonth();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">月度报表</h2>
        <p className="text-sm text-gray-500 mt-0.5">生成并下载指定月份的租赁费用结算 Excel 报表</p>
      </div>

      <div className="max-w-md space-y-5">
        {/* Month picker card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">选择月份</p>

          {/* Month navigation */}
          <div className="flex items-center justify-between gap-4 mb-5">
            <button
              onClick={() => setMonth(prevMonth(month))}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-800"
              title="上个月"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-gray-900">{formatLabel(month)}</p>
              <input
                type="month"
                value={month}
                max={getCurrentMonth()}
                onChange={(e) => e.target.value && setMonth(e.target.value)}
                className="mt-2 text-xs text-blue-600 cursor-pointer border-0 bg-transparent focus:outline-none focus:ring-0 text-center"
              />
            </div>

            <button
              onClick={() => setMonth(nextMonth(month))}
              disabled={!canGoNext}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
              title="下个月"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Report contents info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
            <p className="text-xs font-semibold text-gray-500 mb-2">报表包含内容</p>
            {[
              '日期 / 开始 / 结束时间 / 小时数',
              '租赁人 / 咨询师类型 / 咨询室',
              '租赁费用（元/时）/ 应收费用',
              '收费情况 / 收款日期 / 已收费金额',
              '月度汇总：总时长 / 总费用 / 内外部分项',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </div>
            ))}
          </div>

          {/* Download button */}
          <button
            onClick={download}
            disabled={loading}
            className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                正在生成报表...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                下载 {formatLabel(month)} 报表
              </>
            )}
          </button>
        </div>

        {/* Last result */}
        {lastResult && (
          <div className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${
            lastResult.ok
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            {lastResult.ok ? (
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <div>
              <p className={`text-sm font-medium ${lastResult.ok ? 'text-green-800' : 'text-red-800'}`}>
                {lastResult.ok
                  ? `${formatLabel(lastResult.month)} 报表下载成功`
                  : '下载失败'}
              </p>
              <p className={`text-xs mt-0.5 ${lastResult.ok ? 'text-green-600' : 'text-red-600'}`}>
                {lastResult.ok
                  ? `文件名：${lastResult.month}-租赁报表.xlsx · ${lastResult.time}`
                  : `${lastResult.msg} · ${lastResult.time}`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
