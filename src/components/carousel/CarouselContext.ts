import { createContext, useContext } from 'react';
import type { CarouselController } from './controller';

export const CarouselContext = createContext<CarouselController | null>(null);

export function useCarousel(): CarouselController {
  const ctrl = useContext(CarouselContext);
  if (!ctrl) throw new Error('useCarousel must be used inside <CasesCarousel>');
  return ctrl;
}
