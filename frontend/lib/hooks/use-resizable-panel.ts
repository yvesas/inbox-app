"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type Options = {
  /** Largura mínima (px). */
  min: number;
  /** Largura máxima (px). */
  max: number;
  /** Largura inicial usada no SSR e antes de hidratar o valor salvo. */
  initial: number;
  /** Passo do ajuste por teclado (px). */
  step?: number;
  /** Chave no localStorage para persistir a largura entre sessões. */
  storageKey?: string;
};

type SeparatorProps = {
  role: "separator";
  "aria-orientation": "vertical";
  "aria-valuenow": number;
  "aria-valuemin": number;
  "aria-valuemax": number;
  "aria-label": string;
  tabIndex: 0;
  onPointerDown: (e: React.PointerEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
};

/**
 * Encapsula a lógica de um painel redimensionável por arrasto: estado da largura,
 * limites (clamp), persistência opcional e controle por teclado. Não conhece markup
 * nem estilo — devolve a largura e os `separatorProps` para um handle acessível
 * (`role="separator"`), mantendo a responsabilidade única do hook (SRP).
 */
export function useResizablePanel({ min, max, initial, step = 16, storageKey }: Options): {
  width: number;
  separatorProps: SeparatorProps;
} {
  const [width, setWidth] = useState(initial);

  // Hidrata a largura salva só após montar, evitando divergência de hidratação no SSR.
  useEffect(() => {
    if (!storageKey) return;
    const saved = Number(window.localStorage.getItem(storageKey));
    if (Number.isFinite(saved) && saved > 0) setWidth(clamp(saved, min, max));
  }, [storageKey, min, max]);

  const persist = useCallback(
    (value: number) => {
      if (storageKey) window.localStorage.setItem(storageKey, String(Math.round(value)));
    },
    [storageKey],
  );

  const widthRef = useRef(width);
  widthRef.current = width;

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startW = widthRef.current;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const move = (ev: PointerEvent) => setWidth(clamp(startW + (ev.clientX - startX), min, max));
      const up = () => {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        persist(widthRef.current);
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [min, max, persist],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const delta = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
      if (!delta) return;
      e.preventDefault();
      setWidth((w) => {
        const next = clamp(w + delta, min, max);
        persist(next);
        return next;
      });
    },
    [min, max, step, persist],
  );

  return {
    width,
    separatorProps: {
      role: "separator",
      "aria-orientation": "vertical",
      "aria-valuenow": Math.round(width),
      "aria-valuemin": min,
      "aria-valuemax": max,
      "aria-label": "Redimensionar painel de conversas",
      tabIndex: 0,
      onPointerDown,
      onKeyDown,
    },
  };
}
