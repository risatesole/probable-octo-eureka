// components/ProductCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import { memo, useCallback } from 'react';

// Tipado híbrido para soportar UUIDv4 de Django o IDs incrementales (BigAutoField)
export interface ProductCardProps {
  id: string | number;
  name: string;
  selling_price: number;
  categoryName: string;
  image: string;
  slug: string;
  onAdd: (productId: string | number, quantity: number) => void;
}

// Instanciación del formateador fuera del ciclo de renderizado.
// Crear una nueva instancia de Intl.NumberFormat es una operación costosa en JS.
const DOP_FORMATTER = new Intl.NumberFormat('es-DO', { 
  style: 'currency', 
  currency: 'DOP' 
});

export const ProductCard = memo(function ProductCard({
  id,
  name,
  selling_price,
  categoryName,
  image,
  slug,
  onAdd,
}: ProductCardProps) {
  
  // Estabilización del event handler para evitar la recreación de la función 
  // en cada ciclo de renderizado, optimizando el uso de memoria en listas grandes.
  const handleAddToCart = useCallback(() => {
    onAdd(id, 1);
  }, [id, onAdd]);

  return (
    <article className="group relative flex h-full flex-col justify-between border border-[#e2e8f0] bg-white transition-shadow hover:shadow-md">
      
      <Link 
        href={`/${slug}`} 
        prefetch={false} 
        className="flex flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-[#002d62]"
      >
        <div className="relative aspect-square w-full overflow-hidden bg-[#f7f9fb]">
          <Image
            src={image}
            alt={`Imagen del producto: ${name}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        
        <div className="flex flex-1 flex-col p-4">
          <span className="mb-1 text-xs font-bold uppercase tracking-wider text-[#747781]">
            {categoryName}
          </span>
          <h3 className="mb-2 line-clamp-2 font-serif text-sm font-semibold leading-tight text-[#002d62] md:text-base">
            {name}
          </h3>
          <div className="mt-auto pt-2">
            <span className="font-serif text-lg font-bold text-[#191c1e]">
              {DOP_FORMATTER.format(selling_price)}
            </span>
          </div>
        </div>
      </Link>

      <div className="p-4 pt-0">
        <button
          onClick={handleAddToCart}
          aria-label={`Añadir ${name} al carrito`}
          className="w-full bg-[#002d62] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#115cb9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#115cb9] active:scale-[0.98]"
        >
          Añadir al carrito
        </button>
      </div>
    </article>
  );
});