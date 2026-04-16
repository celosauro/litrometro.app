import { useEffect, useRef } from 'react'
import { X, MapPin } from '@phosphor-icons/react'
import maplibregl from 'maplibre-gl'
import type { PrecoCombustivelResumo } from '../../types'

interface MapModalProps {
  estabelecimento: PrecoCombustivelResumo | null
  onClose: () => void
}

export function MapModal({ estabelecimento, onClose }: MapModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!estabelecimento || !mapContainerRef.current) return

    const { latitude, longitude } = estabelecimento

    // Criar mapa
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [longitude, latitude],
      zoom: 16,
    })

    mapRef.current = map

    // Adicionar controles
    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    // Criar marcador
    const el = document.createElement('div')
    el.className = 'map-modal-marker'
    el.innerHTML = `
      <div class="w-10 h-10 rounded-full bg-brand-600 border-4 border-white shadow-lg 
                  flex items-center justify-center text-white animate-bounce">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
          <path d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z"/>
        </svg>
      </div>
    `

    new maplibregl.Marker({ element: el })
      .setLngLat([longitude, latitude])
      .addTo(map)

    // Cleanup
    return () => {
      map.remove()
    }
  }, [estabelecimento])

  // Fechar com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!estabelecimento) return null

  const nomeExibicao = estabelecimento.nome_fantasia || estabelecimento.razao_social
  const endereco = `${estabelecimento.nome_logradouro}${estabelecimento.numero_imovel ? `, ${estabelecimento.numero_imovel}` : ''} - ${estabelecimento.bairro}, ${estabelecimento.municipio}`

  const formatarPreco = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 3,
    })
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl h-[80vh] max-h-[600px] bg-white dark:bg-gray-800 
                   rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-white/95 dark:bg-gray-800/95 
                        backdrop-blur-sm px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900 dark:text-white text-lg truncate">
                {nomeExibicao}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                <MapPin size={14} />
                <span className="truncate">{endereco}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xl font-bold text-brand-600 dark:text-brand-400">
                  {formatarPreco(estabelecimento.valor_recente)}
                </span>
                <span className="text-sm text-gray-500">/L</span>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 
                           text-gray-500 dark:text-gray-400 transition-colors"
                aria-label="Fechar mapa"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Mapa */}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Botão abrir no Google Maps */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${estabelecimento.latitude},${estabelecimento.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full
                       bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm
                       shadow-lg hover:shadow-xl transition-all"
          >
            <MapPin size={18} weight="fill" />
            Abrir rota no Google Maps
          </a>
        </div>
      </div>
    </div>
  )
}
