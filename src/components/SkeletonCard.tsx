/**
 * SkeletonCard - Card placeholder durante carregamento
 * Exibe animação pulse enquanto dados são carregados
 */

export function SkeletonCard() {
  return (
    <div className="fuel-card animate-pulse" aria-hidden="true">
      {/* Header */}
      <div className="px-3 pt-3 pb-1.5 sm:px-4 sm:pt-4 sm:pb-2 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-36 sm:w-48" />
            <div className="h-5 bg-brand-100 dark:bg-brand-900/50 rounded-full w-14" />
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        </div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-24 sm:w-28" />
      </div>

      {/* Preço */}
      <div className="px-3 py-2 sm:px-4 sm:py-3 bg-gray-50 dark:bg-gray-700/50">
        <div className="flex items-baseline gap-2">
          <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-28 sm:w-32" />
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12" />
        </div>
        <div className="mt-2 flex items-center gap-4">
          <div className="h-4 bg-green-100 dark:bg-green-900/30 rounded w-24" />
          <div className="h-4 bg-red-100 dark:bg-red-900/30 rounded w-24" />
        </div>
      </div>

      {/* Informações */}
      <div className="px-3 py-2 sm:px-4 sm:py-3 space-y-2">
        <div className="flex items-start gap-2">
          <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 max-w-[200px]" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
        </div>
      </div>

      {/* Botão */}
      <div className="px-3 pb-3 sm:px-4 sm:pb-4">
        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-lg w-full" />
      </div>
    </div>
  );
}

/**
 * SkeletonCardList - Lista de cards skeleton
 * @param count Número de skeletons a exibir (default: 6)
 */
export function SkeletonCardList({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
