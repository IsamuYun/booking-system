/* RoomDetailScreen.jsx — room detail with photos, info & usage calendar */

function RoomDetailScreen({ room, onBack }) {
  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30 }}>
        <WeChatNav title={room.name} variant="transparent" showBack onBack={onBack} />
      </div>
      <div className="mp-scroll">
        {/* photo header */}
        <div style={{ position: 'relative' }}>
          <PhotoPlaceholder label="室内主图" height={300} radius={0} tint={room.tint} icon="image" />
          <div style={{ position: 'absolute', bottom: 12, right: 12 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px',
              borderRadius: 'var(--r-pill)', background: 'rgba(0,0,0,0.4)', color: '#fff', fontSize: 12,
              backdropFilter: 'blur(6px)' }}>
              <Icon name="image" size={13} color="#fff" /> 1 / 6
            </span>
          </div>
        </div>

        {/* thumbnail strip */}
        <div style={{ display: 'flex', gap: 8, padding: '12px var(--sp-4) 0', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[0, 1, 2, 3].map((i) => (
            <PhotoPlaceholder key={i} label="" height={56} radius="var(--r-sm)"
              tint={i % 2 ? 'clay' : 'green'} icon="image"
              style={{ width: 72, flexShrink: 0, border: i === 0 ? '2px solid var(--color-primary)' : 'none' }} />
          ))}
        </div>

        {/* title + status */}
        <div style={{ padding: '18px var(--sp-4) 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h1 className="t-h1" style={{ margin: 0 }}>{room.name}</h1>
              <span style={{ fontSize: 13, color: 'var(--color-fg3)' }}>{room.en}</span>
            </div>
            <div style={{ paddingTop: 4 }}><StatusBadge state={room.status} /></div>
          </div>
          <p className="t-body" style={{ margin: '12px 0 0' }}>{room.desc}</p>
        </div>

        {/* spec grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '16px var(--sp-4) 0' }}>
          <SpecTile icon="users" label="容纳" value={room.cap} />
          <SpecTile icon="area" label="面积" value={room.area} />
          {room.tags.map(([k, v], i) => <SpecTile key={i} icon={specIcon(k)} label={k} value={v} />)}
        </div>

        {/* usage calendar */}
        <SectionHeader title="咨询室使用状况" />
        <UsageCalendar />

        <div style={{ padding: '20px var(--sp-4) 8px' }}>
          <button className="btn btn-primary btn-block">
            <Icon name="message" size={18} color="#fff" />咨询预约这间咨询室
          </button>
          <p style={{ margin: '10px 0 0', textAlign: 'center', fontSize: 12, color: 'var(--color-fg4)' }}>
            预约由前台人工确认，使用状况仅供参考
          </p>
        </div>
        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}

function specIcon(key) {
  return { '用途': 'heart', '采光': 'sun', '隔音': 'ear', '氛围': 'sun', '设施': 'wind',
    '布局': 'area', '人群': 'users' }[key] || 'leaf';
}

function SpecTile({ icon, label, value }) {
  return (
    <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--r-md)', padding: '12px 14px',
      boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', gap: 11 }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: 'var(--color-surface-tint)',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color="var(--color-primary)" stroke={1.8} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--color-fg3)' }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-fg1)', whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      </div>
    </div>
  );
}

Object.assign(window, { RoomDetailScreen });
