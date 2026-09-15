"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";

// next/link does not scroll when the hash already matches the URL, so on the home
// page a section link would do nothing the second time it is clicked. Scroll
// directly there, and move focus to the section so keyboard users land on it.
export function scrollToHash(href: string): boolean {
  const id = href.split("#")[1];
  const el = id ? document.getElementById(id) : null;
  if (!el) return false;
  el.scrollIntoView();
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
  if (location.hash !== `#${id}`) history.pushState(null, "", `#${id}`);
  return true;
}

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

export default function SectionLink({ href, onClick, ...rest }: Props) {
  const pathname = usePathname();
  return (
    <Link
      {...rest}
      href={href}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (e.defaultPrevented || pathname !== "/" || !href.startsWith("/#")) return;
        if (scrollToHash(href)) e.preventDefault();
      }}
    />
  );
}
