import CarIcon from './CarIcon.jsx';

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export default function VehicleCard({ vehicle, isAdmin, purchasing, onPurchase, onEdit, onDelete }) {
  const outOfStock = vehicle.quantity === 0;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-indigo-500 via-indigo-600 to-slate-800 text-white/90">
        <CarIcon className="h-16 w-16" />
        <span className="absolute left-3 top-3 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold backdrop-blur">
          {vehicle.category}
        </span>
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            outOfStock ? 'bg-red-500 text-white' : 'bg-emerald-400 text-emerald-950'
          }`}
        >
          {outOfStock ? 'Out of stock' : `${vehicle.quantity} in stock`}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{vehicle.make}</p>
        <h3 className="text-lg font-bold">{vehicle.model}</h3>
        <p className="mt-2 text-2xl font-extrabold text-indigo-700">{priceFormatter.format(vehicle.price)}</p>

        <div className="mt-4 flex flex-1 flex-col justify-end gap-2">
          <button
            type="button"
            onClick={() => onPurchase(vehicle)}
            disabled={outOfStock || purchasing}
            className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
          >
            {purchasing ? 'Processing...' : outOfStock ? 'Unavailable' : 'Purchase'}
          </button>

          {isAdmin && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onEdit(vehicle)}
                className="rounded-lg border border-slate-300 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(vehicle)}
                className="rounded-lg border border-red-200 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
