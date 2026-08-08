# Bioeconomia Lab — v0.42.0-alpha

Scaffold modular em HTML, CSS e JavaScript nativos, pronto para GitHub Pages.

## O que já funciona

- App Shell responsivo
- Router por hash
- Event Bus
- Module Registry
- Module Loader com `import()` dinâmico
- Catálogos JSON
- LocalStorage
- tema claro/escuro
- módulo Fundamentos
- módulo Profissão
- ferramenta Gestão Financeira
- Sandbox gráfico com ciclo de vida e FPS

## Executar localmente

Os catálogos usam `fetch()`. Portanto, não abra o `index.html` somente pelo `file://`.

Com Python:

```bash
python -m http.server 8000
```

Abra:

```text
http://localhost:8000
```

## Publicar no GitHub Pages

1. Crie um repositório.
2. Envie o **conteúdo desta pasta** para a raiz do repositório.
3. Abra `Settings → Pages`.
4. Selecione `Deploy from a branch`.
5. Selecione `main` e `/ (root)`.
6. Salve.

## Adicionar um módulo

Crie:

```text
modules/meu-modulo/
├── manifest.json
├── module.js
└── module.css
```

Depois adicione somente uma entrada em:

```text
modules/index.json
```

Não é necessário editar `app.js`.

## Tipos de pacote

- `module` — conteúdo didático
- `tool` — ferramenta
- `lab` — laboratório
- `experience` — experiência guiada

## Regra principal

> Se a pasta de um módulo for removida, o restante da plataforma deve continuar funcional.

## Próxima fase

A1 — Asset Pipeline:
- Asset Manager
- escopos de assets
- cache
- fallback
- variantes ECO/BALANCEADO/ALTO/ULTRA
- GLB/glTF
- preparação para Draco/KTX2


## Novidades v0.42.0-alpha

- `QualityManager` com perfis ECO / BALANCEADO / ALTO / ULTRA.
- `PerformanceManager` para sessões de FPS/tempo de quadro.
- `GraphicsAdapter` para Canvas responsivo e DPR limitado.
- Laboratório **Território Bioeconômico 360** — protótipo gráfico G1/2.5D.
- Laboratório **Cadeia Produtiva Interativa** — decisões e indicadores didáticos.
- Laboratório **Agroindústria Virtual** — planta interativa e fluxo de produção.
- Persistência local de progresso em laboratórios.
- Estruturas prontas para substituição futura por Three.js/GLB sem alterar o contrato dos módulos.

### Direção gráfica

Esta versão evita modelos 3D pesados de propósito. A lógica visual e pedagógica é validada primeiro.
A próxima etapa introduzirá o Asset Manager e o primeiro renderizador Three.js/GLB como melhoria progressiva.


## v0.42.0-alpha — primeira camada 3D real

Esta versão introduz:

- Asset Manager;
- GLTFLoader sob demanda;
- ThreeRuntime;
- Three.js por import map fixado;
- Território Bioeconômico 3D;
- Agroindústria Virtual 3D;
- Biodigestor Virtual 3D;
- fallback 2D.

### Testar fallback

Adicione:

```text
?force2d=1
```

antes do hash.

Exemplo:

```text
http://localhost:8000/?force2d=1#/lab/territorio-bioeconomico
```

Isso é útil para validar dispositivos sem WebGL ou testar a alternativa leve.


## v0.42.0-alpha — A3 / LOD / Turismo

Novidades:

- qualidade automática baseada em FPS;
- histerese e cooldown;
- LOD real;
- variantes de GLB por perfil gráfico;
- preparação Draco/KTX2;
- Turismo Sustentável 3D;
- fallback 2D preservado.

### Importante sobre Draco/KTX2

Nesta versão o pipeline está preparado, mas os assets do projeto ainda são pequenos e não justificam compressão real.
A compressão será aplicada quando entrarmos em modelos e texturas maiores, evitando complexidade desnecessária na fase inicial.


## v0.42.0-alpha — Produção + Scenario Engine

Novidades:

- Scenario Engine;
- cenários JSON;
- biblioteca compartilhada `Scene Kit`;
- Produção Vegetal 3D;
- Produção Animal Sustentável 3D;
- fallback 2D para ambos;
- correção do controle de qualidade automática no Dashboard.

