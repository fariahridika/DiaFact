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

function VisitList({ visits }) {
  if (!visits?.length) {
    return <div className="muted">No visits yet.</div>;
  }
  return (
    <div className="visit-list">
      {visits.map(v => (
        <div key={v.id} className="visit-chip">
          <span className="visit-chip-id">Visit #{v.visit_number}</span>
          <span className={`badge badge-${v.risk_label.toLowerCase()}`}>
            {v.risk_label} {v.risk_percent.toFixed(1)}%
          </span>
          <span className="muted visit-chip-date">
            {new Date(v.visited_at).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
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

  const actions = (p) => (
    <div className="row-actions" onClick={e => e.stopPropagation()}>
      <button className="btn btn-outline btn-compact"
        onClick={() => navigate('/', { state: { prefill: p } })}>
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
  );

  if (loading) return <div className="spinner" />;

  return (
    <div className="page page-wide">
      <div className="page-toolbar">
        <h1 className="page-title">Patient History</h1>
        <input
          className="search-input"
          placeholder="Search by name or ID..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="alert-banner alert-danger compact-alert">{error}</div>
      )}

      {filtered.length === 0 ? (
        <div className="card empty-state">
          No patients found. Run an assessment first.
        </div>
      ) : (
        <>
          <div className="card history-desktop">
            <div className="table-scroll">
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
                        <td><span className="id-chip">#{p.id}</span></td>
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
                        <td className="muted small">
                          {p.last_visit ? new Date(p.last_visit).toLocaleDateString() : '—'}
                        </td>
                        <td>{actions(p)}</td>
                      </tr>
                      {expanded === p.id && detail && (
                        <tr>
                          <td colSpan={8} className="detail-cell">
                            <div className="detail-pad">
                              <div className="section-kicker">All Visits</div>
                              <VisitList visits={detail.visits} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="history-mobile">
            {filtered.map(p => (
              <article key={p.id} className="patient-card">
                <button type="button" className="patient-card-main"
                  onClick={() => toggleExpand(p.id)}>
                  <div className="patient-card-top">
                    <span className="id-chip">#{p.id}</span>
                    <strong className="patient-card-name">{p.name}</strong>
                  </div>
                  <div className="patient-card-meta">
                    {p.age} yrs · {p.gender} · {p.visit_count} visit{p.visit_count === 1 ? '' : 's'}
                  </div>
                  <div className="patient-card-risk">
                    {p.last_risk_label
                      ? <span className={`badge badge-${p.last_risk_label.toLowerCase()}`}>
                          {p.last_risk_label} ({p.last_risk_percent?.toFixed(1)}%)
                        </span>
                      : <span className="muted">No assessments yet</span>}
                    <span className="muted small">
                      {p.last_visit ? new Date(p.last_visit).toLocaleDateString() : ''}
                    </span>
                  </div>
                </button>
                {actions(p)}
                {expanded === p.id && detail && (
                  <div className="patient-card-visits">
                    <div className="section-kicker">All Visits</div>
                    <VisitList visits={detail.visits} />
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
