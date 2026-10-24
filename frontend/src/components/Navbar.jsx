import { useAuth } from '../context/AuthContext.jsx';
import CarIcon from './CarIcon.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 bg-slate-900 text-white shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
            <CarIcon className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">AutoHub</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-300 sm:inline">{user.email}</span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
              user.role === 'admin' ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-slate-200'
            }`}
          >
            {user.role}
          </span>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm transition hover:bg-slate-800"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
