/* App.jsx — interactive shell: tab navigation + room-detail push */

function App() {
  const [tab, setTab] = React.useState('home');
  const [room, setRoom] = React.useState(null);

  const openRoom = (r) => setRoom(r);
  const goBack = () => setRoom(null);
  const switchTab = (t) => { setRoom(null); setTab(t); };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 0', background: '#DCE6E3' }}>
      <IOSDevice>
        <div className="mp-screen">
          {room ? (
            <div key={room.id} className="screen-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <RoomDetailScreen room={room} onBack={goBack} />
            </div>
          ) : (
            <React.Fragment>
              <div key={tab} className="screen-fade" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {tab === 'home' && <HomeScreen onOpenRoom={openRoom} onTab={switchTab} />}
                {tab === 'rooms' && <RoomsScreen onOpenRoom={openRoom} />}
                {tab === 'about' && <AboutScreen />}
              </div>
              <TabBar active={tab} onChange={switchTab} />
            </React.Fragment>
          )}
        </div>
      </IOSDevice>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
