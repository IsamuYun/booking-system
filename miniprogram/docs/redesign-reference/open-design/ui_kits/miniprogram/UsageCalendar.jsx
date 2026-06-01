/* UsageCalendar.jsx — the signature component: room usage / availability
   across the past 15 days and the next 15 days (31 days total).
   Tap a day to see that day's hour-by-hour status.
   Data is generated deterministically per calendar date (placeholder —
   wire to the clinic's real booking data).
   Exports: UsageCalendar */

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const HOUR_SLOTS = Array.from({ length: 12 }, (_, i) => 9 + i); // 09:00 .. 20:00 (ends 21:00)

function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildDay(offset) {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + offset);
  const dayIdx = Math.floor(d.getTime() / 86400000);
  const rnd = mulberry32(dayIdx + 7);
  const isRest = rnd() < 0.07;
  const slots = HOUR_SLOTS.map(() => {
    if (isRest) return 'rest';
    const r = rnd();
    const busyP = offset < 0 ? 0.52 : offset === 0 ? 0.45 : 0.34;
    return r < busyP ? 'busy' : 'free';
  });
  return { date: d, offset, isRest, slots };
}

const DAYS = Array.from({ length: 31 }, (_, i) => buildDay(i - 15));
const TODAY_INDEX = 15;

function occupancy(day) {
  if (day.isRest) return 0;
  const busy = day.slots.filter((s) => s === 'busy').length;
  return busy / day.slots.length;
}

function DayCell({ day, selected, onSelect }) {
  const isToday = day.offset === 0;
  const occ = occupancy(day);
  const m = day.date.getMonth() + 1, dd = day.date.getDate();
  return (
    <button onClick={() => onSelect(day.offset)} style={{
      flexShrink: 0, width: 48, padding: '8px 0 7px', border: 'none', cursor: 'pointer',
      borderRadius: 12, background: selected ? 'var(--color-primary)' : 'transparent',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
      transition: 'background-color 160ms',
    }}>
      <span style={{ fontSize: 11, color: selected ? 'rgba(255,255,255,0.8)' : 'var(--color-fg3)' }}>
        {isToday ? '今天' : `周${WEEKDAYS[day.date.getDay()]}`}
      </span>
      <span className="t-num" style={{
        fontSize: 16, fontWeight: 600,
        color: selected ? '#fff' : (day.offset < 0 ? 'var(--color-fg3)' : 'var(--color-fg1)'),
      }}>{dd}</span>
      {/* occupancy mini-bar */}
      <div style={{ width: 26, height: 4, borderRadius: 2, overflow: 'hidden',
        background: selected ? 'rgba(255,255,255,0.3)' : 'var(--status-free-bg)' }}>
        {!day.isRest && (
          <div style={{ width: `${occ * 100}%`, height: '100%',
            background: selected ? '#fff' : 'var(--status-busy-dot)' }} />
        )}
      </div>
      <span className="t-num" style={{ fontSize: 9, color: selected ? 'rgba(255,255,255,0.7)' : 'var(--color-fg4)' }}>
        {m}月
      </span>
    </button>
  );
}

function HourBar({ day }) {
  return (
    <div style={{ display: 'flex', gap: 2, height: 26, borderRadius: 6, overflow: 'hidden' }}>
      {day.slots.map((s, i) => (
        <div key={i} style={{ flex: 1, background: `var(--status-${s}-bg)` }} title={`${HOUR_SLOTS[i]}:00`} />
      ))}
    </div>
  );
}

function SlotGrid({ day }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
      {day.slots.map((s, i) => {
        const h = HOUR_SLOTS[i];
        return (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column', gap: 3,
            padding: '8px 10px', borderRadius: 10,
            background: `var(--status-${s}-bg)`,
          }}>
            <span className="t-num" style={{ fontSize: 13, fontWeight: 600, color: `var(--status-${s}-fg)` }}>
              {String(h).padStart(2, '0')}:00
            </span>
            <span style={{ fontSize: 11, color: `var(--status-${s}-fg)`, opacity: 0.85 }}>
              {s === 'free' ? '空闲' : s === 'busy' ? '已预约' : '休息'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Legend() {
  const items = [['free', '空闲'], ['busy', '已预约'], ['rest', '休息']];
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {items.map(([s, label]) => (
        <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-fg3)' }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: `var(--status-${s}-dot)` }} />{label}
        </span>
      ))}
    </div>
  );
}

function UsageCalendar() {
  const [sel, setSel] = React.useState(0);
  const stripRef = React.useRef(null);
  React.useEffect(() => {
    if (stripRef.current) {
      const cell = 48 + 4; // width + gap
      stripRef.current.scrollLeft = TODAY_INDEX * cell - 120;
    }
  }, []);
  const day = DAYS[sel + 15];
  const occ = Math.round(occupancy(day) * 100);
  const dateLabel = `${day.date.getMonth() + 1}月${day.date.getDate()}日 · 周${WEEKDAYS[day.date.getDay()]}`;

  return (
    <div className="card" style={{ padding: '16px 0 18px', margin: '0 var(--sp-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 12px' }}>
        <span style={{ fontSize: 'var(--fs-h3)', fontWeight: 600 }}>使用状况</span>
        <span style={{ fontSize: 12, color: 'var(--color-fg3)' }}>近 15 天 · 未来 15 天</span>
      </div>

      {/* day strip */}
      <div ref={stripRef} style={{
        display: 'flex', gap: 4, overflowX: 'auto', padding: '0 12px 4px',
        scrollbarWidth: 'none',
      }}>
        {DAYS.map((d) => (
          <DayCell key={d.offset} day={d} selected={d.offset === sel} onSelect={setSel} />
        ))}
      </div>

      <div style={{ padding: '0 16px' }}>
        <hr className="divider" style={{ margin: '12px 0 14px' }} />
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 'var(--fs-h3)', fontWeight: 600 }}>{dateLabel}</span>
          <span style={{ fontSize: 12, color: 'var(--color-fg3)' }}>
            {day.isRest ? '全天休息' : `${day.offset < 0 ? '使用率' : '已约'} ${occ}%`}
          </span>
        </div>
        <HourBar day={day} />
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0 14px' }}>
          <span className="t-num" style={{ fontSize: 10, color: 'var(--color-fg4)' }}>09:00</span>
          <span className="t-num" style={{ fontSize: 10, color: 'var(--color-fg4)' }}>15:00</span>
          <span className="t-num" style={{ fontSize: 10, color: 'var(--color-fg4)' }}>21:00</span>
        </div>
        <SlotGrid day={day} />
        <div style={{ marginTop: 14 }}><Legend /></div>
      </div>
    </div>
  );
}

Object.assign(window, { UsageCalendar });
