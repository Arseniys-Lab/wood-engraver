// Arseniy's Lab header: logo + app name opens the lab menu (other apps, blog,
// YouTube). Styles come from vendor/lab/lab.css (.lab-*), not Tailwind.

// On arseniy-lab.com links are site-relative; on GitHub Pages they point to the site.
const LAB_URL = /(^|\.)arseniy-lab\.com$/.test(location.hostname) || location.port === '8803'
  ? ''
  : 'https://arseniy-lab.com';

const LabMark = () => (
  <svg className="lab-mark" viewBox="0 0 32 32" aria-hidden="true">
    <rect width="32" height="32" rx="8" style={{ fill: 'var(--lab-mark-bg)' }} />
    {[9, 16, 23].flatMap((cy, r) => [9, 16, 23].map((cx, c) => (
      <circle key={`${r}${c}`} cx={cx} cy={cy} r="2.6"
        style={{ fill: (r * 3 + c) % 2 ? 'var(--lab-mark-hot)' : 'var(--lab-mark-dot)' }} />
    )))}
  </svg>
);

window.LabHeader = ({ appName, version, children }) => (
  <header className="lab-header">
    <details className="lab-nav">
      <summary className="lab-brand">
        <LabMark />
        <span className="lab-brand-text">
          <span className="lab-brand-lab">Arseniy's Lab</span>
          <span className="lab-brand-app">{appName}</span>
        </span>
        <svg className="lab-brand-chevron" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <nav className="lab-nav-panel">
        <a href={`${LAB_URL}/`}>← Arseniy's Lab<small>Home</small></a>
        <div className="lab-nav-label">Tools</div>
        <a href={`${LAB_URL}/apps/musicbox/`}>Music Box Strip<small>MIDI → punched strip STL</small></a>
        <a href={`${LAB_URL}/apps/wood-engraver/`} aria-current="page">Wood Engraver<small>Image → G-code for a hot nozzle</small></a>
        <hr />
        <a href={`${LAB_URL}/projects/wood-engraver/`}>About this tool<small>How it works, video, quick start</small></a>
        <a href="https://github.com/Arseniys-Lab/wood-engraver" target="_blank" rel="noopener noreferrer">Source on GitHub ↗</a>
        <div className="lab-nav-row">
          <a href={`${LAB_URL}/blog/`}>Blog</a>
          <a href="https://www.youtube.com/@ArseniyLab" target="_blank" rel="noopener noreferrer">YouTube ↗</a>
        </div>
      </nav>
    </details>
    {version && <span className="lab-chip">v{version}</span>}
    <div className="lab-header-actions">{children}</div>
  </header>
);
