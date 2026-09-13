import { useLang } from "../lib/i18n";

/**
 * "PDF" = wydruk przegladarki tej samej strony (window.print()) - bez
 * dodatkowej biblioteki. `mode="combined"` dodatkowo ustawia atrybut na
 * <body>, ktory w CSS (patrz .print-only-economics w index.css) odslania w
 * wydruku sekcje ekonomiczna, normalnie ukryta - dzieki temu jeden przycisk
 * na stronie jednostki moze wygenerowac PDF zawierajacy zarowno raport
 * techniczny, jak i ekonomiczny naraz, bez przechodzenia na osobna strone.
 */
export function PrintButton({ mode = "technical", label }: { mode?: "technical" | "combined"; label?: string }) {
  const { t } = useLang();

  function handlePrint() {
    document.body.dataset.printMode = mode;
    window.print();
  }

  return (
    <button
      onClick={handlePrint}
      className="no-print text-sm font-medium rounded-md px-3 py-1.5 flex items-center gap-1.5"
      style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}
      title={t.common.printHint}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" />
      </svg>
      {label ?? t.common.printReport}
    </button>
  );
}