### Nova forma de ampliar atividades

Em vários laboratórios, uma nova atividade poderá exigir apenas um novo objeto em `scenarios.json`, sem criar outro laboratório.


## v0.42.0-alpha — G2 + Missões + Evidências

Novidades:

- Scenario Engine V2;
- metas e limites;
- níveis de dificuldade;
- Evidence Manager;
- exportação de evidências JSON;
- Environment Pack compartilhado;
- Produção Vegetal G2;
- Produção Animal G2;
- integração conceitual Produção Animal → Biodigestor.

A plataforma agora começa a registrar não apenas o resultado da simulação, mas também a justificativa do estudante.


## v0.42.0-alpha — Economia Circular + Painel Curricular

Novidades:

- Economia Circular 3D;
- Flow Kit;
- integração entre laboratórios;
- Curriculum Progress Manager;
- Painel Curricular;
- progresso interno por unidade curricular;
- histórico de evidências.

### Importante

O progresso curricular apresentado é didático e local. Não representa nota oficial ou conclusão formal do componente curricular.


## v0.42.0-alpha — LabContext + Roteirização + G3

Novidades:

- LabContext entre laboratórios;
- Produção Animal envia resíduos ao Biodigestor;
- Produção Animal envia fluxo material à Economia Circular;
- Biodigestor e Economia Circular recebem e aplicam transferências;
- Roteirização Turística 3D;
- Território G3;
- Agroindústria G3;
- Painel Curricular mostra transferências pendentes.


## v0.42.0-alpha — Projeto Integrador + LabContext ampliado

Novidades:

- ProjectManager;
- Projeto Integrador de Bioeconomia;
- múltiplos projetos locais;
- importação de LabContext;
- associação de evidências;
- importação da Gestão Financeira;
- exportação JSON;
- Turismo → Roteirização;
- Agroindústria → Economia Circular.


## v0.42.0-alpha — Portfólio + Cadeia integrada + G4 inicial

Novidades:

- Território → Produção por LabContext;
- Produção Vegetal/Animal → Agroindústria;
- Agroindústria recebe lote produtivo;
- PortfolioExporter;
- relatório HTML do Projeto Integrador;
- impressão / salvar PDF pelo navegador;
- módulo Portfólio;
- correção da importação da Gestão Financeira;
- tanque industrial GLB G3/G4;
- quiosque territorial GLB G3/G4.


## v0.42.0-alpha — Associativismo + Marketing + G4

Novidades:

- Associativismo e Cooperativismo 3D;
- Marketing e Consumo Sustentável 3D;
- Agroindústria → Marketing;
- Associativismo → Projeto Integrador;
- Marketing → Projeto Integrador;
- Projeto Integrador com 8 eixos;
- mesa cooperativa GLB;
- expositor de produtos GLB;
- correção de paths relativos no Asset Manager.


## v0.42.0-alpha — Cadeia Integrada + Precificação

Novidades:

- IntegratedJourneyManager;
- Cadeia Produtiva Integrada 3D;
- passaporte do produto em 9 etapas;
- Precificação e Posicionamento;
- Marketing → Precificação;
- Precificação → Gestão Financeira;
- Gestão Financeira → Projeto Integrador;
- síntese da cadeia → Projeto Integrador;
- novos GLBs G4 de embalagem e estação da cadeia.


## v0.42.0-alpha — Scenario Engine MultiLab + Produto Persistente

Novidades:

- ProductPassportManager;
- MultiLabMissionEngine;
- produto persistente entre laboratórios;
- LabContext com `productId` e `missionSessionId`;
- evidências vinculadas automaticamente ao produto;
- Missão MultiLab;
- catálogo de missões mestras em JSON;
- projeto integrador criado e vinculado à missão;
- progresso por etapas;
- chip global do produto ativo;
- Cadeia Integrada filtrada pelo produto ativo;
- novos GLBs G4 de identidade do produto e missão.


## v0.42.0-alpha — Eventos e Consequências MultiLab

Novidades:

