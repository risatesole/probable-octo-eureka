// app/(store)/categories/page.tsx
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

interface Category {
  label: string;
  description: string;
  priority: number;
  slug: string;
  images: {
    banner: string;
    cart: string;
    default: string;
  };
}

const DJANGO_BASE = process.env.BACKEND_URL ?? 'http://localhost:8000';

async function getCategories(): Promise<Record<string, Category>> {
  try {
    const res = await fetch(`${DJANGO_BASE}/api/v1/products/categories`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Failed to fetch categories:', res.status);
      return {};
    }

    const json: { status: string; data: Record<string, Category> } = await res.json();
    return json.data ?? {};
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return {};
  }
}

export default async function CategoriesPage() {
  const categoriesData = await getCategories();
  const categories = Object.entries(categoriesData).map(([key, value]) => ({
    key,
    ...value,
  }));

  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: '4rem 2rem 6rem' }}>
      {/* Page header */}
      <header
        style={{
          marginBottom: '3rem',
          borderBottom: '1px solid oklch(0.922 0 0)',
          paddingBottom: '1.5rem',
        }}
      >
        <p
          style={{
            fontSize: '0.68rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'oklch(0.708 0 0)',
            marginBottom: '0.5rem',
          }}
        >
          Shop by
        </p>
        <h1
          style={{
            fontFamily: "'Georgia', serif",
            fontWeight: 400,
            fontSize: '2rem',
            margin: 0,
          }}
        >
          Categories
        </h1>
      </header>

      {categories.length === 0 ? (
        <p style={{ color: 'oklch(0.708 0 0)', fontSize: '1rem' }}>
          No categories available right now.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '2rem',
          }}
        >
          {categories.map(cat => (
            <CategoryCard key={cat.key} category={cat} />
          ))}
        </div>
      )}
    </main>
  );
}

function CategoryCard({ category }: { category: Category & { key: string } }) {
  return (
    <Link
      href={`/categories/${category.slug.toLowerCase().replace(/\s+/g, '-')}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <article
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderBottom: '1px solid oklch(0.922 0 0)',
          paddingBottom: '1.5rem',
          cursor: 'pointer',
        }}
      >
        {/* Image area */}
        <div
          style={{
            aspectRatio: '4/3',
            background: 'oklch(0.985 0 0)',
            borderRadius: 4,
            marginBottom: '1.25rem',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <Image
            src={category.images.default}
            alt={category.label}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* Name */}
        <h2
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: '1rem',
            fontWeight: 400,
            margin: '0 0 0.4rem',
          }}
        >
          {category.label}
        </h2>

        {/* Description (truncated) */}
        {category.description && (
          <p
            style={{
              fontSize: '0.82rem',
              color: 'oklch(0.708 0 0)',
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {category.description}
          </p>
        )}
      </article>
    </Link>
  );
}
