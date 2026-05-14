type FilterOption = { value: string; label: string };

export function DashboardFilterBar({
  query,
  queryName = "q",
  queryPlaceholder,
  status,
  statusName = "status",
  options,
  resultsCount,
  action,
  method = "get",
  hiddenFields,
  formClassName,
}: {
  query: string;
  queryName?: string;
  queryPlaceholder: string;
  status: string;
  statusName?: string;
  options: FilterOption[];
  resultsCount: number;
  /** Ex: `/dashboard/ceo` — défaut : page courante */
  action?: string;
  method?: "get" | "post";
  hiddenFields?: Array<{ name: string; value: string }>;
  formClassName?: string;
}) {
  return (
    <form
      action={action}
      method={method}
      className={formClassName ?? "glass mt-5 flex flex-col gap-3 rounded-2xl p-4"}
    >
      {hiddenFields?.map((h) => (
        <input key={h.name} type="hidden" name={h.name} value={h.value} />
      ))}
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
        <input
          name={queryName}
          defaultValue={query}
          placeholder={queryPlaceholder}
          className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm"
        />
        <button className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-black">
          Filtrer
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={[
              "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              status === option.value
                ? "border-cyan-300/40 bg-cyan-500/10 text-cyan-200"
                : "border-white/20 bg-white/5 text-white/75 hover:border-cyan-300/30",
            ].join(" ")}
          >
            <input
              type="radio"
              name={statusName}
              value={option.value}
              defaultChecked={status === option.value}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
      <p className="text-xs text-white/60">{resultsCount} résultat(s)</p>
    </form>
  );
}
