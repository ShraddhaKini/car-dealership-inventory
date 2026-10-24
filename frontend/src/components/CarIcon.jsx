export default function CarIcon({ className = 'h-6 w-6' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 16v2a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-2" />
      <path d="M3 12l2-5a2 2 0 011.9-1.3h10.2A2 2 0 0119 7l2 5v4H3z" />
      <circle cx="7.5" cy="13.5" r="0.75" />
      <circle cx="16.5" cy="13.5" r="0.75" />
    </svg>
  );
}
