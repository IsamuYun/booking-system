/* RoomsScreen.jsx — counseling rooms list / 咨询室 */

function RoomListCard({ room, onOpen }) {
  return (
    <div className="card tappable" onClick={() => onOpen(room)} style={{
      margin: '0 var(--sp-4) 12px', overflow: 'hidden', display: 'flex',
    }}>
      <div style={{ position: 'relative', width: 120, flexShrink: 0 }}>
        <PhotoPlaceholder label="" height="100%" radius={0} tint={room.tint} icon="image" style={{ minHeight: 132 }} />
      </div>
      <div style={{ flex: 1, padding: '12px 14px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>{room.name}</span>
            <span style={{ fontSize: 11, color: 'var(--color-fg4)' }}>{room.en}</span>
          </div>
          <StatusBadge state={room.status} />
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.5, color: 'var(--color-fg2)',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {room.desc}
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <Tag icon="users" variant="neutral">{room.cap}</Tag>
          <Tag icon="area" variant="neutral">{room.area}</Tag>
        </div>
      </div>
    </div>
  );
}

function RoomsScreen({ onOpenRoom }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <WeChatNav title="咨询室" />
      <div className="mp-scroll">
        <div style={{ padding: '16px var(--sp-4) 4px' }}>
          <p className="t-sec" style={{ margin: 0 }}>
            共 {ROOMS.length} 间咨询室。点击查看室内环境与近 30 天的使用状况。
          </p>
        </div>
        <div style={{ paddingTop: 12 }}>
          {ROOMS.map((r) => <RoomListCard key={r.id} room={r} onOpen={onOpenRoom} />)}
        </div>
        <div style={{ height: 12 }} />
      </div>
    </div>
  );
}

Object.assign(window, { RoomsScreen });
