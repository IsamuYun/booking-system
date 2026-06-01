/* AboutScreen.jsx — about the clinic / 关于诊所 */

function AboutScreen() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <WeChatNav title="关于诊所" />
      <div className="mp-scroll">
        {/* environment hero */}
        <div style={{ padding: '16px var(--sp-4) 0' }}>
          <PhotoPlaceholder label="诊所环境照片" height={180} radius="var(--r-lg)" tint="green" icon="image" />
        </div>

        {/* philosophy pull-quote */}
        <div style={{ padding: '22px var(--sp-4) 4px' }}>
          <Icon name="ear" size={26} color="var(--color-primary)" stroke={1.6} />
          <p style={{ margin: '10px 0 0', fontFamily: 'var(--font-serif)', fontSize: 19, lineHeight: 1.6,
            color: 'var(--color-fg1)', fontWeight: 500 }}>
            “{CLINIC.philosophy}”
          </p>
        </div>

        <SectionHeader title="我们是谁" />
        <div className="card" style={{ margin: '0 var(--sp-4)', padding: 16 }}>
          <p className="t-body" style={{ margin: 0 }}>{CLINIC.intro}</p>
          <hr className="divider" style={{ margin: '14px 0' }} />
          <div style={{ display: 'flex' }}>
            <Stat value={CLINIC.established} label="创立年份" />
            <div style={{ width: '0.5px', background: 'var(--color-border)' }} />
            <Stat value={CLINIC.stats.counselors} label="注册咨询师" />
            <div style={{ width: '0.5px', background: 'var(--color-border)' }} />
            <Stat value={CLINIC.stats.rooms} label="咨询室" />
          </div>
        </div>

        <SectionHeader title="资质与伦理" />
        <div className="card" style={{ margin: '0 var(--sp-4)' }}>
          {CLINIC.credentials.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
              borderBottom: i < CLINIC.credentials.length - 1 ? '0.5px solid var(--color-border)' : 'none' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: 'var(--color-primary-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="check" size={16} color="var(--color-primary-deep)" stroke={2.2} />
              </div>
              <span style={{ fontSize: 14, color: 'var(--color-fg1)' }}>{c}</span>
            </div>
          ))}
        </div>

        <SectionHeader title="到访与联系" />
        <div className="card" style={{ margin: '0 var(--sp-4)' }}>
          <InfoRow icon="pin" label="地址" value="静安 · 南京西路 1788 号" onClick={() => {}} />
          <InfoRow icon="clock" label="营业时间" value={CLINIC.hours} />
          <InfoRow icon="phone" label="预约电话" value={CLINIC.phone} onClick={() => {}} last />
        </div>

        <div style={{ padding: '18px var(--sp-4) 8px' }}>
          <button className="btn btn-primary btn-block">
            <Icon name="navigate" size={18} color="#fff" />导航前往诊所
          </button>
        </div>
        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}

Object.assign(window, { AboutScreen });
