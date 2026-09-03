import { Fragment, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPatients, getPatient, deletePatient } from '../api';

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function History() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState('');
  const [expanded, setExpanded] = useState(null);
  const [detail,   setDetail]   = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error,    setError]    = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getPatients().then(r => setPatients(r.data)).finally(() => setLoading(false));
  }, []);

  const toggleExpand = async (id) => {
    if (expanded === id) { setExpanded(null); setDetail(null); return; }
    setExpanded(id);
    const { data } = await getPatient(id);
    setDetail(data);
  };

  const handleDelete = async (e, p) => {
    e.stopPropagation();
    const ok = window.confirm(
      `Delete ${p.name} (ID #${p.id}) and all of their visits? This cannot be undone.`
    );
    if (!ok) return;
    setError('');
    setDeleting(p.id);
    try {
      await deletePatient(p.id);
      setPatients(list => list.filter(row => row.id !== p.id));
      if (expanded === p.id) { setExpanded(null); setDetail(null); }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete this patient.');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    String(p.id).includes(search)
  );

  if (loading) return <div className="spinner" />;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Patient History</h1>
        <input
          placeholder="Search by name or ID..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '0.5rem 1rem', color: 'var(--text)',
            fontSize: '0.9rem', width: '220px',
          }}
        />
      </div>

      {error && (
        <div className="alert-banner alert-danger" style={{ padding: '0.8rem 1rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
          No patients found. Run an assessment first.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="history-table">
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Age</th><th>Gender</th>
                <th>Visits</th><th>Last Risk</th><th>Last Seen</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <Fragment key={p.id}>
                  <tr onClick={() => toggleExpand(p.id)}>
                    <td><span style={{ color: 'var(--primary)', fontWeight: 700 }}>#{p.id}</span></td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{p.age}</td>
                    <td>{p.gender}</td>
                    <td>{p.visit_count}</td>
                    <td>
                      {p.last_risk_label
                        ? <span className={`badge badge-${p.last_risk_label.toLowerCase()}`}>
                            {p.last_risk_label} ({p.last_risk_percent?.toFixed(1)}%)
                          </span>
                        : '—'}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {p.last_visit ? new Date(p.last_visit).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline" style={{ padding: '0.3rem 0.8rem', fontSize: '0.82rem' }}
                          onClick={e => { e.stopPropagation(); navigate('/', { state: { prefill: p } }); }}>
                          + New Visit
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          title={`Delete ${p.name}`}
                          aria-label={`Delete ${p.name}`}
                          disabled={deleting === p.id}
                          onClick={e => handleDelete(e, p)}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expanded === p.id && detail && (
                    <tr>
                      <td colSpan={8} style={{ padding: '0', background: 'var(--bg)' }}>
                        <div style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ fontWeight: 700, marginBottom: '0.8rem', color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                            All Visits
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {detail.visits.map(v => (
                              <div key={v.id} style={{
                                display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
                                background: 'var(--surface)', borderRadius: '8px', padding: '0.7rem 1rem',
                                border: '1px solid var(--border)',
                              }}>
                                <span style={{ fontWeight: 700, color: 'var(--primary)', minWidth: 70 }}>Visit #{v.visit_number}</span>
                                <span className={`badge badge-${v.risk_label.toLowerCase()}`}>{v.risk_label} {v.risk_percent.toFixed(1)}%</span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                  {new Date(v.visited_at).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
