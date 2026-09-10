import React, { useState } from 'react';
import { resolveImageUrl, DEFAULT_JEWELLERY_PLACEHOLDER } from '../../utils/imageUrlResolver';

interface SmartImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  alt?: string;
  fallbackSrc?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  aspectRatio?: string;
  containerClassName?: string;
}

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt = 'Shanker Jewells Item',
  fallbackSrc = DEFAULT_JEWELLERY_PLACEHOLDER,
  objectFit = 'cover',
  aspectRatio,
  containerClassName = '',
  className = '',
  loading = 'lazy',
  onError,
  onLoad,
  ...restProps
}) => {
  const resolvedSrc = resolveImageUrl(src);
  const [currentSrc, setCurrentSrc] = useState<string>(resolvedSrc);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync state if src prop changes
  React.useEffect(() => {
    const nextSrc = resolveImageUrl(src);
    setCurrentSrc(nextSrc);
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError) {
      setHasError(true);
      setCurrentSrc(fallbackSrc);
    }
    setIsLoading(false);
    if (onError) onError(e);
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoading(false);
    if (onLoad) onLoad(e);
  };

  const fitClass =
    objectFit === 'contain'
      ? 'object-contain'
      : objectFit === 'fill'
      ? 'object-fill'
      : objectFit === 'none'
      ? 'object-none'
      : 'object-cover';

  const imageElement = (
    <img
      {...restProps}
      src={currentSrc}
      alt={alt}
      loading={loading}
      onLoad={handleLoad}
      onError={handleError}
      className={`w-full h-full ${fitClass} transition-opacity duration-300 ${
        isLoading ? 'opacity-0' : 'opacity-100'
      } ${className}`}
    />
  );

  return (
    <div
      className={`relative overflow-hidden bg-luxury-beige/40 ${containerClassName}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Loading Shimmer Effect */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-luxury-ivory via-white to-luxury-ivory animate-pulse z-0 flex items-center justify-center">
          <span className="w-6 h-6 rounded-full border-2 border-luxury-gold/30 border-t-luxury-gold animate-spin" />
        </div>
      )}

      {imageElement}
    </div>
  );
};

export default SmartImage;
