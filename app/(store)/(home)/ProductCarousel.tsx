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

  useEffect(() => {
    if (!autoPlay || slides.length === 0 || isPaused) return;
    const timer = setInterval(goToNext, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval, slides.length, isPaused, goToNext]);

  if (!slides || slides.length === 0) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center bg-[#f2f4f6]">
        <span className="text-sm font-medium text-[#747781]">No hay imágenes disponibles</span>
      </div>
    );
  }

  const slide = slides[current];

  return (
    <div 
      className="group relative w-full overflow-hidden bg-[#091a2d]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative flex w-full aspect-[4/3] sm:aspect-[16/7] xl:aspect-[21/7] max-h-[850px]">
        
        {slide.image ? (
          <Image
            src={slide.image}
            alt={slide.title}
            fill 
            sizes="100vw"
            className="object-cover object-center"
            priority={current === 0}
            quality={90}
          />
        ) : (
          <div className="h-full w-full bg-[#f2f4f6]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#091a2d]/95 via-[#091a2d]/40 to-transparent" />

        <div className="absolute inset-0 mx-auto flex w-full max-w-7xl flex-col justify-end px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 pointer-events-none">
          
          <div className="max-w-2xl pointer-events-auto">
            <h3 className="mb-3 font-serif text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl drop-shadow-md">
              {slide.title}
            </h3>
            {slide.description && (
              <p className="mb-6 line-clamp-3 text-base text-[#eff1f3] sm:text-lg drop-shadow-sm">
                {slide.description}
              </p>
            )}
            <Link href={slide.buttonLink} prefetch={false}>
              <button className="inline-flex items-center gap-2 rounded-none bg-[#115cb9] px-8 py-3.5 text-sm font-bold tracking-wide text-white transition-all duration-200 hover:bg-[#002d62] active:scale-95 shadow-lg">
                {slide.buttonText || 'Ver Detalles'}
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Link>
          </div>
        </div>

        {/* ── Controles de Navegación Refactorizados ── */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 sm:left-8 lg:left-12 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white hover:text-[#002d62] active:scale-95 opacity-100 md:opacity-0 md:group-hover:opacity-100"
          aria-label="Diapositiva anterior"
        >
          <svg className="h-6 w-6 pr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={goToNext}
          className="absolute right-4 sm:right-8 lg:right-12 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white hover:text-[#002d62] active:scale-95 opacity-100 md:opacity-0 md:group-hover:opacity-100"
          aria-label="Siguiente diapositiva"
        >
          <svg className="h-6 w-6 pl-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Indicadores Base */}
        <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-1.5 rounded-none transition-all duration-300 ${
                index === current ? 'w-10 bg-white' : 'w-5 bg-white/40 hover:bg-white/70'
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