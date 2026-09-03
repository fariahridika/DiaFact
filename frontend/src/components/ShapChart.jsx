import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const LABELS = {
  age: 'Age', gender: 'Gender', pulse_rate: 'Pulse Rate',
  systolic_bp: 'Systolic BP', diastolic_bp: 'Diastolic BP',
  glucose: 'Glucose', weight: 'Weight', bmi: 'BMI',
  hypertensive: 'Hypertensive', bp_ratio: 'BP Ratio',
  pulse_pressure: 'Pulse Pressure', bmi_age: 'BMI×Age',
  glucose_bmi: 'Glucose×BMI', cardio_risk: 'Cardio Risk',
  family_hypertension: 'Family HTN', family_risk: 'Family Risk',
};

export default function ShapChart({ shapValues }) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px)');
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const data = Object.entries(shapValues)
    .map(([k, v]) => ({ feature: LABELS[k] || k, value: v, abs: Math.abs(v) }))
    .sort((a, b) => b.abs - a.abs)
    .slice(0, 10);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const dir = d.value > 0 ? '⚠️ Increases' : '✅ Decreases';
    const color = d.value > 0 ? 'var(--danger)' : 'var(--success)';

    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        padding: '0.8rem 1rem', borderRadius: '8px', fontSize: '0.85rem',
        boxShadow: 'var(--shadow)', maxWidth: '70vw',
      }}>
        <div style={{ fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text)' }}>
          Factor: {d.feature}
        </div>
        <div style={{ color, fontWeight: 600 }}>{dir} risk</div>
      </div>
    );
  };

  return (
    <div className="shap-wrap">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical"
          margin={{ left: narrow ? 0 : 8, right: narrow ? 8 : 24, top: 4, bottom: 4 }}>
          <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: narrow ? 10 : 12 }} />
          <YAxis type="category" dataKey="feature" width={narrow ? 78 : 130}
            tick={{ fill: 'var(--text)', fontSize: narrow ? 11 : 13, fontWeight: 500 }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--surface2)' }} />
          <ReferenceLine x={0} stroke="var(--border)" strokeWidth={2} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={narrow ? 14 : 18}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.value > 0 ? 'var(--danger)' : 'var(--success)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
