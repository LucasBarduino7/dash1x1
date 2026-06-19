import Image from 'next/image';

/**
 * Banner no topo de uma aba — largura total do conteúdo, cantos arredondados.
 * Coloque o arquivo em /public e passe o caminho em `src` (ex: "/banner-1x1.png").
 */
export function PageBanner({
  src,
  alt,
  width = 1920,
  height = 480,
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority
      className="mb-6 h-auto w-full rounded-2xl"
    />
  );
}
