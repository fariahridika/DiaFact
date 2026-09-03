import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import RiskGauge    from '../components/RiskGauge';
import ShapChart    from '../components/ShapChart';
import CFCards      from '../components/CFCards';
import CompareModal from '../components/CompareModal';

const INPUT_LABELS = {
  age: 'Age', gender: 'Gender',
  glucose: 'Glucose (mmol/L)', weight: 'Weight (kg)', height: 'Height (cm)',
  pulse_rate: 'Pulse Rate', systolic_bp: 'Systolic BP', diastolic_bp: 'Diastolic BP',
  hypertensive: 'Hypertension', cardiovascular_disease: 'Cardiovascular Disease',
  stroke: 'Previous Stroke', family_diabetes: 'Family: Diabetes',
  family_hypertension: 'Family: Hypertension',
};

const YES_NO = ['hypertensive', 'cardiovascular_disease', 'stroke',
                'family_diabetes', 'family_hypertension'];

export default function Results() {
  const { state } = useLocation();
  const navigate  = useNavigate();
  const [showCompare, setShowCompare] = useState(false);
  const [strategy, setStrategy] = useState('shap_guided');

  if (!state?.visit) {
    return (
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>No results to display.</p>
        <button className="btn btn-primary" style={{ marginTop: '1rem' }}
          onClick={() => navigate('/')}>Go to Assessment</button>
      </div>
    );
  }

  const { patient, visit, has_previous, previous_visit, is_new_patient } = state;
  const inputs = visit.input_features || {};
  const op     = visit.operating_point || {};
  const isHigh = visit.risk_label === 'High';

  const guided = visit.counterfactuals || [];
  const uncon  = visit.counterfactuals_unconstrained || [];
  const shown  = strategy === 'shap_guided' ? guided : uncon;

  const ppv = op.expected_precision != null ? Math.round(op.expected_precision * 100) : null;

  return (
    <div className="page page-wide results-page">

      <div className="card results-hero">
        <div>
          <div className="eyebrow">
            {is_new_patient ? '🆕 New Patient' : `Visit #${visit.visit_number}`}
          </div>
          <h2 className="results-name">{patient.name}</h2>
          <div className="results-meta">
            Patient ID: <strong style={{ color: 'var(--primary)' }}>#{patient.id}</strong>
            <span className="dot-sep">·</span>{patient.age} yrs
            <span className="dot-sep">·</span>{patient.gender}
          </div>
        </div>
        <div className="actions-row">
          {has_previous && (
            <button className="btn btn-outline" onClick={() => setShowCompare(true)}>
              📊 Compare visits
            </button>
          )}
          <button className="btn btn-primary" onClick={() => navigate('/')}>+ New Assessment</button>
        </div>
      </div>

      {/*
        A model score is not a diagnosis. The banner reports what the tool
        actually did -- flag or not flag against the selected threshold -- and
        states how often that flag is right, rather than announcing
        "Diabetes: Yes" off a 0.36-precision classifier.
      */}
      <div className={`alert-banner ${isHigh ? 'alert-danger' : 'alert-success'}`}>
        <div style={{ fontSize: '2.5rem' }}>{isHigh ? '⚠️' : '✅'}</div>
        <div>
          <h2>{isHigh ? 'Flagged: elevated T2D risk' : 'Not flagged: below threshold'}</h2>
          <p>
            Estimated risk <strong>{visit.risk_percent}%</strong>, against a
            flagging threshold of {op.threshold != null ? `${(op.threshold * 100).toFixed(1)}%` : 'n/a'}
            {op.name ? ` (${op.name} setting)` : ''}.
            {isHigh && ppv != null && (
              <> Historically about <strong>{ppv} in 100</strong> patients flagged at this
              setting go on to have a positive diagnosis, so this is an indication for
              confirmatory testing, not a diagnosis.</>
            )}
            {!isHigh && op.expected_recall != null && (
              <> This setting catches roughly {Math.round(op.expected_recall * 100)}% of true
              cases, so a negative result does not rule diabetes out.</>
            )}
          </p>
        </div>
      </div>

      <div className="results-split">
        <div className="card risk-card">
          <div className="section-title">Calibrated Risk</div>
          <RiskGauge percent={visit.risk_percent} />
          <div style={{ marginTop: '0.6rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            Calibrated to observed prevalence.
            {visit.risk_raw_uncalibrated != null && (
              <> Uncalibrated model output was {(visit.risk_raw_uncalibrated * 100).toFixed(1)}%.</>
            )}
          </div>
          <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Assessed: {new Date(visit.visited_at).toLocaleString()}
          </div>
        </div>

        <div className="card">
          <div className="section-title">Clinical Inputs</div>
          <div className="inputs-grid">
            {Object.entries(inputs).filter(([k]) => INPUT_LABELS[k]).map(([k, v]) => (
              <div key={k} className="input-row">
                <span className="muted">{INPUT_LABELS[k]}</span>
                <span style={{ fontWeight: 600 }}>
                  {YES_NO.includes(k) ? (Number(v) === 1 ? 'Yes' : 'No')
                    : k === 'gender' ? (Number(v) === 1 ? 'Male' : 'Female')
                    : v}
                </span>
              </div>
            ))}
          </div>
          {visit.model_features?.bmi != null && (
            <div style={{ marginTop: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Derived BMI {Number(visit.model_features.bmi).toFixed(1)} — computed from weight and
              height, never entered separately.
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="section-title">The Why: Key Risk Factors</div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', marginBottom: '1rem' }}>
          Exact Shapley values showing which factors drove this particular prediction.
          {visit.shap_ranking?.length > 0 && (
            <> Most influential actionable variable: <strong>{visit.shap_ranking[0]}</strong>.</>
          )}
        </p>
        <ShapChart shapValues={visit.shap_values} />
      </div>

      <div className="card">
        <div className="section-title">
          {isHigh ? 'Next Steps: Actionable Targets' : 'Next Steps'}
        </div>

        {isHigh && (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', marginBottom: '0.8rem' }}>
              Each plan is a set of changes that would move this patient below the flagging
              threshold. All targets stay within safe clinical ranges and may only move a
              variable in the direction that reduces clinical risk.
            </p>

            <div className="toggle-group" style={{ marginBottom: '1rem', flexWrap: 'wrap' }}>
              <button type="button"
                className={`toggle-btn${strategy === 'shap_guided' ? ' active' : ''}`}
                onClick={() => setStrategy('shap_guided')}>
                SHAP-guided ({guided.length})
              </button>
              <button type="button"
                className={`toggle-btn${strategy === 'standard' ? ' active' : ''}`}
                onClick={() => setStrategy('standard')}>
                Unconstrained ({uncon.length})
              </button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
              {strategy === 'shap_guided'
                ? 'Search restricted to this patient’s three highest-impact variables — shorter, better-targeted plans.'
                : 'Search free across all five actionable variables — the comparison baseline.'}
            </p>
          </>
        )}

        <CFCards counterfactuals={shown} originalInputs={inputs}
          riskLabel={visit.risk_label} threshold={op.threshold} />
      </div>

      {visit.disclaimer && (
        <div className="card" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <strong>Note.</strong> {visit.disclaimer}
        </div>
      )}

      {showCompare && (
        <CompareModal current={visit} previous={previous_visit}
          patientName={patient.name} onClose={() => setShowCompare(false)} />
      )}
    </div>
  );
}
