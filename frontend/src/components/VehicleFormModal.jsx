import { useState } from 'react';
import { api } from '../api.js';
import { CATEGORIES } from '../constants.js';
import { useAuth } from '../context/AuthContext.jsx';

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';

/** Add form when `vehicle` is null, edit form otherwise. */
export default function VehicleFormModal({ vehicle, onClose, onSaved }) {
  const { token } = useAuth();
  const isEditing = vehicle !== null;

  const [form, setForm] = useState({
    make: vehicle?.make ?? '',
    model: vehicle?.model ?? '',
    category: vehicle?.category ?? CATEGORIES[0],
    price: vehicle?.price ?? '',
    quantity: vehicle?.quantity ?? '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categoryOptions = CATEGORIES.includes(form.category) ? CATEGORIES : [form.category, ...CATEGORIES];

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    const payload = {
      make: form.make,
      model: form.model,
      category: form.category,
      price: Number(form.price),
      quantity: Number(form.quantity),
    };

    try {
      if (isEditing) await api.updateVehicle(vehicle.id, payload, token);
      else await api.createVehicle(payload, token);
      onSaved(isEditing ? 'Vehicle updated' : 'Vehicle added');
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/60 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
        aria-label={isEditing ? 'Edit vehicle' : 'Add vehicle'}
      >
        <h2 className="text-xl font-bold">{isEditing ? 'Edit vehicle' : 'Add a vehicle'}</h2>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-medium text-slate-700">
            Make
            <input name="make" required value={form.make} onChange={handleChange} className={`${inputClass} mt-1`} />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Model
            <input name="model" required value={form.model} onChange={handleChange} className={`${inputClass} mt-1`} />
          </label>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Category
          <select name="category" value={form.category} onChange={handleChange} className={`${inputClass} mt-1`}>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-medium text-slate-700">
            Price (USD)
            <input name="price" type="number" min="0" step="0.01" required value={form.price} onChange={handleChange} className={`${inputClass} mt-1`} />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Quantity
            <input name="quantity" type="number" min="0" step="1" required value={form.quantity} onChange={handleChange} className={`${inputClass} mt-1`} />
          </label>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Saving...' : isEditing ? 'Save changes' : 'Add vehicle'}
          </button>
        </div>
      </form>
    </div>
  );
}
