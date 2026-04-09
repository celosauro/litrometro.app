import { MapPin, Phone, Clock, TrendUp, TrendDown } from '@phosphor-icons/react';
import type { PrecoCombustivelResumo, TipoCombustivel } from '../types';
import { TIPOS_COMBUSTIVEL, CORES_COMBUSTIVEL } from '../types';

interface CardCombustivelProps {
  dados: PrecoCombustivelResumo;
}

export function CardCombustivel({ dados }: CardCombustivelProps) {
  const tipoCombustivel = dados.tipo_combustivel as TipoCombustivel;
  const nomeCombustivel = TIPOS_COMBUSTIVEL[tipoCombustivel];
  const corCombustivel = CORES_COMBUSTIVEL[tipoCombustivel];
  
  const formatarPreco = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 3,
    });
  };

  const formatarData = (dataStr: string) => {
    const data = new Date(dataStr);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatarEndereco = () => {
    const partes = [
      dados.nome_logradouro,
      dados.numero_imovel ? `nº ${dados.numero_imovel}` : null,
      dados.bairro,
    ].filter(Boolean);
    return partes.join(', ');
  };

  const nomeExibicao = dados.nome_fantasia || dados.razao_social;

  return (
    <div className="fuel-card">
      {/* Header com badge */}
      <div className="px-4 pt-4 pb-2 flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate" title={nomeExibicao}>
            {nomeExibicao}
          </h3>
          <p className="text-sm text-gray-500 truncate" title={dados.municipio}>
            {dados.municipio}
          </p>
        </div>
        <span className={`fuel-badge ${corCombustivel} ml-2 flex-shrink-0`}>
          {nomeCombustivel}
        </span>
      </div>

      {/* Preço principal */}
      <div className="px-4 py-3 bg-gray-50">
        <div className="flex items-baseline gap-2">
          <span className="price-display">{formatarPreco(dados.valor_recente)}</span>
          <span className="text-gray-500">/litro</span>
        </div>
        
        {/* Variação de preço */}
        <div className="mt-2 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-green-600">
            <TrendDown size={16} />
            <span>Mín: {formatarPreco(dados.valor_minimo)}</span>
          </div>
          <div className="flex items-center gap-1 text-red-600">
            <TrendUp size={16} />
            <span>Máx: {formatarPreco(dados.valor_maximo)}</span>
          </div>
        </div>
      </div>

      {/* Informações do estabelecimento */}
      <div className="fuel-card-info px-4 py-3 space-y-2 text-sm text-gray-600">
        <div className="flex items-start gap-2">
          <MapPin size={18} className="flex-shrink-0 mt-0.5 text-gray-400" />
          <span className="line-clamp-2">{formatarEndereco() || 'Endereço não informado'}</span>
        </div>

        <div className="flex items-center gap-2">
          <Phone size={18} className="flex-shrink-0 text-gray-400" />
          {dados.telefone ? (
            <a
              href={`tel:${dados.telefone.replace(/\D/g, '')}`}
              className="text-blue-600 hover:underline"
            >
              {dados.telefone}
            </a>
          ) : (
            <span className="text-gray-400">Não informado</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-gray-400">
          <Clock size={18} className="flex-shrink-0" />
          <span>Atualizado: {formatarData(dados.data_recente)}</span>
        </div>
      </div>

      {/* Link para mapa */}
      <div className="px-4 pb-4">
        <a
          href={
            dados.latitude !== 0 && dados.longitude !== 0
              ? `https://www.google.com/maps/search/?api=1&query=${dados.latitude},${dados.longitude}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${dados.nome_logradouro}, ${dados.numero_imovel}, ${dados.bairro}, ${dados.municipio}, AL`
                )}`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center btn-secondary text-sm"
        >
          Ver no mapa
        </a>
      </div>
    </div>
  );
}
