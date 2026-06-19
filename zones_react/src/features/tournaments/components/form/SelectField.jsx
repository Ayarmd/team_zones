export default function SelectField({ id, label, required, value, onChange, options }) {
  return (
    <div className="grid gap-1.5 text-end">
      <label htmlFor={id} className="text-sm font-semibold text-slate-800">
        {label}
        {required ? <span className="ms-0.5 text-violet-600">*</span> : null}
      </label>
      <select
        id={id}
        required={required}
        value={value}
        onChange={onChange}
        className="w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-slate-50/80 bg-[length:1rem] bg-[position:left_0.75rem_center] bg-no-repeat py-2.5 ps-9 pe-3 text-end text-sm text-slate-900 outline-none ring-violet-500/25 transition focus:border-violet-400 focus:bg-white focus:ring-2"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