- MultiLabEventEngine;
- ConsequenceManager;
- eventos dinâmicos em missões;
- decisões com consequências persistentes;
- seca territorial;
- conflito de governança;
- variabilidade de lote;
- exigência de rastreabilidade;
- oscilação de demanda;
- efeitos reais em Produção, Agroindústria, Marketing, Precificação e Financeiro;
- chip global de consequências;
- Portfólio com consequências;
- novos assets G4 para eventos e decisões.


## v0.42.0-alpha — MultiLab V2 Ramificado

Novidades:

- MultiLabBranchEngine;
- decisões alteram a estrutura da missão;
- etapas corretivas obrigatórias;
- etapas bônus;
- etapa opcional pode tornar-se obrigatória;
- novo laboratório Soluções Sustentáveis 3D;
- reparação de governança;
- recuperação de qualidade;
- rota premium rastreável;
- novos assets G4 de bifurcação e soluções sustentáveis.


## v0.42.0-alpha — Branch V2 + Desempenho + Desfechos

Novidades:

- Branch Engine V2 orientado por indicadores;
- ramificações persistentes por desempenho;
- `waiveStage`;
- revisão sustentável;
- revisão de mercado;
- recuperação financeira;
- rota premium circular;
- Economia Circular agora gera `circularity-performance`;
- MissionOutcomeEvaluator;
- desfecho projetado em tempo real;
- desfecho final salvo na missão;
- endurecimento de UUID com `globalThis.crypto`;
- novos GLBs G4 de desempenho e desfecho.


## v0.42.0-alpha — Mapa 3D + Timeline + Relatório

Novidades:

- MissionTimelineManager;
- árvore visual 3D da Missão MultiLab;
- fallback 2D da árvore;
- linha do tempo cronológica;
- preview das últimas ações;
- MultiLabReportBuilder;
- módulo Relatório Final MultiLab;
- seleção de sessões históricas;
- exportação JSON;
- relatório HTML;
- impressão / salvar PDF no navegador;
- novos GLBs G4 de timeline e relatório.


## v0.42.0-alpha — Retomada + Comparador MultiLab

Novidades:

- MultiLabSessionHistory;
- retomada de sessões históricas;
- restauração automática do produto ativo;
- clonagem de estratégia;
- novo produto e projeto isolados na clonagem;
- MultiLabComparisonManager;
- módulo Histórico de Missões;
- módulo Comparador MultiLab;
- comparação de 6 pilares;
- comparação de eventos, branches, consequências e evidências;
- insights comparativos;
- exportação JSON e HTML;
- novos GLBs G4 para retomada e comparação.


## v0.42.0-alpha — 360 + início do realismo G4/G5

Novidades:

- Panorama360Engine compartilhado;
- Asset Manager com texturas/panoramas;
- laboratório Exploração Bioeconomia 360;
- Território 360;
- Agroindústria 360;
- hotspots projetados;
- arrastar/pinça/scroll;
- transição 360 ↔ 3D;
- panoramas locais 2K/4K;
- Save-Data → panorama ECO;
- Realism Kit;
- superfícies procedurais;
- sky dome;
- tone mapping;
- sombras adaptativas;
- upgrade visual de Território e Agroindústria.


## v0.42.0-alpha — G5 + PBR + Áudio + Consequências Visuais

Novidades:

- vegetação G5 instanciada;
- gramíneas e árvores com variação;
- biblioteca PBR local;
- solo/concreto/metal com basecolor, normal e roughness;
- equipamentos agroindustriais detalhados;
- AmbientAudioManager;
- som ambiente no 3D e 360;
- feedback visual das consequências MultiLab;
- rio/culturas reagem a efeitos produtivos;
- Agroindústria reage a qualidade/embalagem;
- correção do `markDone` da Agroindústria.


## v0.42.0-alpha — IBL + Vegetação G5 Expandida + Áudio Posicional + Animação Industrial

Novidades:

- EnvironmentLightingManager;
- IBL local por PMREM;
- IBL exterior e industrial;
- vegetação G5 em Produção Vegetal, Turismo e Roteirização;
- gramíneas e copas em duas camadas;
- Industrial Animation Kit;
- correia, embalagens, líquidos, válvula e ventilação;
- SpatialAudioManager;
- sons dos equipamentos com distância e stereo pan;
- Agroindústria com áudio ambiente e áudio posicional independentes.


