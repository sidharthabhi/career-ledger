import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { appsApi, getError } from '../lib/api'
import { useToast } from '../lib/toast'
import './ApplicationForm.css'

const STATUSES = ['applied', 'interview', 'offer', 'rejected', 'ghosted']

const empty = {
  company: '',
  role: '',
  apply_date: new Date().toISOString().slice(0, 10),
  status: 'applied',
  package_text: '',
  package_lpa: '',
  location: '',
  source: '',
  job_url: '',
  jd: '',
  notes: '',
}

export default function ApplicationForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const toast = useToast()

  const [form, setForm] = useState(empty)
  const [resumeFile, setResumeFile] = useState(null)
  const [existingResume, setExistingResume] = useState(null)
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!editing) return
    appsApi.get(id)
      .then((a) => {
        setForm({
          company: a.company || '',
          role: a.role || '',
          apply_date: a.apply_date,
          status: a.status,
          package_text: a.package_text || '',
          package_lpa: a.package_lpa || '',
          location: a.location || '',
          source: a.source || '',
          job_url: a.job_url || '',
          jd: a.jd || '',
          notes: a.notes || '',
        })
        if (a.resume_filename) {
          setExistingResume({ filename: a.resume_filename, url: appsApi.resumeUrl(a.id) })
        }
      })
      .catch((e) => setErr(getError(e)))
      .finally(() => setLoading(false))
  }, [id, editing])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setErr('')
    setSaving(true)
    try {
      const payload = {
        ...form,
        package_lpa: form.package_lpa ? Number(form.package_lpa) : null,
        package_text: form.package_text || null,
        location: form.location || null,
        source: form.source || null,
        job_url: form.job_url || null,
        jd: form.jd || null,
        notes: form.notes || null,
      }

      let saved
      if (editing) {
        saved = await appsApi.update(id, payload)
      } else {
        saved = await appsApi.create(payload)
      }

      if (resumeFile) {
        await appsApi.uploadResume(saved.id, resumeFile)
      }

      toast.push(editing ? 'Application updated.' : 'Application saved.', 'success')
      navigate('/applications')
    } catch (e) {
      setErr(getError(e))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading">Loading…</div>

  return (
    <div className="form-page fade-in">
      <header className="page-hero">
        <div>
          <div className="eyebrow">// Section 03 · {editing ? 'Edit' : 'New'}</div>
          <h1 className="display page-title">
            {editing ? <>Edit <em>application.</em></> : <>New <em>application.</em></>}
          </h1>
        </div>
        <div className="hero-meta">
          <div className="meta-line">{editing ? 'EDIT MODE' : 'NEW ENTRY'}</div>
        </div>
      </header>

      {err && <div className="err">{err}</div>}

      <form onSubmit={onSubmit} className="panel form-panel">
        <div className="form-grid">
          <div className="field">
            <label>Company *</label>
            <input type="text" value={form.company} onChange={set('company')} placeholder="e.g. Razorpay" required />
          </div>

          <div className="field">
            <label>Role *</label>
            <input type="text" value={form.role} onChange={set('role')} placeholder="e.g. Data Analyst" required />
          </div>

          <div className="field">
            <label>Apply date *</label>
            <input type="date" value={form.apply_date} onChange={set('apply_date')} required />
          </div>

          <div className="field">
            <label>Status</label>
            <select value={form.status} onChange={set('status')}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Package (display)</label>
            <input type="text" value={form.package_text} onChange={set('package_text')} placeholder="₹8 LPA" />
          </div>

          <div className="field">
            <label>Package LPA (numeric, for analytics)</label>
            <input
              type="number" step="0.01" min="0"
              value={form.package_lpa}
              onChange={set('package_lpa')}
              placeholder="8.00"
            />
          </div>

          <div className="field">
            <label>Location</label>
            <input type="text" value={form.location} onChange={set('location')} placeholder="Hyderabad / Remote" />
          </div>

          <div className="field">
            <label>Source / Platform</label>
            <input type="text" value={form.source} onChange={set('source')} placeholder="LinkedIn, Naukri, Referral…" />
          </div>

          <div className="field full">
            <label>Job URL</label>
            <input type="url" value={form.job_url} onChange={set('job_url')} placeholder="https://…" />
          </div>

          <div className="field full">
            <label>Job description (paste full JD — used for keyword insights)</label>
            <textarea
              rows="8"
              value={form.jd}
              onChange={set('jd')}
              placeholder="Paste the full JD here. We extract skill keywords for your insights page."
            />
          </div>

          <div className="field full">
            <label>Resume (PDF / DOC / DOCX, max 5MB)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
            />
            {resumeFile && (
              <div className="file-meta">
                ✓ {resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)} KB) — will upload on save
              </div>
            )}
            {!resumeFile && existingResume && (
              <div className="file-meta">
                ✓ <a href={existingResume.url} target="_blank" rel="noreferrer" className="link">{existingResume.filename}</a> (saved)
              </div>
            )}
            {!resumeFile && !existingResume && (
              <div className="file-meta dim">No file selected</div>
            )}
          </div>

          <div className="field full">
            <label>Notes</label>
            <textarea
              rows="4"
              value={form.notes}
              onChange={set('notes')}
              placeholder="Recruiter name, referral, follow-up reminder, anything to remember…"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-lg" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Update application' : 'Save application'}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-lg"
            onClick={() => navigate(editing ? '/applications' : '/')}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
