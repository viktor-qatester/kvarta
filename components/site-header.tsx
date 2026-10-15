"use client";

import { useEffect, useId, useRef, useState } from "react";

const navLinks = [
  { href: "#assortiment", label: "Кофе" },
  { href: "#podpiska", label: "Подписка" },
  { href: "#dostavka", label: "Доставка" },
  { href: "#istoriya", label: "История" },
  { href: "#zayavka", label: "Заявка" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-cream/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <a href="#top" className="font-serif text-xl font-semibold tracking-tight">
          Кварта
        </a>
        <nav className="hidden md:block" aria-label="Разделы страницы">
          <ul className="flex items-center gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-ink-muted hover:text-ink"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <button
          ref={buttonRef}
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-line bg-cream-soft px-3 text-sm font-medium md:hidden"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? "Закрыть" : "Меню"}
        </button>
      </div>
      {open ? (
        <div
          id={menuId}
          className="border-t border-line bg-cream px-5 py-3 md:hidden"
        >
          <nav aria-label="Мобильное меню">
            <ul className="flex flex-col">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="flex min-h-11 items-center py-2 text-base font-medium"
                    onClick={closeMenu}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
