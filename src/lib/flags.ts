/** URLs de bandeira compatíveis com flagcdn (formato w{width} retorna 404). */

export function flagSvgUrl(iso: string): string {
  return `https://flagcdn.com/${iso}.svg`
}

export function flagPngUrl(iso: string, width: number): string {
  const height = Math.round(width * 0.75)
  return `https://flagcdn.com/${width}x${height}/${iso}.png`
}

export function resolveFlagUrls(iso: string, size = 24) {
  const width = Math.max(16, size * 2)
  return {
    svg: flagSvgUrl(iso),
    png: flagPngUrl(iso, width),
  }
}
