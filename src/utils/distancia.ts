/**
 * Calcula a distância entre dois pontos geográficos usando a fórmula de Haversine
 * @param lat1 Latitude do ponto 1
 * @param lon1 Longitude do ponto 1
 * @param lat2 Latitude do ponto 2
 * @param lon2 Longitude do ponto 2
 * @returns Distância em quilômetros
 */
export function calcularDistanciaKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const RAIO_TERRA_KM = 6371;

  const toRad = (graus: number) => (graus * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return RAIO_TERRA_KM * c;
}

/**
 * Formata a distância para exibição
 * @param distanciaKm Distância em quilômetros
 * @returns String formatada (ex: "2,5 km" ou "800 m")
 */
export function formatarDistancia(distanciaKm: number): string {
  if (distanciaKm < 1) {
    const metros = Math.round(distanciaKm * 1000);
    return `${metros} m`;
  }
  
  return `${distanciaKm.toFixed(1).replace('.', ',')} km`;
}
