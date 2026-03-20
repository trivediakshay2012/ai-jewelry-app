import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  return useMemo(() => {
    const isTablet = width >= 768;
    const isDesktop = width >= 1024;
    const contentMaxWidth = isDesktop ? 1100 : isTablet ? 900 : width;
    const gutter = isDesktop ? 28 : isTablet ? 24 : 16;
    const columns = isDesktop ? 3 : isTablet ? 2 : 1;
    return { width, height, isTablet, isDesktop, contentMaxWidth, gutter, columns };
  }, [width, height]);
}
