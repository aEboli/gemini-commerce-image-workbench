"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { APP_NAME } from "@/lib/constants";
import { t } from "@/lib/i18n";
import type { UiLanguage } from "@/lib/types";

import { LanguageToggle } from "@/components/language-toggle";

export function Navigation({ language }: { language: UiLanguage }) {
  const pathname = usePathname();
  const links = [
    { href: "/", label: t(language, "navOverview") },
    { href: "/create", label: t(language, "navCreate") },
    { href: "/history", label: t(language, "navHistory") },
    { href: "/templates", label: t(language, "navTemplates") },
    { href: "/settings", label: t(language, "navSettings") },
  ];

  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">{APP_NAME}</p>
        <h1>{APP_NAME}</h1>
      </div>
      <nav className="app-nav">
        {links.map((link) => (
          <Link key={link.href} className={pathname === link.href ? "is-active" : undefined} href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
      <LanguageToggle language={language} />
    </header>
  );
}