## v0.42.0-alpha — Gyro Orientado + LOD + Água Reativa + Cardboard

Novidades:

- correção de giroscópio por orientação da tela;
- recalibração portrait/landscape;
- Cardboard estéreo experimental;
- DynamicLODManager;
- LOD de espécies;
- LOD de equipamentos agroindustriais;
- água G5 reativa às consequências;
- AdaptiveEffectBudget;
- partículas da Economia Circular adaptativas ao FPS.


## v0.42.0-alpha — Quality Governor + Sombras Adaptativas + WebXR Progressivo

Novidades:

- RuntimeQualityGovernor;
- sombras adaptativas;
- shadow maps dinâmicos;
- auto quality com histerese maior;
- aba oculta ignorada;
- LOD no Turismo;
- LOD nas nove estações da Cadeia Integrada;
- IBL na Cadeia Integrada;
- WebXR progressive enhancement no panorama 360;
- WebXR aparece somente quando `immersive-vr` é suportado.


## v0.42.0-alpha — Instancing + Shadow Regions + Marketing/Associativismo G6

Novidades:

- InstancedObjectFactory;
- SceneComplexityBudget;
- ShadowRegionManager;
- Marketing G6 com LOD e embalagens instanciadas;
- Associativismo G6 com membros instanciados;
- Turismo com portal G6 e marcadores de trilha instanciados;
- Cadeia Integrada com hub G6 e beacons instanciados;
- correção do isolamento de transferências por produto;
- correção do botão Atualizar Jornada.


## v0.42.0-alpha — Telemetria e Diagnóstico Gráfico

Novidades:

- GraphicsTelemetryManager;
- captura automática de métricas em viewports Three.js;
- histórico local de até 80 sessões;
- FPS, frame time e P95;
- draw calls;
- triângulos;
- texturas;
- geometrias;
- objetos;
- DPR;
- diagnóstico automático de gargalos;
- módulo Diagnóstico Gráfico G6;
- comparação observada ECO/BALANCEADO/ALTO/ULTRA;
- exportação JSON;
- HUD técnico em oito laboratórios G6.


## v0.42.0-alpha — Budgets + Baseline + Regressão + Benchmark G6

Novidades:

- GraphicsBudgetCatalog;
- budgets específicos para oito laboratórios G6;
- budgets diferenciados por perfil;
- GraphicsBenchmarkManager;
- matriz de benchmark 8 × 4;
- cobertura automática;
- ranking de cenas pesadas;
- índice de custo;
- baseline por versão;
- regressão antes/depois;
- identificação de melhorias;
- histórico de custo por versão;
- telemetria com `appVersion`.


## v0.42.0-alpha — Baseline Visual + Budgets Versionados + Relatório de Regressão

Novidades:

- GraphicsBudgetStore;
- budgets persistentes por versão;
- GraphicsVisualBaselineManager;
- captura real do canvas 3D em 320×180;
- galeria visual no Diagnóstico Gráfico;
- GraphicsRegressionReportBuilder;
- relatório HTML;
- GraphicsOptimizationQueue;
- fila de otimização baseada em regressão/ranking;
- Diagnóstico Gráfico v0.3.


## v0.42.0-alpha — Benchmark Guiado + Performance Gate

Novidades:

- GuidedBenchmarkManager;
- teste rápido ECO×ULTRA com 16 passos;
- teste completo com 32 passos;
- troca automática de perfil;
- banner com cronômetro;
- retomada persistente;
- validação por telemetria real;
- detecção de sessão curta;
- Performance Gate;
- fila de otimização bloqueada até cobertura mínima;
- Diagnóstico Gráfico v0.4.


## v0.42.0-alpha — Benchmark Bundle + Device Profile

Novidades:

- DeviceProfileManager;
- nome amigável do dispositivo;
- telemetria com deviceId/deviceClass;
- BenchmarkBundleManager;
- exportação/importação JSON;
- pacote opcional com miniaturas;
- merge sem duplicar sessões;
- Benchmark Guiado com botão Concluir etapa;
- correção da API do QualityManager;
- Diagnóstico Gráfico v0.5.


## v0.42.0-alpha — Session Bundle + Inspeção Histórica + Confiança

