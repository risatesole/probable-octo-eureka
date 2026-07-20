
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Panel de Control',
  description: 'Panel de administración principal del sistema.',
};

export default function AdminPage() {
  return (
    <main className="p-6 md:p-8 w-full max-w-7xl mx-auto">
      <header className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Bienvenido al panel de administración.
        </p>
      </header>

      {/* Grid preparado para la inyección de Server/Client Components (Métricas, Tablas, etc.) */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder para widgets de administración */}
      </section>
    </main>
  );
}