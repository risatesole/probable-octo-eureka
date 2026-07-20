// app/(store)/categories/page.tsx
import Link from 'next/link';
import Image from 'next/image';

// ─── Interfaces (Data Transfer Objects) ─────────────────────────

export interface Category {
  label: string;
  description: string;
  priority: number;
  slug: string;
  // Hacemos que el anidamiento de imágenes sea opcional/parcial
  // para proteger el frontend contra serializadores de DRF incompletos
  images?: {
    banner?: string;
    cart?: string;
    default?: string;
  };
}

// ─── Capa de Servicio (Data Fetching) ───────────────────────────

async function getCategories(): Promise<Category[]> {
  const backendUrl = process.env.BACKEND_URL;
  
  if (!backendUrl) {
    console.error('[Config Error] BACKEND_URL no está definida.');
    return [];
  }

  try {
    // Uso de URL() previene errores de dobles slashes (ej. http://localhost:8000//api/...)
    const endpoint = new URL('/api/v1/products/categories', backendUrl);

    const res = await fetch(endpoint.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600, tags: ['categories'] },
    });

    if (!res.ok) {
      throw new Error(`Error en API HTTP: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    const data = json.data || json.results || json; // Resiliencia ante paginación de DRF

    const categoriesArray: Category[] = Array.isArray(data) ? data : Object.values(data ?? {});
    
    // Sort defensivo con fallback numérico (ej. si priority es null/undefined)
    return categoriesArray.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
  } catch (error) {
    console.error('[Categories Fetch Error]:', error);
    return [];
  }
}

// ─── Componente Principal (Server Component) ───────────────────

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10 border-b border-[#e2e8f0] pb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#747781]">
          Comprar por
        </p>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[#002d62] md:text-4xl">
          Categorías
        </h1>
      </header>

      {categories.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center border border-[#e2e8f0] bg-[#f7f9fb]">
          <p className="text-sm font-medium text-[#747781]">
            No hay categorías disponibles en este momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((cat) => (
            <CategoryCard key={cat.slug} category={cat} />
          ))}
        </div>
      )}
    </main>
  );
}

// ─── Sub-componentes ───────────────────────────────────────────

function CategoryCard({ category }: { category: Category }) {
  // Extracción segura del origen de la imagen
  const imageSrc = category.images?.default;

  return (
    <Link
      href={`/categorias/${category.slug}`}
      className="group flex flex-col border border-[#e2e8f0] bg-[#ffffff] p-4 transition-colors duration-200 hover:border-[#115cb9]"
      aria-label={`Ver productos en la categoría ${category.label}`}
    >
      <div className="relative mb-4 flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-[#f7f9fb] transition-colors duration-200 group-hover:bg-[#f2f4f6]">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={`Fotografía representativa de la categoría ${category.label}`}
            fill
            // Optimización estricta de breakpoints mapeada a las columnas del grid
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          // Fallback UI si DRF no retorna imagen configurada
          <span className="text-xs font-medium text-gray-400">Sin imagen</span>
        )}
      </div>

      <div className="flex flex-1 flex-col text-center sm:text-left">
        <h2 className="mb-2 font-serif text-lg font-semibold leading-tight text-[#191c1e] transition-colors group-hover:text-[#115cb9]">
          {category.label}
        </h2>
        
        {category.description && (
          <p className="line-clamp-2 text-sm text-[#43474f]">
            {category.description}
          </p>
        )}
      </div>
    </Link>
  );
}