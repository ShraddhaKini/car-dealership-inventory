import { useAuth } from './context/AuthContext.jsx';
import AuthPage from './components/AuthPage.jsx';
import Navbar from './components/Navbar.jsx';
import Dashboard from './components/Dashboard.jsx';

export default function App() {
  const { user } = useAuth();

  if (!user) return <AuthPage />;

  return (
    <div className="min-h-screen">
      <Navbar />
      <Dashboard />
    </div>
  );
}
