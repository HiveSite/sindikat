import type { UserRole } from "@/types/domain";

export type NavItem = {
  icon: string;
  label: string;
  href: string;
};

export const desktopNavItems: Record<UserRole, NavItem[]> = {
  guest: [
    { icon: "OO", label: "Oglasi", href: "/oglasi" },
    { icon: "GR", label: "Gradovi", href: "/gradovi" },
    { icon: "KA", label: "Kategorije", href: "/kategorije" },
    { icon: "FI", label: "Firme", href: "/firme" },
    { icon: "+", label: "Za firme", href: "/za-firme" }
  ],
  candidate: [
    { icon: "OO", label: "Oglasi", href: "/oglasi" },
    { icon: "PR", label: "Profil", href: "/profil" },
    { icon: "CV", label: "Biografija", href: "/profil/biografija" },
    { icon: "AP", label: "Prijave", href: "/profil/prijave" },
    { icon: "FI", label: "Firme", href: "/firme" }
  ],
  company: [
    { icon: "PG", label: "Pregled", href: "/firma" },
    { icon: "OG", label: "Oglasi", href: "/firma/oglasi" },
    { icon: "+", label: "Novi oglas", href: "/firma/novi-oglas" },
    { icon: "SE", label: "Selekcija", href: "/firma/selekcija" },
    { icon: "UP", label: "Pretplata", href: "/firma/pretplata" }
  ],
  admin: [
    { icon: "AD", label: "Pregled", href: "/admin" },
    { icon: "UP", label: "Uplate", href: "/admin/uplate" },
    { icon: "OG", label: "Oglasi", href: "/admin/oglasi" },
    { icon: "FI", label: "Firme", href: "/admin/firme" },
    { icon: "KO", label: "Korisnici", href: "/admin/korisnici" }
  ]
};

export const mobileNavItems: Record<UserRole, NavItem[]> = {
  guest: [
    { icon: "IP", label: "Pocetna", href: "/" },
    { icon: "OO", label: "Oglasi", href: "/oglasi" },
    { icon: "FI", label: "Firme", href: "/firme" },
    { icon: "+", label: "Firma", href: "/registracija?role=company" },
    { icon: "IN", label: "Prijava", href: "/login" }
  ],
  candidate: [
    { icon: "IP", label: "Pocetna", href: "/" },
    { icon: "OO", label: "Oglasi", href: "/oglasi" },
    { icon: "CV", label: "Biografija", href: "/profil/biografija" },
    { icon: "AP", label: "Prijave", href: "/profil/prijave" },
    { icon: "OUT", label: "Odjava", href: "/logout" }
  ],
  company: [
    { icon: "PG", label: "Pregled", href: "/firma" },
    { icon: "OG", label: "Oglasi", href: "/firma/oglasi" },
    { icon: "+", label: "Novi", href: "/firma/novi-oglas" },
    { icon: "UP", label: "Uplata", href: "/firma/pretplata" },
    { icon: "OUT", label: "Odjava", href: "/logout" }
  ],
  admin: [
    { icon: "AD", label: "Pregled", href: "/admin" },
    { icon: "UP", label: "Uplate", href: "/admin/uplate" },
    { icon: "OG", label: "Oglasi", href: "/admin/oglasi" },
    { icon: "FI", label: "Firme", href: "/admin/firme" },
    { icon: "OUT", label: "Odjava", href: "/logout" }
  ]
};
