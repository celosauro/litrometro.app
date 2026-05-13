import type { PrecoCombustivelResumo } from '../types';

export function obterPrecoEfetivo24h(item: PrecoCombustivelResumo): number {
  return item.valor_minimo_24h ?? item.valor_recente;
}
