/* Primitives.jsx — small reusable building blocks.
   Exports: PhotoPlaceholder, SectionHeader, StatusBadge, InfoRow, Stat, Tag, Avatar */

function PhotoPlaceholder({ label, height = 160, radius = 'var(--r-md)', icon = 'image', tint = 'green', style = {} }) {
  const grad = tint === 'clay'
    ? 'linear-gradient(135deg, var(--clay-300), var(--green-100))'
    : 'linear-gradient(135deg, var(--green-200), var(--green-50))';
  return (
    <div className="photo" style={{ height, borderRadius: radius, background: grad, ...style }}>
      <Icon name={icon} size={Math.min(40, height * 0.28)} color="rgba(61,107,94,0.45)" stroke={1.5} />
      {label && <span className="ph-label">{label}</span>}
    </div>
  );
}

function SectionHeader({ title, more, onMore }) {
  return (
    <div className="section-head">
      <span className="title">{title}</span>
      {more && (
        <span className="more tappable" onClick={onMore} style={{ cursor: 'pointer' }}>
          {more}<Icon name="right" size={14} color="var(--color-fg3)" />
        </span>
      )}
    </div>
  );
}

const STATUS_LABEL = { free: '空闲', busy: '已预约', rest: '休息' };
function StatusBadge({ state = 'free', label }) {
  return (
    <span className={`status status-${state}`}>
      <span className="dot" />{label || STATUS_LABEL[state]}
    </span>
  );
}

function InfoRow({ icon, label, value, onClick, last = false }) {
  return (
    <div className={onClick ? 'tappable' : ''} onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '13px var(--sp-4)',
      borderBottom: last ? 'none' : '0.5px solid var(--color-border)',
    }}>
      <Icon name={icon} size={19} color="var(--color-primary)" stroke={1.75} />
      <span style={{ fontSize: 'var(--fs-body)', color: 'var(--color-fg2)', flexShrink: 0 }}>{label}</span>
      <span style={{
        marginLeft: 'auto', textAlign: 'right',
        fontSize: 'var(--fs-body)', color: 'var(--color-fg1)', fontWeight: 500,
      }}>{value}</span>
      {onClick && <Icon name="right" size={16} color="var(--color-fg4)" />}
    </div>
  );
}

function Stat({ value, label, accent }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div className="t-num" style={{
        fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 24,
        color: accent ? 'var(--color-accent)' : 'var(--color-primary-deep)', lineHeight: 1.1,
      }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--color-fg3)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Tag({ icon, children, variant = 'tint' }) {
  const cls = variant === 'neutral' ? 'chip chip-neutral' : variant === 'line' ? 'chip chip-line' : 'chip';
  return (
    <span className={cls}>
      {icon && <Icon name={icon} size={13} color="currentColor" stroke={1.9} />}
      {children}
    </span>
  );
}

function Avatar({ initials, size = 44 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, var(--green-300), var(--green-500))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: size * 0.38,
    }}>{initials}</div>
  );
}

Object.assign(window, { PhotoPlaceholder, SectionHeader, StatusBadge, InfoRow, Stat, Tag, Avatar });
