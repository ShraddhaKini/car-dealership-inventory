import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import SearchFilters from './SearchFilters.jsx';
import VehicleCard from './VehicleCard.jsx';
import VehicleFormModal from './VehicleFormModal.jsx';

const EMPTY_FILTERS = { make: '', model: '', category: '', minPrice: '', maxPrice: '' };
const SEARCH_DEBOUNCE_MS = 300;

export default function Dashboard() {
  const { token, user, logout } = useAuth();
  const isAdmin = user.role === 'admin';

  const [vehicles, setVehicles] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [purchasingId, setPurchasingId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  // undefined = modal closed, null = adding a new vehicle, object = editing that vehicle
  const [formVehicle, setFormVehicle] = useState(undefined);

  const handleError = (err) => {
    if (err.status === 401) logout();
    else setError(err.message);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const result = await api.searchVehicles(filters, token);
        if (!cancelled) {
          setVehicles(result);
          setError('');
        }
      } catch (err) {
        if (!cancelled) handleError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, token, reloadKey]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const handlePurchase = async (vehicle) => {
    setPurchasingId(vehicle.id);
    setError('');
    try {
      const updated = await api.purchaseVehicle(vehicle.id, token);
      setVehicles((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setNotice(`You purchased a ${updated.make} ${updated.model}`);
    } catch (err) {
      handleError(err);
      setReloadKey((key) => key + 1);
    } finally {
      setPurchasingId(null);
    }
  };

  const handleDelete = async (vehicle) => {
    if (!window.confirm(`Delete ${vehicle.make} ${vehicle.model}? This cannot be undone.`)) return;
    try {
      await api.deleteVehicle(vehicle.id, token);
      setNotice('Vehicle deleted');
      setReloadKey((key) => key + 1);
    } catch (err) {
      handleError(err);
    }
  };

  const handleSaved = (message) => {
    setFormVehicle(undefined);
    setNotice(message);
    setReloadKey((key) => key + 1);
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Available vehicles</h1>
          <p className="mt-1 text-slate-500">Browse the current inventory and purchase a vehicle.</p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setFormVehicle(null)}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-indigo-700"
          >
            + Add vehicle
          </button>
        )}
      </div>

      <SearchFilters filters={filters} onChange={setFilters} onClear={() => setFilters(EMPTY_FILTERS)} />

      {notice && (
        <p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
          {error}
        </p>
      )}

      {loading && vehicles.length === 0 ? (
        <p className="py-16 text-center text-slate-500">Loading vehicles...</p>
      ) : vehicles.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 py-16 text-center text-slate-500">
          No vehicles found.
        </div>
      ) : (
        <div className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${loading ? 'opacity-60' : ''}`}>
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              isAdmin={isAdmin}
              purchasing={purchasingId === vehicle.id}
              onPurchase={handlePurchase}
              onEdit={setFormVehicle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {formVehicle !== undefined && (
        <VehicleFormModal vehicle={formVehicle} onClose={() => setFormVehicle(undefined)} onSaved={handleSaved} />
      )}
    </main>
  );
}
