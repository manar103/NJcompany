// Original hero illustration: contributors (shown as writing scripts) connect through
// VERALINK to different kinds of AI data work. Pure SVG, decorative.
import { t } from '../i18n';
const PEOPLE = [
  { x: 70, y: 92, glyph: 'Aa' },
  { x: 44, y: 196, glyph: 'ع' },
  { x: 62, y: 300, glyph: '文' },
  { x: 118, y: 384, glyph: 'अ' },
];
const HUB = { x: 262, y: 236 };
const TASKS = [
  { x: 380, y: 92, kind: 'audio', label: 'Voice' },
  { x: 404, y: 210, kind: 'text', label: 'Translate' },
  { x: 380, y: 328, kind: 'box', label: 'Annotate' },
];

// Theme-aware fills (CSS variables only work through `style` in SVG).
const SURFACE = { fill: 'var(--surface)', stroke: 'var(--border)' };

const curve = (a, b) => {
  const mx = (a.x + b.x) / 2;
  return `M${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`;
};

function TaskGlyph({ kind, x, y }) {
  if (kind === 'audio')
    return (
      <g stroke="#415A77" strokeWidth="3" strokeLinecap="round">
        {[6, 14, 22, 10, 18, 8, 16].map((h, i) => (
          <line key={i} x1={x + 16 + i * 9} y1={y + 30 - h / 2} x2={x + 16 + i * 9} y2={y + 30 + h / 2} />
        ))}
      </g>
    );
  if (kind === 'text')
    return (
      <g style={{ fill: 'var(--border)' }}>
        <rect x={x + 14} y={y + 20} width="58" height="5" rx="2.5" fill="#778DA9" />
        <rect x={x + 14} y={y + 31} width="80" height="5" rx="2.5" />
        <rect x={x + 14} y={y + 42} width="44" height="5" rx="2.5" />
      </g>
    );
  return (
    <g>
      <rect x={x + 14} y={y + 16} width="84" height="34" rx="4" style={{ fill: 'var(--bg-subtle)' }} />
      <rect x={x + 30} y={y + 22} width="34" height="22" rx="2" fill="none" stroke="#DDBEA9" strokeWidth="2.5" strokeDasharray="4 3" />
    </g>
  );
}

export default function HeroVisual() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <svg viewBox="0 0 520 470" role="presentation" direction="ltr">
        <defs>
          <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" style={{ fill: 'var(--border-strong)' }} />
          </pattern>
          <filter id="soft" x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#1B263B" floodOpacity="0.10" />
          </filter>
        </defs>
        <rect x="10" y="20" width="500" height="430" rx="28" fill="url(#dots)" opacity="0.55" />
        <circle cx={HUB.x} cy={HUB.y} r="118" fill="none" style={{ stroke: 'var(--border)' }} strokeWidth="1.5" />
        <circle cx={HUB.x} cy={HUB.y} r="72" fill="none" style={{ stroke: 'var(--border)' }} strokeWidth="1.5" strokeDasharray="3 6" />

        {PEOPLE.map((p, i) => (
          <path key={'pl' + i} d={curve(p, HUB)} fill="none" stroke="#778DA9" strokeWidth="1.6" className="flow" style={{ animationDelay: `${i * 0.4}s` }} />
        ))}
        {TASKS.map((task, i) => (
          <path key={'tl' + i} d={curve(HUB, { x: task.x, y: task.y + 33 })} fill="none" stroke="#415A77" strokeWidth="1.6" className="flow" style={{ animationDelay: `${0.2 + i * 0.4}s` }} />
        ))}

        {PEOPLE.map((p) => (
          <g key={p.glyph} filter="url(#soft)">
            <circle cx={p.x} cy={p.y} r="27" style={SURFACE} />
            <text x={p.x} y={p.y + 7} textAnchor="middle" fontSize="19" fontWeight="600" style={{ fill: 'var(--heading)' }} fontFamily="Inter, 'Noto Sans', system-ui, sans-serif">
              {p.glyph}
            </text>
          </g>
        ))}

        <g filter="url(#soft)">
          <rect x={HUB.x - 42} y={HUB.y - 42} width="84" height="84" rx="22" fill="#1B263B" />
          <g transform={`translate(${HUB.x - 26} ${HUB.y - 26}) scale(1.625)`}>
            <path d="M8.5 9.5 16 23" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M23.5 9.5 16 23" stroke="#778DA9" strokeWidth="3.2" strokeLinecap="round" />
            <circle cx="8.5" cy="9.5" r="2.6" fill="#1B263B" stroke="#FFFFFF" strokeWidth="1.8" />
            <circle cx="23.5" cy="9.5" r="2.6" fill="#1B263B" stroke="#778DA9" strokeWidth="1.8" />
            <circle cx="16" cy="23" r="3" fill="#DDBEA9" />
          </g>
        </g>

        {TASKS.map((task) => {
          const label = t(task.label);
          return (
            <g key={task.kind} filter="url(#soft)">
              <rect x={task.x} y={task.y} width="112" height="66" rx="12" style={SURFACE} />
              <TaskGlyph kind={task.kind} x={task.x} y={task.y} />
              <rect x={task.x + 10} y={task.y + 72} width={label.length * 7 + 20} height="22" rx="11" fill="#F6ECE5" />
              <text x={task.x + 20} y={task.y + 87} fontSize="11" fontWeight="600" fill="#7A4E33" fontFamily="var(--font)">
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
