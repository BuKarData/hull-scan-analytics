import { useEffect, useRef, useState } from "react";
import type { ScanPhase, Severity } from "../lib/types";
import { formatDate } from "../lib/format";

export interface TimelineItem {
  id: string;
  timestamp: string;
  label: string;
  phase: ScanPhase;
  severity?: Severity;
}

interface TimelineSliderProps {
  items: TimelineItem[];
  index: number;
  onChange: (index: number) => void;
}

const SEVERITY_VAR: Record<Severity, string> = {
  good: "var(--status-good)",
  warning: "var(--status-warning)",
  serious: "var(--status-serious)",
  critical: "var(--status-critical)",
};

export function TimelineSlider({ items, index, onChange }: TimelineSliderProps) {
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) return;
    timerRef.current = setInterval(() => {
      onChange(index >= items.length - 1 ? 0 : index + 1);
    }, 1400);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, index, items.length]);

  useEffect(() => {
    if (index >= items.length - 1) setPlaying(false);
  }, [index, items.length]);

  if (items.length === 0) return null;
  const current = items[index];

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium"
          style={{ background: "var(--brand)", color: "white" }}
          aria-label={playing ? "Zatrzymaj" : "Odtworz historie"}
          title={playing ? "Zatrzymaj" : "Odtworz historie od tego miejsca"}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <div className="text-sm">
          <span className="font-medium" style={{ color: "var(--text-primary)" }}>
            {formatDate(current.timestamp)}
          </span>
          <span className="mx-1.5" style={{ color: "var(--text-muted)" }}>
            &middot;
          </span>
          <span style={{ color: "var(--text-secondary)" }}>{current.label}</span>
          <span
            className="ml-2 text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5"
            style={{
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            {current.phase === "budowa" ? "Etap budowy" : "Przeglad"}
          </span>
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={items.length - 1}
        step={1}
        value={index}
        onChange={(e) => {
          setPlaying(false);
          onChange(Number(e.target.value));
        }}
        className="w-full"
        style={{ accentColor: "var(--brand)" }}
      />

      <div className="relative h-5 mt-1">
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => {
              setPlaying(false);
              onChange(i);
            }}
            title={`${formatDate(item.timestamp)} - ${item.label}`}
            className="absolute -translate-x-1/2 rounded-full transition-transform"
            style={{
              left: `${items.length <= 1 ? 50 : (i / (items.length - 1)) * 100}%`,
              top: 0,
              width: i === index ? 10 : 7,
              height: i === index ? 10 : 7,
              background: item.severity ? SEVERITY_VAR[item.severity] : item.phase === "budowa" ? "var(--text-muted)" : "var(--brand)",
              opacity: item.phase === "budowa" && !item.severity ? 0.6 : 1,
              boxShadow: i === index ? "0 0 0 3px color-mix(in srgb, var(--brand) 25%, transparent)" : "none",
            }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] mt-3" style={{ color: "var(--text-muted)" }}>
        <span>{formatDate(items[0].timestamp)}</span>
        <span>{formatDate(items[items.length - 1].timestamp)}</span>
      </div>
    </div>
  );
}
