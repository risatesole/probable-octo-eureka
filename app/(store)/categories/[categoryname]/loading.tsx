export default function Loading() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 bg-[#f7f9fb]">
      <div
        className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[#e2e8f0] border-t-[#002d62] align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
        role="status"
        aria-label="Cargando contenido"
      >
        {/* Nodo exclusivo para lectores de pantalla */}
        <span className="sr-only">Cargando...</span>
      </div>
      
      <p className="font-sans text-sm font-semibold uppercase tracking-wider text-[#43474f]">
        Cargando...
      </p>
    </div>
  );
}