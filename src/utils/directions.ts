interface Coordenadas {
  latitude: number;
  longitude: number;
}

export function criarLinkGoogleDirections(
  destino: Coordenadas,
  origem?: Coordenadas | null
): string {
  const params = new URLSearchParams({
    api: '1',
    destination: `${destino.latitude},${destino.longitude}`,
    travelmode: 'driving',
  });

  if (origem) {
    params.set('origin', `${origem.latitude},${origem.longitude}`);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}