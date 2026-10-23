// Ícones desenhados à mão em SVG — sem biblioteca, sem emoji, sem imagem externa
import * as React from "react";

type P = { className?: string; size?: number };

function wrap(svg: React.ReactNode, cn?: string, size = 20) {
  return <span className={cn} style={{ width: size, height: size, display: "inline-flex" }}>{svg}</span>;
}

export function IconSearch({ className, size = 18 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M15.5 15.5 L20 20" />
      <path d="M8.5 10.2c.6-.4 1.8-.6 2.8 0" opacity={0.45} />
    </svg>
  );
}
export function IconPlus({ className, size = 18 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" className={className}>
      <path d="M12 7v10M7 12h10" />
    </svg>
  );
}
export function IconCart({ className, size = 18 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 7h13l-1.2 7H7.2z" />
      <path d="M6 7L5 3H3" />
      <circle cx="9" cy="19.5" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="17" cy="19.5" r="1.6" fill="currentColor" stroke="none" />
      <path d="M9 11h6" opacity={0.5} />
    </svg>
  );
}
export function IconMoney({ className, size = 18 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="7" width="18" height="10" rx="1.8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 10.4v3.2M10.6 12h2.8" />
      <circle cx="6.6" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="17.4" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
export function IconClock({ className, size = 18 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 8.5V12l2.8 1.7" />
      <path d="M9 4.2l1 .9M15 4.2l-1 .9" opacity={0.5} />
    </svg>
  );
}
export function IconAlert({ className, size = 18 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3.5l8 14.2a1.4 1.4 0 0 1-1.2 2.1H5.2a1.4 1.4 0 0 1-1.2-2.1z" />
      <path d="M12 9v5" />
      <circle cx="12" cy="16.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
export function IconUser({ className, size = 18 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="8.2" r="3.3" />
      <path d="M5.5 19.2a6.5 4.2 0 0 1 13 0" />
      <path d="M10.2 7.2c.6-.3 1.2-.5 1.8 0" opacity={0.4} />
    </svg>
  );
}
export function IconPhone({ className, size = 16 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6.2 4.2h3l1.6 4.2-2.2 1.6a14 14 0 0 0 5 5l1.6-2.2 4.2 1.6v3a1.6 1.6 0 0 1-1.6 1.6A14.8 14.8 0 0 1 4.6 5.8 1.6 1.6 0 0 1 6.2 4.2z" />
    </svg>
  );
}
export function IconLink({ className, size = 16 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9.8 14.2a3.2 3.2 0 0 0 4.5 0l1.9-1.9a3.2 3.2 0 0 0-4.5-4.5l-.7.7" />
      <path d="M14.2 9.8a3.2 3.2 0 0 0-4.5 0l-1.9 1.9a3.2 3.2 0 0 0 4.5 4.5l.7-.7" />
    </svg>
  );
}
export function IconArrowLeft({ className, size = 18 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.5 6L8 12l6.5 6" />
      <path d="M8.5 12H19" />
    </svg>
  );
}
export function IconCheck({ className, size = 16 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 12.5l4 4 8-9" />
    </svg>
  );
}
export function IconBook({ className, size = 18 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 4.5h8a2 2 0 0 1 2 2v12H7.5a1.5 1.5 0 0 0-1.5 1.5V4.5z" />
      <path d="M6 4.5A1.5 1.5 0 0 0 4.5 6v13.5A1.5 1.5 0 0 0 6 21h10" />
      <path d="M8 9h6M8 12h6M8 15h4" />
      <path d="M4.5 6c0-.8.4-1 1-1" opacity={0.4} />
    </svg>
  );
}
export function IconPencil({ className, size = 16 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.2 4.2l5.6 5.6-9.4 9.4H4.8v-5.6z" />
      <path d="M13 5.5l5.6 5.6" />
      <path d="M4.8 19.4l5.6-1" opacity={0.4} />
    </svg>
  );
}
export function IconWhats({ className, size = 16 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3.2a7.8 7.8 0 0 0-6.7 11.8L4 20l5.2-1.3A7.8 7.8 0 1 0 12 3.2z" />
      <path d="M8.8 9.5c.2-.5.4-.5.7-.5h.6l.4 1.2-.6.6c-.2.2-.1.5.1.7  .6.7 1.4 1.3 2.1 1.7.3.1.5 0 .6-.1l.6-.7 1.2.4v.6c0 .3 0 .5-.5.7-.3.1-1.2.2-2.3-.3a7 7 0 0 1-2.5-1.9c-.5-.6-.9-1.3-1-1.8-.1-.4 0-.6.2-.8l.4-.5z" />
    </svg>
  );
}
export function IconTrash({ className, size = 16 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 7h16" />
      <path d="M9 7V5.2h6V7" />
      <path d="M7 7l.6 11h8.8L17 7" />
      <path d="M10 11v5M14 11v5" opacity={0.6} />
    </svg>
  );
}
export function HeroIlustracao({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 120" className={className} fill="none" aria-hidden>
      <rect x="18" y="14" width="92" height="92" rx="6" fill="#fffef2" stroke="#1e3a5f" strokeWidth="1.8" />
      <path d="M28 26h72M28 40h72M28 54h52M28 68h62M28 82h46" stroke="#3b6ea5" strokeWidth="1.4" strokeLinecap="round" opacity={0.9} />
      <path d="M18 22h92" stroke="#f2a6a6" strokeWidth="1.2" />
      <circle cx="28" cy="92" r="2" fill="#1e3a5f" />
      <circle cx="36" cy="92" r="2" fill="#1e3a5f" />
      <path d="M126 18l32 8 28-6 6 56-38 10-28-74z" fill="#d9b48a" stroke="#1e3a5f" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M135 32l26 6M138 48l24 5M140 64l22 4" stroke="#1e3a5f" strokeWidth="1.3" strokeLinecap="round" opacity={0.7} />
      <path d="M168 14c6-4 12 2 10 8" stroke="#1e3a5f" strokeWidth="1.6" strokeLinecap="round" />
      {/* caneta */}
      <g transform="rotate(-28 150 86)">
        <rect x="112" y="82" width="76" height="10" rx="5" fill="#1e3a5f" />
        <rect x="112" y="84" width="46" height="6" rx="3" fill="#3b6ea5" />
        <path d="M188 87l10-2-10-2z" fill="#c7d7f0" stroke="#1e3a5f" strokeWidth="1.2" />
      </g>
    </svg>
  );
}
