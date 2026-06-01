/* HomeScreen.jsx — clinic home / 首页 */

function Hero() {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      paddingTop: STATUS_BAR_H + 56, paddingBottom: 64, paddingLeft: 24, paddingRight: 24,
      background: 'linear-gradient(160deg, var(--green-600) 0%, var(--green-700) 55%, var(--green-900) 100%)',
    }}>
      {/* soft organic glow */}
      <div style={{ position: 'absolute', top: -60, right: -50, width: 220, height: 220, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(120,210,185,0.45), transparent 70%)' }} />
      <div style={{ position: 'absolute', bottom: -40, left: -30, width: 160, height: 160, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.22), transparent 70%)' }} />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 14,
          padding: '5px 12px', borderRadius: 'var(--r-pill)', background: 'rgba(255,255,255,0.14)',
          border: '0.5px solid rgba(255,255,255,0.25)' }}>
          <Icon name="ear" size={15} color="#fff" stroke={1.8} />
          <span style={{ color: 'rgba(255,255,255,0.92)', fontSize: 12, letterSpacing: '0.04em' }}>{CLINIC.enName} · 心理咨询</span>
        </div>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 34, color: '#fff', letterSpacing: '0.02em' }}>
          {CLINIC.name}
        </h1>
        <p style={{ margin: '10px 0 0', fontFamily: 'var(--font-serif)', fontSize: 16, color: 'rgba(255,255,255,0.85)', fontWeight: 400 }}>
          {CLINIC.tagline}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
          <Icon name="pin" size={15} color="rgba(255,255,255,0.8)" stroke={1.8} />{CLINIC.city}
          <span style={{ opacity: 0.4 }}>·</span>
          <Icon name="clock" size={15} color="rgba(255,255,255,0.8)" stroke={1.8} />{CLINIC.hours}
        </div>
      </div>
    </div>
  );
}

function StatsCard() {
  const s = CLINIC.stats;
  return (
    <div className="card" style={{ margin: '-44px var(--sp-4) 0', position: 'relative', padding: '18px 8px',
      display: 'flex', alignItems: 'center' }}>
      <Stat value={s.rooms} label="咨询室" />
      <div style={{ width: '0.5px', height: 34, background: 'var(--color-border)' }} />
      <Stat value={s.freeToday} label="今日空闲" accent />
      <div style={{ width: '0.5px', height: 34, background: 'var(--color-border)' }} />
      <Stat value={s.counselors} label="咨询师" />
    </div>
  );
}

function RoomMiniCard({ room, onOpen }) {
  return (
    <div className="tappable" onClick={() => onOpen(room)} style={{
      flexShrink: 0, width: 158, borderRadius: 'var(--r-md)', overflow: 'hidden',
      background: 'var(--color-surface)', boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ position: 'relative' }}>
        <PhotoPlaceholder label="室内照片" height={104} radius={0} tint={room.tint} icon="image" />
        <div style={{ position: 'absolute', top: 8, left: 8 }}><StatusBadge state={room.status} /></div>
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{room.name}</span>
          <span style={{ fontSize: 11, color: 'var(--color-fg4)' }}>{room.en}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 12, color: 'var(--color-fg3)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon name="users" size={13} color="var(--color-fg3)" />{room.cap}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon name="area" size={13} color="var(--color-fg3)" />{room.area}</span>
        </div>
      </div>
    </div>
  );
}

function HomeScreen({ onOpenRoom, onTab }) {
  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30 }}>
        <WeChatNav title={CLINIC.name} variant="transparent" />
      </div>
      <div className="mp-scroll">
        <Hero />
        <StatsCard />

        <SectionHeader title="今日可用咨询室" more="全部" onMore={() => onTab('rooms')} />
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 var(--sp-4) 4px', scrollbarWidth: 'none' }}>
          {ROOMS.map((r) => <RoomMiniCard key={r.id} room={r} onOpen={onOpenRoom} />)}
        </div>

        <SectionHeader title="关于倾听" more="了解更多" onMore={() => onTab('about')} />
        <div className="card" style={{ margin: '0 var(--sp-4)', padding: 16 }}>
          <p className="t-body" style={{ margin: 0 }}>{CLINIC.intro}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            <Tag icon="shield" variant="tint">注册系统</Tag>
            <Tag icon="users" variant="tint">12 位咨询师</Tag>
            <Tag icon="heart" variant="tint">伦理督导</Tag>
          </div>
        </div>

        <SectionHeader title="到访信息" />
        <div className="card" style={{ margin: '0 var(--sp-4) 0' }}>
          <InfoRow icon="pin" label="地址" value={CLINIC.address.replace('上海市静安区', '')} onClick={() => {}} />
          <InfoRow icon="clock" label="营业时间" value={CLINIC.hours} />
          <InfoRow icon="phone" label="预约电话" value={CLINIC.phone} onClick={() => {}} last />
        </div>

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen });
