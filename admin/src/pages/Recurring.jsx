import { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

const DAYS = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 0, label: '周日' },
];

function slotToTime(slot) {
  const h = Math.floor(slot / 2);
  const m = slot % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
}

const TIME_OPTIONS = Array.from({ length: 32 }, (_, i) => {
  const slot = 16 + i;
  return { slot, label: slotToTime(slot) };
});

const emptyForm = {
  day_of_week: 1,
  room_id: '',
  counselor_id: '',
  start_time_slot: 16,
  end_time_slot: 18,
};

export default function Recurring() {
  const toast = useToast();
  const [rules, setRules] = useState([]);
  const [counselors, setCounselors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [generateDays, setGenerateDays] = useState(30);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [rulesRes, counselorsRes, roomsRes] = await Promise.all([
        api.get('/recurring/rules'),
        api.get('/counselors'),
        api.get('/admin/rooms'),
      ]);
      setRules(rulesRes.data || []);
      setCounselors(counselorsRes.data || []);
      setRooms(roomsRes.data || []);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // Group rules by day of week
  const rulesByDay = useMemo(() => {
    const map = {};
    DAYS.forEach((d) => { map[d.value] = []; });
    rules.forEach((r) => {
      if (map[r.day_of_week] !== undefined) {
        map[r.day_of_week].push(r);
      }
    });
    return map;
  }, [rules]);

  const openAdd = (day) => {
    const defaultRoom = rooms[0]?.id || '';
    const defaultCounselor = counselors[0]?.id || '';
    setForm({ ...emptyForm, day_of_week: day, room_id: defaultRoom, counselor_id: defaultCounselor });
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (form.end_time_slot <= form.start_time_slot) {
      toast('结束时间必须晚于开始时间', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.post('/recurring/rules/add', {
        ...form,
        start_time: slotToTime(form.start_time_slot),
        end_time: slotToTime(form.end_time_slot),
        room_id: Number(form.room_id),
        counselor_id: Number(form.counselor_id),
        day_of_week: Number(form.day_of_week),
      });
      toast('定期规则已添加');
      setModalOpen(false);
      loadAll();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await api.get(`/recurring/rules/delete/${deleteTarget.id}`);
      toast('规则已删除');
      setDeleteTarget(null);
      loadAll();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/recurring/generate', { days: generateDays });
      if (res.success) {
        toast(`已成功生成本月定期预约`);
      } else {
        toast(res.message || '生成失败', 'error');
      }
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const endTimeOptions = TIME_OPTIONS.filter(
    (o) => o.slot > form.start_time_slot
  );

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">定期预约管理</h2>
          <p className="text-sm text-gray-500 mt-0.5">设置每周固定的咨询室预约规则，共 {rules.length} 条规则</p>
        </div>
        {/* Generate bookings panel */}
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
          <div className="text-sm text-gray-600">生成本月预约</div>
          <button
            onClick={generate}
            disabled={generating || rules.length === 0}
            className="btn-primary text-xs px-3 py-1.5"
          >
            {generating ? '生成中...' : '立即生成'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">加载中...</div>
      ) : (
        <div className="grid grid-cols-7 gap-3">
          {DAYS.map((day) => (
            <DayColumn
              key={day.value}
              day={day}
              rules={rulesByDay[day.value] || []}
              onAdd={() => openAdd(day.value)}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Add Rule Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="新增定期规则"
        width="max-w-md"
      >
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">星期</label>
            <select
              className="input"
              value={form.day_of_week}
              onChange={(e) => setForm((f) => ({ ...f, day_of_week: Number(e.target.value) }))}
            >
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">咨询室 *</label>
            <select
              required
              className="input"
              value={form.room_id}
              onChange={(e) => setForm((f) => ({ ...f, room_id: e.target.value }))}
            >
              <option value="">— 请选择 —</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}（{r.type}）</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">咨询师 *</label>
            <select
              required
              className="input"
              value={form.counselor_id}
              onChange={(e) => setForm((f) => ({ ...f, counselor_id: e.target.value }))}
            >
              <option value="">— 请选择 —</option>
              {counselors.map((c) => (
                <option key={c.id} value={c.id}>{c.name}（{c.type}）</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">开始时间</label>
              <select
                className="input"
                value={form.start_time_slot}
                onChange={(e) => {
                  const s = Number(e.target.value);
                  setForm((f) => ({
                    ...f,
                    start_time_slot: s,
                    end_time_slot: f.end_time_slot <= s ? s + 2 : f.end_time_slot,
                  }));
                }}
              >
                {TIME_OPTIONS.slice(0, -1).map((o) => (
                  <option key={o.slot} value={o.slot}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">结束时间</label>
              <select
                className="input"
                value={form.end_time_slot}
                onChange={(e) => setForm((f) => ({ ...f, end_time_slot: Number(e.target.value) }))}
              >
                {endTimeOptions.map((o) => (
                  <option key={o.slot} value={o.slot}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg px-4 py-3 text-sm text-blue-700">
            时长：{((form.end_time_slot - form.start_time_slot) * 0.5).toFixed(1)} 小时
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              取消
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? '保存中...' : '保存规则'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="确认删除规则"
        width="max-w-sm"
      >
        {deleteTarget && (
          <div className="mb-6">
            <p className="text-gray-600 mb-3">确定要删除以下定期规则吗？</p>
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
              <p><span className="text-gray-500">时间：</span>{DAYS.find(d => d.value === deleteTarget.day_of_week)?.label} {deleteTarget.start_time}–{deleteTarget.end_time}</p>
              <p><span className="text-gray-500">房间：</span>{deleteTarget.Room?.name}</p>
              <p><span className="text-gray-500">咨询师：</span>{deleteTarget.Counselor?.name}</p>
            </div>
            <p className="text-red-500 text-xs mt-3">删除规则不会影响已生成的预约记录。</p>
          </div>
        )}
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteTarget(null)} className="btn-secondary">取消</button>
          <button onClick={confirmDelete} className="btn-danger">确认删除</button>
        </div>
      </Modal>
    </div>
  );
}

function DayColumn({ day, rules, onAdd, onDelete }) {
  return (
    <div className="flex flex-col min-h-0">
      {/* Day header */}
      <div className="bg-blue-600 text-white text-center py-2 rounded-t-xl text-sm font-semibold">
        {day.label}
      </div>

      {/* Rules */}
      <div className="flex-1 bg-white border border-t-0 border-gray-200 rounded-b-xl p-2 space-y-2 min-h-[200px]">
        {rules.length === 0 && (
          <p className="text-center text-gray-300 text-xs pt-4">暂无规则</p>
        )}
        {rules.map((r) => (
          <RuleCard key={r.id} rule={r} onDelete={onDelete} />
        ))}

        <button
          onClick={onAdd}
          className="w-full mt-2 border border-dashed border-gray-300 rounded-lg py-2 text-xs text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
        >
          + 添加
        </button>
      </div>
    </div>
  );
}

function RuleCard({ rule, onDelete }) {
  const room = rule.Room || {};
  const counselor = rule.Counselor || {};

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-lg p-2 relative group">
      {/* Delete button */}
      <button
        onClick={() => onDelete(rule)}
        className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
        title="删除规则"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <p className="text-xs font-semibold text-gray-700 pr-4">
        {rule.start_time}–{rule.end_time}
      </p>
      <p className="text-xs text-gray-500 mt-0.5 truncate">{room.name}</p>
      <p className="text-xs text-blue-600 mt-0.5 truncate font-medium">{counselor.name}</p>
      <span className="inline-flex mt-1 px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
        {counselor.type}
      </span>
    </div>
  );
}
