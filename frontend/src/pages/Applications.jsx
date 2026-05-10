import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { appsApi, getError } from '../lib/api'
import { useToast } from '../lib/toast'
import StatusPill from '../components/StatusPill'
import './Applications.css'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export default function Applications() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [filter, setFilter] = useState({ q: '', status: 'all', role: 'all' })
  const [selected, setSelected] = useState(null)

  const navigate = useNavigate()
  const toast = useToast()

  const reload = () => {
    setLoading(true)
    appsApi.list()
      .then(setApps)
      .catch((e) => setErr(getError(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { reload() }, [])

  const allRoles = useMemo(() => {
    const set = new Set(apps.map((a) => a.role).filter(Boolean))
    return Array.from(set).sort()
  }, [apps])

  const filtered = useMemo(() => {
    return apps.filter((a) => {
      if (filter.q) {
        const q = filter.q.toLowerCase()
        if (!a.company.toLowerCase().includes(q) && !a.role.toLowerCase().includes(q)) return false
      }
      if (filter.status !== 'all' && a.status !== filter.status) return false
      if (filter.role !== 'all' && a.role !== filter.role) return false
      return true
    })
  }, [apps, filter])

  const handleDelete = async (a) => {
    if (!confirm(`Delete application to ${a.company} for ${a.role}?`)) return
    try {
      await appsApi.remove(a.id)
      toast.push('Application deleted.', 'success')
      setSelected(null)
      reload()
    } catch (e) {
      toast.push(getError(e), 'error')
    }
  }

  return (
    <div className="apps-page fade-in">
      <header className="page-hero">
        <div>
          <div className="eyebrow">// Section 02 · Index</div>
          <h1 className="display page-title">All <em>applications.</em></h1>
        </div>
        <div className="hero-meta">
          <div className="meta-line"><strong>{filtered.length}</strong> of {apps.length} shown</div>
        </div>
      </header>

      <div className="filter-bar">
        <input
          type="text"
          className="input filter-search"
          placeholder="Search company or role…"
          value={filter.q}
          onChange={(e) => setFilter({ ...filter, q: e.target.value })}
        />
        <select
          className="input filter-select"
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
        >
          <option value="all">All statuses</option>
          <option value="applied">Applied</option>
          <option value="interview">Interview</option>
          <option value="offer">Offer</option>
          <option value="rejected">Rejected</option>
          <option value="ghosted">Ghosted</option>
        </select>
        <select
          className="input filter-select"
          value={filter.role}
          onChange={(e) => setFilter({ ...filter, role: e.target.value })}
        >
          <option value="all">All roles</option>
          {allRoles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setFilter({ q: '', status: 'all', role: 'all' })}
        >
          Reset
        </button>
        <div style={{ flex: 1 }} />
        <button className="btn btn-sm" onClick={() => navigate('/applications/new')}>
          + New entry
        </button>
      </div>

      {err && <div className="err">{err}</div>}

      <div className="panel">
        {loading ? (
          <div className="loading">Loading applications…</div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">◇</div>
            <h4>{apps.length === 0 ? 'No applications yet' : 'No matches'}</h4>
            <p>{apps.length === 0 ? 'Add your first one to start tracking.' : 'Try adjusting filters.'}</p>
            {apps.length === 0 && (
              <Link to="/applications/new" className="btn btn-sm">+ Add application</Link>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th><th>Role</th><th>Date</th><th>Status</th><th>Package</th><th>Source</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong>{a.company}</strong>
                      {a.location && <div className="mono dim sm cell-sub">{a.location}</div>}
                    </td>
                    <td>{a.role}</td>
                    <td className="mono dim sm">{fmtDate(a.apply_date)}</td>
                    <td><StatusPill status={a.status} /></td>
                    <td className="mono sm">{a.package_text || '—'}</td>
                    <td className="mono dim sm">{a.source || '—'}</td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn" onClick={() => setSelected(a)}>view</button>
                        <button className="icon-btn" onClick={() => navigate(`/applications/${a.id}/edit`)}>edit</button>
                        <button className="icon-btn danger" onClick={() => handleDelete(a)}>×</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <DetailModal
          app={selected}
          onClose={() => setSelected(null)}
          onEdit={() => navigate(`/applications/${selected.id}/edit`)}
          onDelete={() => handleDelete(selected)}
        />
      )}
    </div>
  )
}

function DetailModal({ app, onClose, onEdit, onDelete }) {
  return (
    <div className="modal-bg" onClick={(e) => { if (e.target.classList.contains('modal-bg')) onClose() }}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-tag">// {app.status.toUpperCase()} · {fmtDate(app.apply_date)}</div>
        <h2 className="display modal-title">{app.role}</h2>
        <div className="modal-company">at <em>{app.company}</em></div>

        <div className="detail-list">
          <DetailRow label="Status" value={<StatusPill status={app.status} />} />
          <DetailRow label="Package" value={app.package_text || '—'} />
          <DetailRow label="Location" value={app.location || '—'} />
          <DetailRow label="Source" value={app.source || '—'} />
          {app.job_url && (
            <DetailRow label="URL" value={
              <a href={app.job_url} target="_blank" rel="noreferrer" className="link">{app.job_url}</a>
            } />
          )}
          {app.resume_filename && (
            <DetailRow label="Resume" value={
              <a href={appsApi.resumeUrl(app.id)} target="_blank" rel="noreferrer" className="link">
                ↓ {app.resume_filename}
              </a>
            } />
          )}
          {app.jd && (
            <DetailRow label="JD" value={<div className="jd-box">{app.jd}</div>} />
          )}
          {app.notes && (
            <DetailRow label="Notes" value={<div className="notes-box">{app.notes}</div>} />
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-sm" onClick={onEdit}>Edit</button>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
          <div style={{ flex: 1 }} />
          <button className="btn btn-danger btn-sm" onClick={onDelete}>Delete</button>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="detail-row">
      <div className="detail-label">{label}</div>
      <div className="detail-value">{value}</div>
    </div>
  )
}
