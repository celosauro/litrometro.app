/**
 * PriceBadge - Badge colorido indicando faixa de preço
 * Verde (baixo), Amarelo (médio), Vermelho (alto)
 */

import { TrendDown, TrendUp, Minus } from '@phosphor-icons/react';

export type PriceLevel = 'low' | 'medium' | 'high';

interface PriceBadgeProps {
  level: PriceLevel;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

const levelConfig: Record<PriceLevel, { 
  label: string; 
  icon: typeof TrendDown;
  className: string;
}> = {
  low: {
    label: 'Preço baixo',
    icon: TrendDown,
    className: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
  },
  medium: {
    label: 'Preço médio',
    icon: Minus,
    className: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  },
  high: {
    label: 'Preço alto',
    icon: TrendUp,
    className: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  },
};

export function PriceBadge({ level, showIcon = true, size = 'sm' }: PriceBadgeProps) {
  const config = levelConfig[level];
  const Icon = config.icon;
  
  const sizeClasses = size === 'sm' 
    ? 'text-[10px] px-1.5 py-0.5 gap-0.5' 
    : 'text-xs px-2 py-1 gap-1';
  
  const iconSize = size === 'sm' ? 10 : 12;
  
  return (
    <span 
      className={`inline-flex items-center font-medium rounded-full border ${config.className} ${sizeClasses}`}
      title={config.label}
    >
      {showIcon && <Icon size={iconSize} weight="bold" />}
      <span>{config.label}</span>
    </span>
  );
}

/**
 * Calcula o nível de preço baseado no valor e na faixa de preços do município
 * @param preco Preço do posto
 * @param precos Array de preços do município para calcular percentis
 * @returns PriceLevel (low, medium, high)
 */
export function calcularNivelPreco(preco: number, precos: number[]): PriceLevel {
  if (precos.length === 0) return 'medium';
  
  const ordenados = [...precos].sort((a, b) => a - b);
  const n = ordenados.length;
  
  // Percentil 33 e 66
  const p33 = ordenados[Math.floor(n * 0.33)] ?? ordenados[0];
  const p66 = ordenados[Math.floor(n * 0.66)] ?? ordenados[n - 1];
  
  if (preco <= p33) return 'low';
  if (preco >= p66) return 'high';
  return 'medium';
}

/**
 * Calcula a economia em relação à média
 * @param preco Preço do posto
 * @param precos Array de preços para calcular média
 * @returns Valor da economia (positivo = economiza, negativo = mais caro)
 */
export function calcularEconomia(preco: number, precos: number[]): number {
  if (precos.length === 0) return 0;
  
  const media = precos.reduce((a, b) => a + b, 0) / precos.length;
  return media - preco;
}

/**
 * EconomiaBadge - Badge mostrando economia em relação à média
 */
interface EconomiaBadgeProps {
  economia: number;
}

export function EconomiaBadge({ economia }: EconomiaBadgeProps) {
  // Só mostra se economia for significativa (> R$ 0.05)
  if (economia <= 0.05) return null;
  
  const formatado = economia.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return (
    <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
      <span>💰</span>
      <span>Economize {formatado}/L</span>
    </span>
  );
}

/**
 * ProximidadeBadge - Badge mostrando que o posto está próximo
 */
interface ProximidadeBadgeProps {
  distancia: number;
}

export function ProximidadeBadge({ distancia }: ProximidadeBadgeProps) {
  // Só mostra se distância for < 2km
  if (distancia >= 2) return null;
  
  return (
    <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
      <span>📍</span>
      <span>Perto de você</span>
    </span>
  );
}
