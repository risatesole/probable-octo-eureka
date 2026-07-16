import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────

type FooterLink = {
  label: string;
  href: string;
  isExternal?: boolean;
};

// ── Constants & Data ───────────────────────────────────────────

const INSTITUTIONAL_LINKS: FooterLink[] = [
  { label: 'Portal Oficial UASD', href: 'https://uasd.edu.do', isExternal: true },
  { label: 'MESCYT', href: 'https://mescyt.gob.do', isExternal: true },
  { label: 'Registro Universitario', href: 'https://soft.uasd.edu.do/registro/', isExternal: true },
  { label: 'Biblioteca Pedro Mir', href: 'https://biblioteca.uasd.edu.do/', isExternal: true },
];

const LEGAL_LINKS: FooterLink[] = [
  { label: 'Privacidad', href: '/privacidad' },
  { label: 'Términos de Servicio', href: '/terminos' },
  { label: 'Políticas de Devolución', href: '/politicas' },
  { label: 'Soporte y Contacto', href: '/contacto' },
];

// ── Sub-components ─────────────────────────────────────────────

const FooterLinkItem = ({ label, href, isExternal }: FooterLink) => {
  const baseClasses = "text-sm font-medium text-[#43474f] transition-colors duration-200 hover:text-[#115cb9] hover:underline underline-offset-4";
  
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={baseClasses}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={baseClasses}>
      {label}
    </Link>
  );
};

// ── Component ──────────────────────────────────────────────────

export function Footer() {
  // Al no usar 'use client', este componente se evalúa y renderiza estáticamente en el servidor.
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#e2e8f0] bg-[#f7f9fb] px-6 py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:gap-12">
          
          {/* Brand & Descripción */}
          <div className="flex flex-col gap-4 md:col-span-2">
            <Link href="/" className="flex flex-col transition-opacity hover:opacity-80">
              <span className="font-serif text-xl font-extrabold leading-none tracking-tight text-[#002d62]">
                UASD
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#43474f]">
                BuyFast Ecónomato
              </span>
            </Link>
            <p className="max-w-sm text-sm text-[#747781] leading-relaxed">
              Plataforma tecnológica para la gestión e inventario del Ecónomato Universitario, optimizando el acceso a recursos académicos.
            </p>
          </div>

          {/* Enlaces Institucionales */}
          <nav aria-label="Enlaces institucionales">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#191c1e]">
              Institucional
            </h3>
            <ul className="flex flex-col gap-3">
              {INSTITUTIONAL_LINKS.map(link => (
                <li key={link.label}>
                  <FooterLinkItem {...link} />
                </li>
              ))}
            </ul>
          </nav>

          {/* Enlaces Legales */}
          <nav aria-label="Enlaces legales y soporte">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#191c1e]">
              Legal y Soporte
            </h3>
            <ul className="flex flex-col gap-3">
              {LEGAL_LINKS.map(link => (
                <li key={link.label}>
                  <FooterLinkItem {...link} />
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Separador & Copyright */}
        <div className="mt-12 flex flex-col items-center justify-between border-t border-[#e2e8f0] pt-8 sm:flex-row gap-4">
          <p className="text-xs font-medium text-[#747781]">
            © {currentYear} UASD BuyFast. Todos los derechos reservados.
          </p>
          <p className="text-xs font-medium text-[#747781]">
            Santo Domingo, República Dominicana
          </p>
        </div>
      </div>
    </footer>
  );
}