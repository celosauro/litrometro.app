import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DownloadSimple, ShareNetwork, X } from '@phosphor-icons/react';
import { usePwaInstall } from '../contexts/PwaInstallContext';

const ALLOWED_ROUTES = new Set(['/', '/sobre']);

export function PwaInstallBanner() {
  const location = useLocation();
  const { isIOSInstruction, showInstallPrompt, dismissInstallPrompt, triggerInstall } = usePwaInstall();
  const [isInstalling, setIsInstalling] = useState(false);

  const shouldRenderOnRoute = ALLOWED_ROUTES.has(location.pathname);
  if (!shouldRenderOnRoute || !showInstallPrompt) return null;

  const handleInstall = async () => {
    if (isInstalling) return;

    setIsInstalling(true);
    const result = await triggerInstall();
    setIsInstalling(false);

    if (result === 'dismissed') {
      dismissInstallPrompt(7);
    }
  };

  const handleDismiss = () => {
    dismissInstallPrompt(90);
  };

  return (
    <div className="fixed left-0 right-0 top-[76px] z-[110] px-3 sm:px-4" role="status" aria-live="polite">
      <div className="mx-auto max-w-4xl rounded-xl border border-brand-200 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-brand-700 dark:bg-gray-800/95">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-brand-700 dark:text-brand-300">
            {isIOSInstruction ? <ShareNetwork size={20} weight="bold" /> : <DownloadSimple size={20} weight="bold" />}
          </div>

          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Instale o Litrômetro no seu celular</p>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              {isIOSInstruction
                ? 'No Safari, toque em Compartilhar e escolha Adicionar à Tela de Início.'
                : 'Instale o app para abrir mais rápido e usar em tela cheia.'}
            </p>

            <div className="mt-3 flex gap-2">
              {!isIOSInstruction && (
                <button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isInstalling ? 'Abrindo...' : 'Instalar app'}
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
              >
                Agora não
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
            aria-label="Fechar sugestão de instalação"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
