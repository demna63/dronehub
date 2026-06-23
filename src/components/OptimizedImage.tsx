import React from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  avifSrc?: string;
  webpSrc?: string;
  fallbackSrc?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  avifSrc,
  webpSrc,
  fallbackSrc,
  alt = '',
  loading = 'lazy',
  decoding = 'async',
  className = '',
  src,
  ...imgProps
}) => {
  const hasPictureSources = Boolean(avifSrc || webpSrc);
  const finalSrc = fallbackSrc || src || avifSrc || webpSrc || '';

  if (!hasPictureSources) {
    return <img alt={alt} loading={loading} decoding={decoding} className={className} src={finalSrc} {...imgProps} />;
  }

  return (
    <picture>
      {avifSrc ? <source srcSet={avifSrc} type="image/avif" /> : null}
      {webpSrc ? <source srcSet={webpSrc} type="image/webp" /> : null}
      <img alt={alt} loading={loading} decoding={decoding} className={className} src={finalSrc} {...imgProps} />
    </picture>
  );
};

export default OptimizedImage;
