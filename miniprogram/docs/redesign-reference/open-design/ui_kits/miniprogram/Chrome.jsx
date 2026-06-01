/* Chrome.jsx — WeChat Mini Program chrome: navigation bar with the
   signature capsule button (••• ◯) and the bottom tab bar.
   Sits inside the iOS device frame (IOSDevice) from ios-frame.jsx.
   Exports: WeChatNav, TabBar, Capsule */

const STATUS_BAR_H = 54; // clears the iOS status bar / dynamic island

function Capsule() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      width: 87, height: 32, borderRadius: 16,
      background: 'rgba(255,255,255,0.55)',
      border: '0.5px solid rgba(0,0,0,0.08)',
      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
    }}>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <svg width="20" height="6" viewBox="0 0 20 6">
          {[2.5, 10, 17.5].map((cx) => <circle key={cx} cx={cx} cy="3" r="2" fill="#2A2E2C" />)}
        </svg>
      </div>
      <div style={{ width: '0.5px', height: 18, background: 'rgba(0,0,0,0.12)' }} />
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="6.4" stroke="#2A2E2C" strokeWidth="1.3" />
          <circle cx="9" cy="9" r="1.2" fill="#2A2E2C" />
          <path d="M9 2.6v2.4M9 13v2.4M2.6 9h2.4M13 9h2.4" stroke="#2A2E2C" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

/* variant: 'solid' (white bar) | 'transparent' (over hero image) */
function WeChatNav({ title, showBack = false, onBack, variant = 'solid' }) {
  const transparent = variant === 'transparent';
  const fg = transparent ? '#fff' : 'var(--color-fg1)';
  return (
    <div style={{
      position: 'relative', zIndex: 30, flexShrink: 0,
      paddingTop: STATUS_BAR_H,
      background: transparent ? 'transparent' : 'var(--color-surface)',
      borderBottom: transparent ? 'none' : '0.5px solid var(--color-border)',
    }}>
      <div style={{ position: 'relative', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {showBack && (
          <button onClick={onBack} aria-label="返回" style={{
            position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
            width: 36, height: 36, borderRadius: '50%', border: 'none',
            background: transparent ? 'rgba(0,0,0,0.18)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <Icon name="left" size={24} color={transparent ? '#fff' : 'var(--color-fg1)'} stroke={2} />
          </button>
        )}
        <div style={{
          fontFamily: 'var(--font-sans)', fontWeight: 600,
          fontSize: 'var(--fs-navtitle)', color: fg,
          maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          textShadow: transparent ? '0 1px 6px rgba(0,0,0,0.35)' : 'none',
        }}>{title}</div>
        <div style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)' }}>
          <Capsule />
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { key: 'home', label: '首页', icon: 'home' },
  { key: 'rooms', label: '咨询室', icon: 'door' },
  { key: 'about', label: '关于', icon: 'info' },
];

function TabBar({ active, onChange }) {
  return (
    <div style={{
      flexShrink: 0, position: 'relative', zIndex: 30,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(18px) saturate(150%)', WebkitBackdropFilter: 'blur(18px) saturate(150%)',
      borderTop: '0.5px solid var(--color-border)',
      paddingBottom: 22, // clears the iOS home indicator
      display: 'flex',
    }}>
      {TABS.map((t) => {
        const on = active === t.key;
        return (
          <button key={t.key} onClick={() => onChange(t.key)} style={{
            flex: 1, border: 'none', background: 'transparent', cursor: 'pointer',
            padding: '8px 0 4px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 3,
          }}>
            <Icon name={t.icon} size={24} stroke={on ? 2 : 1.75}
              color={on ? 'var(--color-primary)' : 'var(--color-fg3)'} />
            <span style={{
              fontSize: 11, fontWeight: on ? 600 : 400,
              color: on ? 'var(--color-primary)' : 'var(--color-fg3)',
            }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

Object.assign(window, { WeChatNav, TabBar, Capsule, STATUS_BAR_H });
