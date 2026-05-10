import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, Doughnut } from 'react-chartjs-2'
import { analyticsApi, getError } from '../lib/api'
import './Insights.css'

const monoFamily = "'JetBrains Mono', monospace"
const palette = ['#d4ff3a', '#ff6b35', '#f5a623', '#7fd17f', '#6bb6ff', '#e84545', '#a8a397']

export default function Insights() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    setLoading(true)
    analyticsApi.insights()
      .then(setData)
      .catch((e) => setErr(getError(e)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Computing insights…</div>
  if (err) return <div className="err">{err}</div>
  if (!data) return null

  const { roles, sources, funnel, keywords_overall, keywords_by_role } = data
  const totalApps = funnel.applied
  const hasJds = keywords_overall.length > 0

  if (totalApps === 0) {
    return (
      <div className="fade-in">
        <header className="page-hero">
          <div>
            <div className="eyebrow">// Section 04 · Patterns</div>
            <h1 className="display page-title">Your <em>insights.</em></h1>
          </div>
        </header>
        <div className="panel">
          <div className="empty">
            <div className="empty-icon">◇</div>
            <h4>Insights unlock as you apply</h4>
            <p>Add at least one application — paste a JD too, for keyword analysis.</p>
            <Link to="/applications/new" className="btn btn-sm">+ Add application</Link>
          </div>
        </div>
      </div>
    )
  }

  const maxRole = roles[0]?.count || 1
  const interviewRate = Math.round((funnel.interview / funnel.applied) * 100) || 0
  const offerRate = Math.round((funnel.offer / funnel.applied) * 100) || 0

  const funnelChart = {
    labels: ['Applied', 'Interview', 'Offer'],
    datasets: [{
      data: [funnel.applied, funnel.interview, funnel.offer],
      backgroundColor: ['#d4ff3a', '#f5a623', '#7fd17f'],
      borderRadius: 0,
      barThickness: 38,
    }],
  }

  const funnelOpts = {
    indexAxis: 'y',
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1c1c18', borderColor: '#3a3a32', borderWidth: 1,
        titleFont: { family: monoFamily }, bodyFont: { family: monoFamily },
      },
    },
    scales: {
      x: { grid: { color: '#2c2c27' }, ticks: { color: '#6b675c', font: { family: monoFamily, size: 10 }, stepSize: 1 }, beginAtZero: true },
      y: { grid: { display: false }, ticks: { color: '#a8a397', font: { family: monoFamily, size: 11 } } },
    },
  }

  const sourceChart = {
    labels: sources.map((s) => s.source),
    datasets: [{
      data: sources.map((s) => s.count),
      backgroundColor: sources.map((_, i) => palette[i % palette.length]),
      borderColor: '#1c1c18',
      borderWidth: 3,
    }],
  }

  const sourceOpts = {
    responsive: true, maintainAspectRatio: false, cutout: '60%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#a8a397',
          font: { family: monoFamily, size: 11 },
          boxWidth: 12, padding: 10,
        },
      },
      tooltip: {
        backgroundColor: '#1c1c18', borderColor: '#3a3a32', borderWidth: 1,
        titleFont: { family: monoFamily }, bodyFont: { family: monoFamily },
      },
    },
  }

  return (
    <div className="insights-page fade-in">
      <header className="page-hero">
        <div>
          <div className="eyebrow">// Section 04 · Patterns</div>
          <h1 className="display page-title">Your <em>insights.</em></h1>
        </div>
        <div className="hero-meta">
          <div className="meta-line"><strong>{totalApps}</strong> applications · {roles.length} unique roles</div>
          <div className="meta-line">{Object.keys(keywords_by_role).length} JDs analyzed</div>
        </div>
      </header>

      <section className="grid-2">
        <article className="panel">
          <div className="panel-tag">
            <h3>// Interests</h3>
            <span className="panel-meta">where you focus</span>
          </div>
          <h2>Roles you target most</h2>
          <div className="role-list">
            {roles.length === 0 ? (
              <div className="dim sm">No data yet.</div>
            ) : roles.map((r) => (
              <div key={r.role} className="role-row">
                <div>
                  <div className="role-name">{r.role}</div>
                  <div className="role-bar"><div style={{ width: `${(r.count / maxRole) * 100}%` }} /></div>
                </div>
                <div className="role-count"><strong>{r.count}</strong> apps</div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-tag">
            <h3>// Funnel</h3>
            <span className="panel-meta">conversion</span>
          </div>
          <h2>Applied → Interview → Offer</h2>
          <div className="chart-wrap" style={{ height: 220 }}>
            <Bar data={funnelChart} options={funnelOpts} />
          </div>
          <div className="funnel-stats">
            <div className="fstat">
              <div className="fstat-label">APPLIED</div>
              <div className="fstat-val">{funnel.applied}</div>
            </div>
            <div className="fstat">
              <div className="fstat-label">→ INTERVIEW</div>
              <div className="fstat-val warn">{funnel.interview}</div>
              <div className="fstat-pct">{interviewRate}%</div>
            </div>
            <div className="fstat">
              <div className="fstat-label">→ OFFER</div>
              <div className="fstat-val good">{funnel.offer}</div>
              <div className="fstat-pct">{offerRate}%</div>
            </div>
          </div>
        </article>
      </section>

      <section className="grid-2">
        <article className="panel">
          <div className="panel-tag">
            <h3>// Channels</h3>
            <span className="panel-meta">where you apply</span>
          </div>
          <h2>Application sources</h2>
          <div className="chart-wrap" style={{ height: 260 }}>
            <Doughnut data={sourceChart} options={sourceOpts} />
          </div>
        </article>

        <article className="panel">
          <div className="panel-tag">
            <h3>// JD Keywords</h3>
            <span className="panel-meta">most common terms</span>
          </div>
          <h2>What's commonly asked (overall)</h2>
          {!hasJds ? (
            <div className="empty">
              <p>Paste JDs into your applications to extract keywords.</p>
            </div>
          ) : (
            <div className="tag-cloud">
              {keywords_overall.map((k) => (
                <div key={k.keyword} className="tag" style={{
                  '--tag-weight': Math.min(1, 0.4 + (k.count / keywords_overall[0].count) * 0.6),
                }}>
                  {k.keyword} <span className="tag-count">{k.count}</span>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      {Object.keys(keywords_by_role).length > 0 && (
        <section className="panel">
          <div className="panel-tag">
            <h3>// Per-Role Patterns</h3>
            <span className="panel-meta">skill keywords by role</span>
          </div>
          <h2>What's commonly asked, by role</h2>
          <div className="role-keywords">
            {Object.entries(keywords_by_role).map(([role, kws]) => (
              <div key={role} className="role-keyword-block">
                <div className="role-keyword-head">
                  <span className="role-keyword-title">{role}</span>
                  <span className="dim mono sm">{kws.length} terms</span>
                </div>
                <div className="tag-cloud">
                  {kws.slice(0, 18).map((k) => (
                    <div key={k.keyword} className="tag">
                      {k.keyword} <span className="tag-count">{k.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
