export default function FormSection({ title, children, bodyClassName = "" }) {
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-sm shadow-slate-900/5 sm:p-6">
      <h2 className="mb-4 border-b border-slate-100 pb-3 text-end text-base font-bold text-slate-900">{title}</h2>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
