'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// ── Interfaces ──────────────────────────────────────────────────

export interface CarouselSlide {
  id: string;
  image: string;
  title: string;
  description?: string;
  buttonText?: string;
  buttonLink: string;
}

interface CarouselProps {
  slides: CarouselSlide[];
  autoPlay?: boolean;
  interval?: number;
}

// ── Component ───────────────────────────────────────────────────

export default function Carousel({ slides, autoPlay = true, interval = 5000 }: CarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goToNext = useCallback(() => {
    setCurrent(prev => (prev + 1) % slides.length);
  }, [slides.length]);

  const goToPrevious = useCallback(() => {
    setCurrent(prev => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrent(index);
  };

  // Manejo de AutoPlay con pausa en hover para mejor UX
  useEffect(() => {
    if (!autoPlay || slides.length === 0 || isPaused) return;

    const timer = setInterval(goToNext, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval, slides.length, isPaused, goToNext]);

  // Early return simplificado sin estados de carga redundantes en el cliente
  if (!slides || slides.length === 0) {
    return (
      <div className="flex aspect-[16/4] w-full items-center justify-center bg-[#f2f4f6] border border-[#e2e8f0]">
        <span className="text-sm font-medium text-[#747781]">No hay imágenes disponibles</span>
      </div>
    );
  }

  const slide = slides[current];

  return (
    <div 
      className="relative w-full bg-[#f7f9fb] py-4 sm:py-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Contenedor Principal (Geometría estricta - sharp edges) */}
        <div className="relative overflow-hidden rounded-none border border-[#e2e8f0] bg-[#ffffff] shadow-sm">
          <div className="flex aspect-[16/5] items-center justify-center bg-[#f7f9fb] md:aspect-[21/6]">
            {slide.image ? (
              <Image
                src={slide.image}
                alt={slide.title}
                width={1400}
                height={525}
                className="h-full w-full object-cover"
                priority={current === 0} // LCP optimization para la primera imagen
                quality={85}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#f2f4f6]">
                <span className="text-sm text-[#747781]">Imagen no disponible</span>
              </div>
            )}
          </div>

          {/* Overlay de información */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#091a2d]/90 via-[#091a2d]/40 to-transparent p-4 sm:p-8">
            <div className="max-w-xl">
              <h3 className="mb-2 font-serif text-xl font-bold leading-tight text-white sm:text-2xl md:text-3xl">
                {slide.title}
              </h3>
              {slide.description && (
                <p className="mb-4 line-clamp-2 text-sm text-[#eff1f3] sm:text-base">
                  {slide.description}
                </p>
              )}
              <Link href={slide.buttonLink}>
                <button className="inline-flex items-center gap-2 rounded-none bg-[#002d62] px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#115cb9] active:scale-95">
                  {slide.buttonText || 'Ver Detalles'}
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </Link>
            </div>
          </div>

          {/* Controles de Navegación */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-none bg-white/90 p-2 text-[#002d62] shadow-sm transition-all duration-200 hover:bg-white hover:text-[#115cb9] active:scale-95"
            aria-label="Diapositiva anterior"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-none bg-white/90 p-2 text-[#002d62] shadow-sm transition-all duration-200 hover:bg-white hover:text-[#115cb9] active:scale-95"
            aria-label="Siguiente diapositiva"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Indicadores (Adaptados a líneas rígidas según Design System) */}
        <div className="mt-4 flex justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-1.5 transition-all duration-300 rounded-none ${
                index === current
                  ? 'w-8 bg-[#002d62]'
                  : 'w-4 bg-[#c4c6d1] hover:bg-[#747781]'
              }`}
              aria-label={`Ir a la diapositiva ${index + 1}`}
              aria-current={index === current}
            />
          ))}
        </div>
      </div>
    </div>
  );
}