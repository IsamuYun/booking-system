import { useState, useEffect } from 'react';
import { api } from '../api/client';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

const TYPES = ['内部', '外部', '合作-漫漫', '合作-墨提斯'];
const DEFAULT_PRICES = {
  内部: { booking_price: 70, booking_multi_price: 120 },
  外部: { booking_price: 90, booking_multi_price: 120 },
  '合作-漫漫': { booking_price: 80, booking_multi_price: 120 },
  '合作-墨提斯': { booking_price: 80, booking_multi_price: 120 },
};

const TYPE_COLORS = {
  内部: 'bg-blue-100 text-blue-700',
  外部: 'bg-purple-100 text-purple-700',
  '合作-漫漫': 'bg-orange-100 text-orange-700',
  '合作-墨提斯': 'bg-teal-100 text-teal-700',
};

const emptyForm = {
  name: '',
  type: '内部',
  sub_type: '',
  booking_price: 70,
  booking_multi_price: 120,
  note: '',
  status: 1,
};

export default function Counselors() {
  const toast = useToast();
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/counselors');
      setCounselors(res.data || []);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setForm({
      name: c.name,
      type: c.type,
      sub_type: c.sub_type || '',
      booking_price: c.booking_price,
      booking_multi_price: c.booking_multi_price,
      note: c.note || '',
      status: c.status,
    });
    setEditId(c.id);
    setModalOpen(true);
  };

  const handleTypeChange = (type) => {
    const defaults = DEFAULT_PRICES[type] || {};
    setForm((f) => ({ ...f, type, ...defaults }));
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/admin/counselors/${editId}`, form);
        toast('咨询师信息已更新');
      } else {
        await api.post('/admin/counselors', form);
        toast('咨询师已新增');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/admin/counselors/${deleteTarget.id}`);
      toast(`已删除咨询师 ${deleteTarget.name}`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const filtered = counselors.filter(
    (c) =>
      c.name.includes(filter) ||
      c.type.includes(filter) ||
      (c.note || '').includes(filter)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">咨询师管理</h2>
          <p className="text-sm text-gray-500 mt-0.5">共 {counselors.length} 位咨询师</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新增咨询师
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          className="input max-w-xs"
          placeholder="搜索姓名、类型或备注..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">加载中...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">姓名</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">类型</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">咨询室价格</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">多功能室价格</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">备注</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                    {filter ? '没有匹配的咨询师' : '暂无咨询师数据'}
                  </td>
                </tr>
              )}
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[c.type] || 'bg-gray-100 text-gray-600'}`}>
                      {c.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">¥{c.booking_price}/时</td>
                  <td className="px-5 py-3 text-gray-600">¥{c.booking_multi_price}/时</td>
                  <td className="px-5 py-3 text-gray-500 max-w-xs truncate">{c.note || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${c.status === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.status === 1 ? '在职' : '离职'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right space-x-3">
                    <button
                      onClick={() => openEdit(c)}
                      className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => setDeleteTarget(c)}
                      className="text-red-500 hover:text-red-700 font-medium transition-colors"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? '编辑咨询师' : '新增咨询师'}
      >
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">姓名 *</label>
            <input
              required
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="请输入姓名"
            />
          </div>

          <div>
            <label className="label">类型 *</label>
            <select
              className="input"
              value={form.type}
              onChange={(e) => handleTypeChange(e.target.value)}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">子类型</label>
            <input
              className="input"
              value={form.sub_type}
              onChange={(e) => setForm((f) => ({ ...f, sub_type: e.target.value }))}
              placeholder="可选"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">咨询室价格（元/时）</label>
              <input
                type="number"
                min="0"
                className="input"
                value={form.booking_price}
                onChange={(e) => setForm((f) => ({ ...f, booking_price: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="label">多功能室价格（元/时）</label>
              <input
                type="number"
                min="0"
                className="input"
                value={form.booking_multi_price}
                onChange={(e) => setForm((f) => ({ ...f, booking_multi_price: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div>
            <label className="label">备注</label>
            <input
              className="input"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="可选"
            />
          </div>

          <div>
            <label className="label">状态</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: Number(e.target.value) }))}
            >
              <option value={1}>在职</option>
              <option value={0}>离职</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary"
            >
              取消
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="确认删除"
        width="max-w-sm"
      >
        <p className="text-gray-600 mb-6">
          确定要删除咨询师{' '}
          <strong className="text-gray-900">「{deleteTarget?.name}」</strong> 吗？
          <br />
          <span className="text-red-500 text-xs mt-1 block">此操作不可撤销，相关预约记录将失去咨询师关联。</span>
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteTarget(null)} className="btn-secondary">
            取消
          </button>
          <button onClick={confirmDelete} className="btn-danger">
            确认删除
          </button>
        </div>
      </Modal>
    </div>
  );
}
