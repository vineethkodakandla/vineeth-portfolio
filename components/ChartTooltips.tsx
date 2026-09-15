"use client";
import { useEffect, useRef } from "react";

// One tooltip for every chart on the page. Chart rows carry data-tip-title and
// data-tip (newline-separated lines); this listens for pointer and focus events
// and renders those strings with textContent, never as HTML.
//
// WCAG 1.4.13: the tooltip can be dismissed with Escape without moving focus,
// stays attached to a keyboard-focused row while the page scrolls, and does not
// stay pinned after a mouse click once the pointer leaves the row. Its text
// repeats the row's accessible name, so it is hidden from assistive technology.
export default function ChartTooltips() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tip = ref.current;
    if (!tip) return;
    let active: HTMLElement | null = null;
    let viaKeyboard = false;
    let dismissed: HTMLElement | null = null;

    const render = (el: HTMLElement) => {
      tip.replaceChildren();
      const title = document.createElement("strong");
      title.textContent = el.dataset.tipTitle ?? "";
      tip.appendChild(title);
      for (const line of (el.dataset.tip ?? "").split("\n")) {
        if (!line) continue;
        const row = document.createElement("div");
        row.textContent = line;
        tip.appendChild(row);
      }
      tip.hidden = false;
    };

    const place = (x: number, y: number) => {
      const box = tip.getBoundingClientRect();
      const pad = 14;
      let left = x + pad;
      let top = y + pad;
      if (left + box.width > window.innerWidth - 8) left = x - box.width - pad;
      if (top + box.height > window.innerHeight - 8) top = y - box.height - pad;
      tip.style.left = `${Math.max(8, left)}px`;
      tip.style.top = `${Math.max(8, top)}px`;
    };

    const placeAtRow = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      place(r.left + r.width / 2, r.bottom);
    };

    const hide = () => {
      active = null;
      viaKeyboard = false;
      tip.hidden = true;
    };

    const target = (t: EventTarget | null) =>
      t instanceof Element ? (t.closest("[data-tip-title]") as HTMLElement | null) : null;

    const onMove = (e: PointerEvent) => {
      const el = target(e.target);
      if (!el) {
        dismissed = null;
        if (active && !viaKeyboard) hide();
        return;
      }
      if (el === dismissed) return;
      if (el !== active || viaKeyboard) {
        active = el;
        viaKeyboard = false;
        render(el);
      }
      place(e.clientX, e.clientY);
    };

    const onFocus = (e: FocusEvent) => {
      const el = target(e.target);
      if (!el || !el.matches(":focus-visible")) return;
      dismissed = null;
      active = el;
      viaKeyboard = true;
      render(el);
      placeAtRow(el);
    };

    const onBlur = () => {
      if (viaKeyboard) hide();
    };

    const onScroll = () => {
      if (!active) return;
      if (viaKeyboard && document.activeElement === active) {
        const r = active.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) {
          tip.hidden = false;
          placeAtRow(active);
        } else {
          tip.hidden = true;
        }
        return;
      }
      hide();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !tip.hidden) {
        dismissed = active;
        hide();
      }
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onBlur);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onBlur);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return <div ref={ref} className="chart-tooltip" aria-hidden="true" hidden />;
}
