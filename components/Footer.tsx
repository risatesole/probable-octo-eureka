import Link from 'next/link';
import Image from 'next/image';

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

const BrandLogo = () => (
  <Link 
    href="/" 
    className="inline-flex w-fit items-center justify-start gap-4 transition-opacity duration-300 ease-in-out hover:opacity-80 active:scale-[0.98]"
  >
    <Image 
      src="/image/logo_uasd.svg" 
      alt="UASD Logo" 
      width={140} 
      height={36} 
      className="h-8 w-auto object-contain"
      loading="lazy" // Optimización: lazy loading nativo para elementos below-the-fold
    />
    
    <div className="h-7 w-px bg-white/40"></div>
    
    <div className="flex flex-col justify-center">
      <span className="font-serif text-base font-bold tracking-widest text-white leading-tight uppercase">
        BUYFAST
      </span>
      <span className="mt-0.5 text-[9px] font-bold tracking-[0.2em] text-white leading-none uppercase">
        ECONÓMATO
      </span>
    </div>
  </Link>
);

const FooterLinkItem = ({ label, href, isExternal }: FooterLink) => {
  const baseClasses = "text-sm font-medium text-[#abc7ff] transition-colors duration-200 hover:text-white hover:underline underline-offset-4";
  
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
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#00193c] bg-[#002d62] px-6 py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:gap-12">
          
          {/* Brand & Descripción */}
          <div className="flex flex-col gap-5 md:col-span-2">
            <BrandLogo />
            <p className="max-w-sm text-sm text-[#abc7ff]/80 leading-relaxed">
              Plataforma tecnológica para la gestión e inventario del Ecónomato Universitario, optimizando el acceso a recursos académicos.
            </p>
          </div>

          {/* Enlaces Institucionales */}
          <nav aria-label="Enlaces institucionales">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">
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
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">
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
        <div className="mt-12 flex flex-col items-center justify-between border-t border-white/10 pt-8 sm:flex-row gap-4">
          <p className="text-xs font-medium text-[#abc7ff]/80">
            © {currentYear} UASD BuyFast. Todos los derechos reservados.
          </p>
          <p className="text-xs font-medium text-[#abc7ff]/80">
            Santo Domingo, República Dominicana
          </p>
        </div>
      </div>
    </footer>
  );
}