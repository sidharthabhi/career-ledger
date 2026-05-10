import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import './Layout.css'

const NAV = [
  { to: '/', label: 'Dashboard', code: '01', end: true },
  { to: '/applications', label: 'Applications', code: '02' },
  { to: '/applications/new', label: 'New Entry', code: '03' },
  { to: '/insights', label: 'Insights', code: '04' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">◆</div>
          <div className="brand-text">
            <div className="brand-name">Career</div>
            <div className="brand-sub">Ledger</div>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-heading">// Navigation</div>
          <nav className="nav">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-code">{item.code}</span>
                <span className="nav-label">{item.label}</span>
                <span className="nav-arrow">→</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{user?.username?.[0]?.toUpperCase() || '?'}</div>
            <div className="user-info">
              <div className="user-name">{user?.full_name || user?.username}</div>
              <div className="user-handle">@{user?.username}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <span>Sign out</span>
            <span>↗</span>
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