Novidades:

- MultiLabInspectionManager;
- relatório histórico sem alterar sessão ativa;
- MultiLabSessionBundleManager;
- export/import completo de sessão;
- remapeamento de IDs em colisões;
- `MultiLabMissionEngine.createSession`;
- clonagem sem escrita bruta nas chaves internas;
- Outcome completeness/confidence;
- pilares observados × estimados;
- Comparator V2 com cautela para dados incompletos.


## v0.42.0-alpha — Timeline V2 + Branch Provenance V3

Novidades:

- Timeline V2;
- evento disparado × resolvido;
- consequências na timeline;
- stage-complete sintético;
- correções explícitas;
- evidência estritamente por sessão;
- branch provenance;
- metric snapshots;
- catalog version;
- prioridades e conflitos determinísticos;
- correção válida somente após ativação;
- Comparator V3.


## v0.42.0-alpha — Immersive First

Mudança de prioridade:

- nova Home visual;
- Central de Experiências;
- navegação reduzida;
- 360 em tela ampla;
- 3D canvas-first;
- sidebar oculta durante a exploração;
- painéis em gavetas;
- controles como overlays compactos;
- classificação honesta entre experiência 3D, simulação 3D e panorama 360 ilustrado;
- ferramentas administrativas preservadas, mas fora do primeiro plano.


## v0.42.0-alpha — Ambientes G7

Melhorias visuais focadas nos quatro ambientes de Experiência 3D:

- Território G7;
- Agroindústria G7;
- Produção Animal G7;
- Turismo G7;
- nova biblioteca `immersive-environment-g7.js`;
- objetos repetidos com instancing;
- elementos ambientais animados;
- visitantes mais reconhecíveis;
- HUD técnico oculto durante a exploração;
- correção de runtime do loop da Agroindústria.


## v0.42.0-alpha — Cinematic G8

- câmera em escala mais humana;
- modo Cinema global;
- roteiros cinematográficos nos quatro ambientes imersivos;
- panorâmica Cinema no 360;
- Asset Composer G8;
- reaproveitamento de GLBs locais;
- correção de sombras dependentes do perfil inicial;
- exposição ACES por ambiente;
- vinheta visual leve no canvas.


## v0.42.0-alpha — Detail Layer G9

- microdetalhes PBR nos quatro ambientes imersivos;
- atmosfera/fog por ambiente;
- lavoura/estrada/pedras no Território;
- segurança/drenagem/tubulação na Agroindústria;
- lama/piso/cerca/marcas na Produção Animal;
- trilha/passarela/pedras/sub-bosque no Turismo;
- densidade adaptativa por perfil/runtime;
- sem novas dependências externas.


## v0.42.0-alpha — Walk Mode G10

- primeira pessoa nos quatro ambientes imersivos;
- câmera a ~1,62 m;
- joystick virtual para Android;
- WASD e setas;
- arraste para olhar;
- limites simples de circulação;
- blockers 2D;
- Cinema e Caminhar mutuamente exclusivos;
- botão global Caminhar.


## v0.42.0-alpha — Proximity Interactions G11

- interações por aproximação durante o modo Caminhar;
- tecla E no desktop;
- botão TOQUE no celular;
- marcadores discretos 3D;
- pulso visual;
- card contextual sob demanda;
- Território integrado ao progresso real;
- Agroindústria integrada à sequência real;
- Produção Animal e Turismo com ações contextuais;
- memória local dos pontos visitados.


## v0.42.0-alpha — Interactive Environment G12

- ações visuais imediatas por proximidade;
- bomba e irrigação no Território;
- estações animadas na Agroindústria;
- ventilação, água, efluentes e alimentação na Produção Animal;
- portal, trilha, lagoa, mirante e centro no Turismo;
- efeitos leves e adaptativos;
- integração preservada com selectZone/selectStation.


## v0.42.0-alpha — Spatial Feedback G13

- cues curtos posicionais;
- estado operacional nos cards de interação;
- SpatialAudioManager V2;
- Agroindústria com som contínuo somente nas máquinas acionadas;
- volume e distância controlados;
- sem HRTF completo;
- estado operacional separado de consequências curriculares.
