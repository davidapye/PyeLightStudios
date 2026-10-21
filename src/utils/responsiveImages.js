const IMAGE_WIDTHS = [640, 1200, 2400];

export function getResponsiveImageProps(originalPath, sizes) {
  const name = originalPath.split('/').pop().replace(/\.[^.]+$/, '');
  const srcSet = IMAGE_WIDTHS
    .map((width) => `/images/responsive/${name}-${width}.webp ${width}w`)
    .join(', ');

  return {
    src: `/images/responsive/${name}-1200.webp`,
    srcSet,
    sizes,
  };
}
