#!/bin/bash
# Script para gerar ícones PNG a partir dos SVGs
# Requer: ImageMagick (convert) ou librsvg (rsvg-convert)
# Instalar: sudo apt install imagemagick librsvg2-bin

set -e

cd "$(dirname "$0")"

echo "🎨 Gerando ícones PWA..."

# Verificar qual ferramenta está disponível
if command -v rsvg-convert &> /dev/null; then
    echo "Usando rsvg-convert..."
    
    # icon-192.png
    rsvg-convert -w 192 -h 192 icon-192.svg -o icon-192.png
    echo "✅ icon-192.png criado"
    
    # icon-512.png
    rsvg-convert -w 512 -h 512 icon-512.svg -o icon-512.png
    echo "✅ icon-512.png criado"
    
    # apple-touch-icon.png (180x180)
    rsvg-convert -w 180 -h 180 apple-touch-icon.svg -o apple-touch-icon.png
    echo "✅ apple-touch-icon.png criado"
    
elif command -v convert &> /dev/null; then
    echo "Usando ImageMagick..."
    
    # icon-192.png
    convert -background none -resize 192x192 icon-192.svg icon-192.png
    echo "✅ icon-192.png criado"
    
    # icon-512.png  
    convert -background none -resize 512x512 icon-512.svg icon-512.png
    echo "✅ icon-512.png criado"
    
    # apple-touch-icon.png (180x180)
    convert -background none -resize 180x180 apple-touch-icon.svg apple-touch-icon.png
    echo "✅ apple-touch-icon.png criado"
    
else
    echo "❌ Erro: Nenhuma ferramenta de conversão encontrada!"
    echo ""
    echo "Instale uma das opções:"
    echo "  Ubuntu/Debian: sudo apt install librsvg2-bin"
    echo "  macOS: brew install librsvg"
    echo "  Ou use um conversor online como https://svgtopng.com"
    exit 1
fi

echo ""
echo "🎉 Todos os ícones PWA foram gerados!"
echo ""
echo "Arquivos criados:"
ls -la *.png 2>/dev/null | grep -E "icon-|apple-touch"
