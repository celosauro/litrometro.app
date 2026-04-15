/**
 * Tipos gerados para o schema Supabase do Litrômetro
 * Atualizar manualmente ou usar: npx supabase gen types typescript
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TipoCombustivel = 1 | 2 | 3 | 4 | 5 | 6;

export interface Database {
  public: {
    Tables: {
      municipios: {
        Row: {
          codigo_ibge: string;
          nome: string;
          uf: string;
          created_at: string;
        };
        Insert: {
          codigo_ibge: string;
          nome: string;
          uf?: string;
          created_at?: string;
        };
        Update: {
          codigo_ibge?: string;
          nome?: string;
          uf?: string;
          created_at?: string;
        };
      };
      estabelecimentos: {
        Row: {
          cnpj: string;
          razao_social: string;
          nome_fantasia: string | null;
          telefone: string | null;
          nome_logradouro: string | null;
          numero_imovel: string | null;
          bairro: string | null;
          cep: string | null;
          codigo_ibge: string;
          latitude: number | null;
          longitude: number | null;
          geocode_source: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          cnpj: string;
          razao_social: string;
          nome_fantasia?: string | null;
          telefone?: string | null;
          nome_logradouro?: string | null;
          numero_imovel?: string | null;
          bairro?: string | null;
          cep?: string | null;
          codigo_ibge: string;
          latitude?: number | null;
          longitude?: number | null;
          geocode_source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          cnpj?: string;
          razao_social?: string;
          nome_fantasia?: string | null;
          telefone?: string | null;
          nome_logradouro?: string | null;
          numero_imovel?: string | null;
          bairro?: string | null;
          cep?: string | null;
          codigo_ibge?: string;
          latitude?: number | null;
          longitude?: number | null;
          geocode_source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      precos_atuais: {
        Row: {
          id: string;
          cnpj: string;
          tipo_combustivel: TipoCombustivel;
          valor_minimo: number;
          valor_maximo: number;
          valor_medio: number;
          valor_recente: number;
          data_recente: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cnpj: string;
          tipo_combustivel: TipoCombustivel;
          valor_minimo: number;
          valor_maximo: number;
          valor_medio: number;
          valor_recente: number;
          data_recente: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cnpj?: string;
          tipo_combustivel?: TipoCombustivel;
          valor_minimo?: number;
          valor_maximo?: number;
          valor_medio?: number;
          valor_recente?: number;
          data_recente?: string;
          updated_at?: string;
        };
      };
      vendas_historico: {
        Row: {
          id: string;
          cnpj: string;
          tipo_combustivel: TipoCombustivel;
          valor_venda: number;
          data_venda: string;
          coletado_em: string;
        };
        Insert: {
          id?: string;
          cnpj: string;
          tipo_combustivel: TipoCombustivel;
          valor_venda: number;
          data_venda: string;
          coletado_em?: string;
        };
        Update: {
          id?: string;
          cnpj?: string;
          tipo_combustivel?: TipoCombustivel;
          valor_venda?: number;
          data_venda?: string;
          coletado_em?: string;
        };
      };
      coletas_log: {
        Row: {
          id: string;
          iniciado_em: string;
          finalizado_em: string | null;
          total_vendas: number | null;
          total_estabelecimentos: number | null;
          total_municipios: number | null;
          status: 'running' | 'success' | 'partial' | 'error';
          erro: string | null;
        };
        Insert: {
          id?: string;
          iniciado_em?: string;
          finalizado_em?: string | null;
          total_vendas?: number | null;
          total_estabelecimentos?: number | null;
          total_municipios?: number | null;
          status?: 'running' | 'success' | 'partial' | 'error';
          erro?: string | null;
        };
        Update: {
          id?: string;
          iniciado_em?: string;
          finalizado_em?: string | null;
          total_vendas?: number | null;
          total_estabelecimentos?: number | null;
          total_municipios?: number | null;
          status?: 'running' | 'success' | 'partial' | 'error';
          erro?: string | null;
        };
      };
    };
    Views: {
      v_precos_completos: {
        Row: {
          cnpj: string;
          tipo_combustivel: TipoCombustivel;
          razao_social: string;
          nome_fantasia: string | null;
          telefone: string | null;
          nome_logradouro: string | null;
          numero_imovel: string | null;
          bairro: string | null;
          cep: string | null;
          codigo_ibge: string;
          municipio: string;
          latitude: number | null;
          longitude: number | null;
          valor_minimo: number;
          valor_maximo: number;
          valor_medio: number;
          valor_recente: number;
          data_recente: string;
          updated_at: string;
        };
      };
      v_resumo_municipios: {
        Row: {
          codigo_ibge: string;
          municipio: string;
          tipo_combustivel: TipoCombustivel;
          total_postos: number;
          valor_minimo: number;
          valor_maximo: number;
          valor_medio: number;
        };
      };
      v_estatisticas: {
        Row: {
          total_estabelecimentos: number;
          total_municipios: number;
          atualizado_em: string | null;
        };
      };
    };
    Functions: {
      limpar_historico_antigo: {
        Args: { dias_retencao?: number };
        Returns: number;
      };
    };
    Enums: {};
  };
}

// Tipos auxiliares para uso no app
export type Municipio = Database['public']['Tables']['municipios']['Row'];
export type Estabelecimento = Database['public']['Tables']['estabelecimentos']['Row'];
export type PrecoAtual = Database['public']['Tables']['precos_atuais']['Row'];
export type VendaHistorico = Database['public']['Tables']['vendas_historico']['Row'];
export type ColetaLog = Database['public']['Tables']['coletas_log']['Row'];

export type PrecoCompleto = Database['public']['Views']['v_precos_completos']['Row'];
export type ResumoMunicipioView = Database['public']['Views']['v_resumo_municipios']['Row'];
export type Estatisticas = Database['public']['Views']['v_estatisticas']['Row'];
