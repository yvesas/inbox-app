"use client";

import { useLayoutEffect, type RefObject } from "react";

/**
 * Faz uma `<textarea>` crescer com o conteúdo: zera a altura e reaplica o `scrollHeight`
 * a cada mudança do valor. O teto fica a cargo do CSS (`max-height` + `overflow`), então
 * o hook cuida só do "encaixar no texto" — nada de estilo aqui (SRP).
 */
export function useAutosizeTextarea(ref: RefObject<HTMLTextAreaElement | null>, value: string) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [ref, value]);
}
