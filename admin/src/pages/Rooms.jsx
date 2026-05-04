import { useState, useEffect } from 'react';
import { api } from '../api/client';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

const ROOM_TYPES = ['咨询室', '多功能室'];

const emptyForm = { name: '', type: '咨询室', isAvailable: true };

export default function Rooms() {
  const toast = useToast();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/rooms');
      setRooms(res.data || []);
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

  const openEdit = (r) => {
    setForm({ name: r.name, type: r.type, isAvailable: r.isAvailable });
    setEditId(r.id);
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/admin/rooms/${editId}`, form);
        toast('咨询室信息已更新');
      } else {
        await api.post('/admin/rooms', form);
        toast('咨询室已新增');
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
      await api.delete(`/admin/rooms/${deleteTarget.id}`);
      toast(`已删除 ${deleteTarget.name}`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const consulting = rooms.filter((r) => r.type === '咨询室');
  const multi = rooms.filter((r) => r.type === '多功能室');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">咨询室管理</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            咨询室 {consulting.length} 间 &nbsp;·&nbsp; 多功能室 {multi.length} 间
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新增房间
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">加载中...</div>
      ) : (
        <div className="space-y-8">
          <RoomGroup
            title="咨询室"
            rooms={consulting}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
          />
          <RoomGroup
            title="多功能室"
            rooms={multi}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
          />
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? '编辑房间' : '新增房间'}
        width="max-w-md"
      >
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">房间名称 *</label>
            <input
              required
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="例：咨询室4"
            />
          </div>

          <div>
            <label className="label">类型 *</label>
            <select
              className="input"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              {ROOM_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isAvailable"
              checked={form.isAvailable}
              onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isAvailable" className="text-sm text-gray-700">
              可预约（取消勾选则暂停该房间的预约）
            </label>
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
          确定要删除{' '}
          <strong className="text-gray-900">「{deleteTarget?.name}」</strong> 吗？
          <br />
          <span className="text-red-500 text-xs mt-1 block">此操作不可撤销，关联的预约记录将失去房间信息。</span>
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

function RoomGroup({ title, rooms, onEdit, onDelete }) {
  if (rooms.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{title}</h3>
        <p className="text-gray-400 text-sm">暂无{title}</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rooms.map((r) => (
          <div
            key={r.id}
            className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900 text-base">{r.name}</h4>
                <span className="text-xs text-gray-500">{r.type}</span>
              </div>
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${
                  r.isAvailable
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {r.isAvailable ? '可预约' : '暂停'}
              </span>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => onEdit(r)}
                className="flex-1 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors text-center py-1.5 rounded-lg hover:bg-blue-50"
              >
                编辑
              </button>
              <button
                onClick={() => onDelete(r)}
                className="flex-1 text-sm text-red-500 hover:text-red-700 font-medium transition-colors text-center py-1.5 rounded-lg hover:bg-red-50"
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
