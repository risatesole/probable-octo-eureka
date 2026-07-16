'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// ─── Helpers ──────────────────────────────────────────────────

function ProductGlyph({ category }: { category: string }) {
  const props = {
    className: "h-12 w-12 text-[#747781]", 
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    'aria-hidden': true,
  } as const;

  switch (category) {
    case 'Libros':
    case 'Books':
      return (
        <svg {...props}>
          <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
          <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
        </svg>
      );
    case 'Cuadernos':
    case 'Notebooks':
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="16" y2="17" />
        </svg>
      );
    case 'Bolígrafos':
    case 'Pens':
      return (
        <svg {...props}>
          <line x1="12" y1="19" x2="12" y2="23" />
          <path d="M6.34 17.66l-1.41-1.42 1.41-1.41" />
          <path d="M17.66 17.66l1.41-1.42-1.41-1.41" />
          <path d="M12 2L4.93 9.07a7 7 0 000 9.9L12 22l7.07-3.03a7 7 0 000-9.9L12 2z" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
  }
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(n);

// ─── Component ────────────────────────────────────────────────

export interface ProductCardProps {
  id: number;
  name: string;
  selling_price: number;
  categoryName: string;
  image?: string;
  slug: string;
  onAdd: (productId: number, quantity: number) => void;
}

export function ProductCard({
  id,
  name,
  selling_price,
  categoryName,
  image,
  slug,
  onAdd,
}: ProductCardProps) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAdd(id, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 900);
  };

  return (
    <article className="group flex h-full flex-col border border-[#e2e8f0] bg-[#ffffff] p-0 sm:p-0 transition-colors duration-200 hover:border-[#115cb9]">
      {/* Contenedor de Imagen */}
      <Link href={`/${slug}`} className="mb-5 block" aria-label={`Ver detalles de ${name}`}>
        <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-none bg-[#f7f9fb] transition-colors duration-200 group-hover:bg-[#f2f4f6]">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy" 
            />
          ) : (
            <ProductGlyph category={categoryName} />
          )}
        </div>
      </Link>

      {/* Contenedor de Metadatos */}
      <div className="flex flex-1 flex-col">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#747781]">
          {categoryName}
        </p>

        <Link href={`/${slug}`} className="block outline-none">
          <h3 className="font-serif text-base font-semibold leading-tight text-[#191c1e] transition-colors group-hover:text-[#115cb9] line-clamp-2">
            {name}
          </h3>
        </Link>
      </div>

      {/* Separador Físico */}
      <hr className="my-4 border-[#e2e8f0]" aria-hidden="true" />

      {/* Área de Transacción */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-serif text-base font-bold tracking-tight text-[#191c1e] sm:text-lg">
          {formatPrice(selling_price)}
        </span>
        <button
          onClick={handleAdd}
          disabled={added}
          aria-live="polite"
          className={`whitespace-nowrap rounded-none px-4 py-2 text-xs font-semibold sm:text-sm transition-all duration-200 active:scale-95 ${
            added
              ? 'border border-[#e0e3e5] bg-[#e0e3e5] text-[#43474f]'
              : 'border border-transparent bg-[#002d62] text-white hover:bg-[#115cb9]'
          }`}
        >
          {added ? '¡Añadido! ✓' : 'Añadir al carrito'}
        </button>
      </div>
    </article>
  );
}