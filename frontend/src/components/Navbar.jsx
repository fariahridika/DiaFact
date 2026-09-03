import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { pathname } = useLocation();
  const nav = [
    { to: '/',        label: 'New Assessment', short: 'Assess' },
    { to: '/history', label: 'Patient History', short: 'History' },
  ];
  return (
    <header className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo" aria-hidden="true">🩺</span>
        <span className="navbar-title">DiaFact</span>
        <span className="navbar-tagline">T2D Risk Assessment</span>
      </div>
      <nav className="navbar-nav">
        {nav.map(n => (
          <Link key={n.to} to={n.to} className={`navbar-link${pathname === n.to ? ' active' : ''}`}>
            <span className="nav-label-full">{n.label}</span>
            <span className="nav-label-short">{n.short}</span>
          </Link>
        ))}
      </nav>
    </header>
  );
}
