# Validação — Bioeconomia Lab v0.37.0-alpha

Data: 08/08/2026

## Resultado

VALIDAÇÃO ESTRUTURAL/UNITÁRIA: OK

## Testes

- CinematicCameraDirector unitário: OK
- Território: roteiro Cinema integrado
- Agroindústria: roteiro Cinema integrado
- Produção Animal: roteiro Cinema integrado
- Turismo: roteiro Cinema integrado
- JS node --check: 130 arquivos
- HTTP smoke: OK

- Botão Cinema global integrado.
- Quatro experiências 3D usam CinematicCameraDirector.
- Panorama 360 possui autopan Cinema.
- Controle manual encerra roteiro automático.
- Giro/Cardboard/WebXR encerram Cinema 360.
- Asset Composer usa apenas IDs registrados no AssetManager.
- Câmeras iniciais foram rebaixadas.
- GLBs elegíveis deixam de depender do perfil gráfico inicial para `castShadow`.
- JSON, imports, catálogos, assets e GLBs verificados.

## Limites

A v0.37 melhora composição, câmera e uso de assets existentes.

Ela não adiciona modelos fotorealistas novos e não transforma os panoramas ilustrados em fotografia 360.

A validação visual final ainda deve ser feita em navegador real/GitHub Pages, principalmente Android e projetor.
