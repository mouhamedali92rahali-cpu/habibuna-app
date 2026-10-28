export function Corner({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M2 2h56M2 2v56" strokeWidth="2.4" />
        <path d="M10 10h40M10 10v40" />
        <g transform="translate(34 34)">
          <rect x="-15" y="-15" width="30" height="30" />
          <rect x="-15" y="-15" width="30" height="30" transform="rotate(45)" />
          <circle r="5.5" />
        </g>
        <path d="M34 19v-9M19 34h-9M49 34h9M34 49v9" />
      </g>
    </svg>
  );
}
export function Divider() {
  return (
    <div className="divider" aria-hidden="true">
      <span /><i /><span />
    </div>
  );
}
export function Mihrab() {
  return (
    <svg className="mihrab" viewBox="0 0 120 150" aria-hidden="true">
      <path d="M60 6c6 14 38 26 38 62v76H22V68C22 32 54 20 60 6z" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M60 18c5 11 28 21 28 50v68H32V68c0-29 23-39 28-50z" fill="none" stroke="currentColor" strokeWidth="1" opacity=".6" />
    </svg>
  );
}
