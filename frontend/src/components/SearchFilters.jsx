import { CATEGORIES } from '../constants.js';

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';

export default function SearchFilters({ filters, onChange, onClear }) {
  const handleChange = (event) => {
    onChange({ ...filters, [event.target.name]: event.target.value });
  };

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <input name="make" value={filters.make} onChange={handleChange} placeholder="Make" aria-label="Make" className={inputClass} />
        <input name="model" value={filters.model} onChange={handleChange} placeholder="Model" aria-label="Model" className={inputClass} />
        <select name="category" value={filters.category} onChange={handleChange} aria-label="Category" className={inputClass}>
          <option value="">All categories</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <input name="minPrice" type="number" min="0" value={filters.minPrice} onChange={handleChange} placeholder="Min price" aria-label="Minimum price" className={inputClass} />
        <input name="maxPrice" type="number" min="0" value={filters.maxPrice} onChange={handleChange} placeholder="Max price" aria-label="Maximum price" className={inputClass} />
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Clear filters
        </button>
      </div>
    </section>
  );
}
