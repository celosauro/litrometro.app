/**
 * SkeletonCard - Card placeholder durante carregamento
 * Exibe animação pulse enquanto dados são carregados
 * Estilo Find Fuel App
 */

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 animate-pulse border border-gray-100 dark:border-gray-700" aria-hidden="true">
      {/* Header: Ícone + Info */}
      <div className="flex items-start gap-3 mb-4">
        {/* Ícone */}
        <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
        
        {/* Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        </div>
      </div>

      {/* Preço */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16 mb-1" />
            <div className="h-7 bg-gray-200 dark:bg-gray-600 rounded w-28" />
          </div>
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded-lg w-16" />
        </div>
        <div className="flex items-center gap-4 pt-2 border-t border-gray-200 dark:border-gray-600">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20" />
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20 ml-auto" />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
