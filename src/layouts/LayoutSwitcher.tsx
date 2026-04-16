import { useState, useRef, useEffect } from 'react'
import { useLayout } from './LayoutContext'
import { LAYOUTS } from './types'

export function LayoutSwitcher() {
  const { layoutAtual, alterarLayout } = useLayout()
  const [aberto, setAberto] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const layoutSelecionado = LAYOUTS.find(l => l.id === layoutAtual) ?? LAYOUTS[0]

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }

    if (aberto) {
      document.addEventListener('mousedown', handleClickFora)
    }

    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [aberto])

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setAberto(!aberto)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm font-medium
                   text-brand-700 dark:text-brand-300
                   hover:bg-brand-100 dark:hover:bg-brand-800/50
                   transition-colors"
        aria-label="Alterar visualização"
        aria-expanded={aberto}
      >
        <span className="text-lg">{layoutSelecionado.icone}</span>
        <span className="hidden sm:inline">{layoutSelecionado.nome}</span>
        <svg
          className={`w-4 h-4 transition-transform ${aberto ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {aberto && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-gray-800 
                        shadow-lg ring-1 ring-black/5 dark:ring-white/10 z-50 overflow-hidden">
          <div className="p-1">
            {LAYOUTS.map((layout) => (
              <button
                key={layout.id}
                onClick={() => {
                  alterarLayout(layout.id)
                  setAberto(false)
                }}
                className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left
                           transition-colors
                           ${layoutAtual === layout.id
                             ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                             : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                           }`}
              >
                <span className="text-xl">{layout.icone}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{layout.nome}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {layout.descricao}
                  </div>
                </div>
                {layoutAtual === layout.id && (
                  <svg className="w-5 h-5 text-brand-600 dark:text-brand-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
