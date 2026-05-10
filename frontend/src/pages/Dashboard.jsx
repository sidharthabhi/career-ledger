import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend,
} from 'chart.js'
import { analyticsApi, getError } from '../lib/api'
import { useAuth } from '../lib/auth'
import StatusPill from '../components/StatusPill'
import './Dashboard.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const chartTextColor = '#a8a397'
const chartGrid = '#2c2c27'
const monoFamily = "'JetBrains Mono', monospace"

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    setLoading(true)
    analyticsApi.dashboard()
      .then(setData)
      .catch((e) => setErr(getError(e)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Loading dashboard…</div>
  if (err) return <div className="err">{err}</div>
  if (!data) return null

  const { kpi, activity, status_breakdown, recent } = data

  const activityChart = {
    labels: activity.map((a) => new Date(a.date).toLocaleDateString('en', { day: '2-digit', month: 'short' })),
    datasets: [{
      data: activity.map((a) => a.count),
      backgroundColor: '#d4ff3a',
      borderRadius: 0,
      barThickness: 14,
    }],
  }

  const activityOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1c1c18', borderColor: '#3a3a32', borderWidth: 1,
        titleFont: { family: monoFamily, size: 11 },
        bodyFont: { family: monoFamily, size: 12 },
        callbacks: { label: (c) => `${c.parsed.y} application${c.parsed.y !== 1 ? 's' : ''}` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6b675c', font: { family: monoFamily, size: 9 } } },
      y: { grid: { color: chartGrid }, ticks: { color: '#6b675c', font: { family: monoFamily, size: 10 }, stepSize: 1 }, beginAtZero: true },
    },
  }

  const statusChart = {
    labels: ['Applied', 'Interview', 'Offer', 'Rejected', 'Ghosted'],
    datasets: [{
      data: [
        status_breakdown.applied,
        status_breakdown.interview,
        status_breakdown.offer,
        status_breakdown.rejected,
        status_breakdown.ghosted,
      ],
      backgroundColor: ['#d4ff3a', '#f5a623', '#7fd17f', '#e84545', '#6b675c'],
      borderColor: '#1c1c18',
      borderWidth: 3,
    }],
  }

  const statusOpts = {
    responsive: true, maintainAspectRatio: false, cutout: '65%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: chartTextColor,
          font: { family: monoFamily, size: 11 },
          boxWidth: 12, padding: 12,
          generateLabels: (chart) => {
            const data = chart.data
            return data.labels.map((l, i) => ({
              text: `${l}  ${data.datasets[0].data[i]}`,
              fillStyle: data.datasets[0].backgroundColor[i],
              strokeStyle: data.datasets[0].backgroundColor[i],
              hidden: false, index: i,
            }))
          },
        },
      },
      tooltip: {
        backgroundColor: '#1c1c18', borderColor: '#3a3a32', borderWidth: 1,
        titleFont: { family: monoFamily }, bodyFont: { family: monoFamily },
      },
    },
  }

  const today = new Date().toLocaleDateString('en', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="dashboard fade-in">
      <header className="page-hero">
        <div>
          <div className="eyebrow">// Section 01 · Overview</div>
          <h1 className="display page-title">
            {greeting()}, <em>{user?.username}.</em>
          </h1>
        </div>
        <div className="hero-meta">
          <div className="meta-line">{today}</div>
          <div className="meta-line"><strong>{kpi.total}</strong> applications tracked</div>
        </div>
      </header>

      <section className="kpi-grid stagger">
        <Kpi label="Total Applied" value={kpi.total} sub="all time" />
        <Kpi label="This Week" value={kpi.this_week} sub="last 7 days" />
        <Kpi label="This Month" value={kpi.this_month} sub="last 30 days" />
        <Kpi label="Interviews" value={kpi.interviews} sub="includes offers" tone="warn" />
        <Kpi label="Offers" value={kpi.offers} sub={kpi.offers > 0 ? '↑ active' : 'awaiting'} tone={kpi.offers > 0 ? 'good' : null} />
        <Kpi label="Response Rate" value={`${kpi.response_rate}%`} sub="heard back" />
      </section>

      <section className="grid-2">
        <article className="panel">
          <div className="panel-tag">
            <h3>// Activity</h3>
            <span className="panel-meta">last 14 days</span>
          </div>
          <h2>Daily application volume</h2>
          <div className="chart-wrap"><Bar data={activityChart} options={activityOpts} /></div>
        </article>

        <article className="panel">
          <div className="panel-tag">
            <h3>// Pipeline</h3>
            <span className="panel-meta">current state</span>
          </div>
          <h2>Status breakdown</h2>
          <div className="chart-wrap"><Doughnut data={statusChart} options={statusOpts} /></div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-tag">
          <h3>// Recent</h3>
          <span className="panel-meta">latest 5</span>
        </div>
        <div className="recent-head">
          <h2>Latest applications</h2>
          <Link to="/applications" className="link">View all →</Link>
        </div>

        {recent.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">◇</div>
            <h4>No applications yet</h4>
            <p>Start tracking your job hunt by adding your first application.</p>
            <Link to="/applications/new" className="btn btn-sm">+ Add application</Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th><th>Role</th><th>Applied</th><th>Status</th><th>Package</th><th></th>
                </tr>
              </thead>
              <tbody>
                {recent.map((a) => (
                  <tr key={a.id}>
                    <td><strong>{a.company}</strong></td>
                    <td>{a.role}</td>
                    <td className="mono dim sm">{fmtDate(a.apply_date)}</td>
                    <td><StatusPill status={a.status} /></td>
                    <td className="mono sm">{a.package_text || '—'}</td>
                    <td><Link to={`/applications`} className="row-link">view →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function Kpi({ label, value, sub, tone }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className={`kpi-sub ${tone || ''}`}>{sub}</div>
    </div>
  )
}
