/**
 * Classe globale `.vibra-select` (styles de base dans `src/app/globals.css`).
 * Ne pas ajouter de `bg-white/*` sur les `<select>` : cela casserait le contraste des options.
 */
export const selectForm =
  "vibra-select w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none cursor-pointer transition-colors";

export const selectFormDense =
  "vibra-select w-full rounded-lg px-3 py-2 text-sm text-white outline-none cursor-pointer transition-colors";

export const selectFormLanding =
  "vibra-select w-full rounded-xl px-4 py-3 text-sm text-white outline-none cursor-pointer transition-colors";

/** Selects Hero (52–56px) — fond sombre, focus lisible, options `.vibra-select` inchangées */
export const selectHeroInline =
  "vibra-select box-border h-14 min-h-[52px] max-h-14 w-full cursor-pointer rounded-lg border border-white/12 bg-[#070d1a]/92 px-3 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none backdrop-blur-sm transition focus:border-cyan-400/45 focus:ring-1 focus:ring-cyan-400/20";

export const selectFilter =
  "vibra-select w-full rounded-xl px-3 py-2 text-sm text-white outline-none cursor-pointer transition-colors";

export const selectAdminCompact =
  "vibra-select rounded-lg px-2 py-1 text-sm text-white outline-none cursor-pointer transition-colors";

export const selectCeoRole =
  "vibra-select max-w-[140px] rounded-lg px-2 py-1 text-[10px] font-semibold text-white outline-none cursor-pointer transition-colors sm:text-xs";
