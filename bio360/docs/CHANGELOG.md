# Changelog

## 0.42.0-alpha — 2026-08-08

### Spatial Feedback G13
- `SpatialAudioManager` evoluiu sem quebrar a API anterior.
- Novo `playCue()` para feedback sonoro curto e posicional.
- Usa Web Audio API + StereoPanner quando disponível.
- O volume considera distância e o volume ambiente salvo.
- Não é áudio binaural/HRTF.

### Action Feedback G13
- Nova biblioteca `action-feedback-g13.js`.
- Escuta `immersive:environment-action`.
- Mantém estado operacional local por ação.
- Toca cue no ponto 3D da ação.
- Expõe estado:
  - ligado;
  - desligado;
  - ativo;
  - em espera.

### Cards por proximidade
- O card agora pode mostrar um bloco discreto de estado operacional.
- Exemplo:
  - Bomba de água — Fluxo local ligado;
  - Lavagem — Lavagem em operação;
  - Aeração — Aeração em operação.
- O bloco existe somente depois da interação e não vira HUD permanente.

### Agroindústria
- Sons contínuos dos equipamentos agora começam inativos.
- `washing` liga/desliga a fonte `wash`.
- `processing` controla `process`.
- `filling` controla `fill`.
- `cold-storage` controla `cold`.
- O botão “sons dos equipamentos” continua sendo opt-in.
- Quando habilitado, somente máquinas acionadas produzem o hum posicional.

### Separação curricular
- Estado operacional G13 não é gravado como consequência MultiLab.
- Ligar uma bomba visualmente não cria automaticamente ganho hídrico curricular.
- Acionar uma máquina não equivale a concluir evidência.
- A separação evita transformar feedback visual/sonoro em resultado pedagógico inventado.


## 0.41.0-alpha — 2026-08-08

### Interactive Environment G12
- Nova biblioteca `interactive-environment-g12.js`.
- A interação por proximidade agora pode produzir mudança visual imediata no 3D.
- As ações podem ser:
  - toggle persistente durante a sessão;
  - ativação temporária;
  - animação contínua.

### Território
Ações visuais:
- bomba/fluxo de água;
- irrigação da área produtiva;
- balizadores da área comunitária;
- fluxo circular na área de resíduos.

A interação continua chamando `selectZone()` antes da ação visual.

### Agroindústria
Ações:
- recebimento com caixas em movimento;
- lavagem com gotas;
- processamento com rotor;
- envase com embalagens;
- armazenamento refrigerado com fan/mist;
- fluxo de resíduos/subprodutos.

A interação continua respeitando `selectStation()` e sua sequência didática.

### Produção Animal
Ações:
- ventiladores do abrigo;
- fluxo de água;
- aeração do tratamento de efluentes;
- destaque da linha de alimentação.

### Turismo
Ações:
- abrir/fechar barreira do portal;
- iluminação de orientação da trilha;
- ponto de amostragem da lagoa;
- destaque do mirante;
- painel do centro de visitantes.

### Performance
- Todos os efeitos são geometrias leves.
- Efeitos repetidos são limitados pelo `runtime.scale`.
- Ações temporárias são desligadas automaticamente.
- Não foi adicionada física, pós-processamento ou biblioteca externa.


## 0.40.0-alpha — 2026-08-08

### Proximity Interactions G11
- Nova biblioteca `proximity-interaction-manager-g11.js`.
- Interações aparecem somente enquanto o modo Caminhar está ativo.
- Marcadores 3D permanecem discretos e só aparecem quando o usuário chega a uma distância útil.
- O ponto mais próximo habilita uma ação compacta `Interagir`.

### Controles
Desktop:
- tecla `E`;
- clique no prompt.

Celular:
- botão de interação com rótulo `TOQUE`.

### Feedback visual
- anel 3D;
- pequeno halo animado;
- pulso após a interação;
- pontos já visitados ficam mais discretos.

### Informação sob demanda
- A informação não fica permanentemente sobre o canvas.
- Ao interagir abre um card curto:
  - nome;
  - resumo;
  - até três observações;
  - ação contextual.
- O usuário pode fechar e continuar caminhando.

### Território
- Os oito pontos territoriais viraram interações de proximidade.
- Interagir usa a mesma função `selectZone()`.
- Portanto a aproximação realmente conta para:
  - progresso;
  - diagnóstico;
  - estado persistente de pontos investigados.

### Agroindústria
- Todas as estações do processo ganharam proximidade.
- A interação usa a mesma `selectStation()`.
- A sequência correta continua sendo validada.
- Aproximar e interagir substitui a necessidade de acertar o clique em um objeto pequeno.

### Produção Animal
Interações em:
- abrigo;
- ponto de água;
- tratamento de efluentes;
- torre d’água.

Os cards podem abrir diretamente a gaveta de ferramentas para ajustar o cenário.

### Turismo
Interações em:
- portal;
- trilha;
- lagoa;
- mirante;
- centro de visitantes.

### Persistência
- IDs dos pontos já interagidos são salvos por laboratório.
- Isso apenas controla memória visual de exploração.
- Não substitui evidência curricular nem conclusão de missão.


## 0.39.0-alpha — 2026-08-08

### Walk Mode G10
- Nova biblioteca `first-person-explorer-g10.js`.
- Os quatro ambientes classificados como Experiência 3D agora podem alternar entre:
  - câmera orbital;
  - Cinema;
  - Caminhar em primeira pessoa.

### Controles
Desktop:
- W / S: frente e trás;
- A / D: lateral;
- setas também funcionam;
- arrastar sobre o canvas altera direção;
- Esc sai do modo Caminhar.

Celular:
- joystick virtual no canto inferior esquerdo;
- arrastar sobre o restante do canvas para olhar;
- botão “Sair do caminhar”.

### Altura humana
- Câmera de caminhada: aproximadamente 1,62 m.
- O modo Caminhar não reutiliza o enquadramento orbital alto.

### Limites
- Cada ambiente possui área de circulação própria.
- Existem blockers 2D leves em estruturas maiores.
- O sistema não afirma colisão física completa.
- O objetivo é impedir atravessamentos óbvios sem adicionar engine de física.

### Cinema × Caminhar
- Ativar Caminhar encerra Cinema.
- Ativar Cinema encerra Caminhar.
- O controle manual do Cinema continua funcionando normalmente.

### Interface
- Novo botão global “Caminhar”.
- Só aparece nas quatro Experiências 3D.
- Não aparece em simuladores 3D ou no panorama 360.
- Retículo e joystick só existem durante o modo Caminhar.


## 0.38.0-alpha — 2026-08-08

### Detail Layer G9
- Nova biblioteca `environment-detail-layer-g9.js`.
- A camada é carregada somente nos quatro ambientes imersivos.
- Usa os materiais PBR locais já existentes.
- A quantidade de microdetalhes responde ao perfil gráfico e ao runtime scale.

### Atmosfera e profundidade
- FogExp2 leve e específico por ambiente.
- ECO usa densidade um pouco maior para esconder horizonte simples com menor custo.
- ALTO/ULTRA preservam maior distância visual.
- Nenhum pós-processamento pesado foi adicionado.

### Território G9
- área de lavoura PBR;
- linhas de cultivo;
- trecho de estrada de terra;
- pedras dispersas;
- vegetação de borda;
- pequeno bueiro/tubulação;
- detalhes reduzem a sensação de chão vazio.

### Agroindústria G9
- faixas de segurança;
- canaletas de drenagem;
- bollards;
- rack de tubulação;
- tapetes industriais;
- área de piso técnico PBR.

### Produção Animal G9
- áreas de solo/lama;
- piso de alimentação;
- cerca de manejo;
- trilha de marcas;
- vegetação de borda;
- integração com materiais PBR de solo/concreto/madeira/vegetação.

### Turismo G9
- piso-base trocado de material plano para PBR de vegetação;
- trilha de solo PBR;
- pedras de passagem;
- pequena passarela de madeira;
- sub-bosque;
- barreira de corda;
- atmosfera de profundidade.

### Controle de desempenho
- Detalhes repetidos usam InstancedMesh quando apropriado.
- `runtime.scale` controla quantos detalhes permanecem visíveis.
- Perfil ECO nasce com densidade menor.
- Nenhuma nova dependência de rede.


## 0.37.0-alpha — 2026-08-08

### Cinematic G8
- Nova biblioteca `cinematic-camera-director.js`.
- Câmera inicial dos quatro ambientes imersivos foi rebaixada para uma leitura mais próxima da escala humana.
- Novo botão global `Cinema` na experiência.
- O modo Cinema:
  - percorre pontos de vista pré-definidos;
  - usa transição suave;
  - é interrompido automaticamente quando o usuário começa a controlar a câmera;
  - funciona igualmente para professor em projetor ou exploração individual.

### Roteiros cinematográficos
Território:
- visão geral;
- produção;
- água;
- comunidade;
- agroindústria;
- turismo.

Agroindústria:
- visão geral;
- recebimento;
- lavagem;
- processo;
- envase;
- armazenamento refrigerado.

Produção Animal:
- visão geral;
- animais;
- abrigo;
- água;
- resíduos;
- torre d'água.

Turismo:
- visão geral;
- portal;
- trilha;
- lagoa;
- mirante;
- centro de visitantes.

### Cinema 360
- O mesmo botão global ativa panorâmica automática suave no panorama 360.
- Movimento manual interrompe o Cinema.
- Giro, Cardboard e WebXR interrompem o Cinema para não disputar controle de câmera.

### Asset Composer G8
- Nova biblioteca `immersive-asset-composer-g8.js`.
- Reaproveita GLBs locais já existentes e variantes por qualidade.
- Território:
  - pedestal informativo;
  - caixas produtivas.
- Agroindústria:
  - embalagens;
  - caixas de carga.
- Produção Animal:
  - abrigo animal;
  - tratamento de efluentes.
- Turismo:
  - pedestal;
  - quiosque local.

### Sombras
- GLBs elegíveis dos ambientes imersivos mantêm `castShadow=true`.
- O custo continua sendo controlado pelo shadow map/renderizador e pelo RuntimeQualityGovernor.
- Isso corrige o caso em que abrir inicialmente no perfil ECO podia impedir sombras depois de subir para ALTO/ULTRA.

### Composição
- Pequena vinheta visual foi adicionada apenas no canvas imersivo.
- Exposição ACES foi ajustada individualmente para os quatro ambientes.
- O objetivo é reduzir a sensação de “maquete vista de cima” sem adicionar novos painéis.


## 0.36.0-alpha — 2026-08-08

### Ambientes G7
- Nova biblioteca compartilhada `immersive-environment-g7.js`.
- A fase não adiciona novos relatórios ou módulos administrativos.
- O objetivo é aumentar presença espacial, escala e reconhecimento visual dos quatro ambientes classificados como Experiência 3D.

### Território G7
- Horizonte vegetal adicional.
- Cerca de produção.
- Linha de postes/infraestrutura.
- Bomba eólica rural animada.
- Veículo de serviço em movimento.
- Sinalização ambiental.
- Aves animadas.
- Câmera com limites mais próximos do terreno.
- Labels dos hotspots viraram ícones compactos para reduzir texto sobre a cena.

### Agroindústria G7
- Estrutura interna ampliada:
  - vigas;
  - colunas;
  - janelas/luz;
  - área de carga.
- Pallets instanciados.
- Empilhadeira animada.
- Vapor/condensação leve.
- Sinalização industrial.
- Corrigido bug no loop que referenciava `runtime` antes de defini-lo.
- Runtime governor volta a controlar LOD e densidade ambiental.

### Produção Animal G7
- Horizonte vegetal.
- Fardos de alimentação.
- Torre d'água.
- Bomba eólica.
- Estrada de serviço.
- Trator/veículo animado.
- Aves ambientais.
- Mantidos animais GLB, instalações por espécie e água animada.

### Turismo G7
- Visitantes deixaram de ser pontos luminosos e passaram a ter figuras humanas simplificadas.
- Guarda-corpos/trilha.
- Bancos.
- Sinalização.
- Vegetação de margem.
- Canoa animada.
- Aves ambientais.
- Câmera ajustada para leitura espacial do atrativo.

### Limpeza visual
- HUD técnico de FPS/draw calls fica oculto dentro do modo imersivo.
- HUD do panorama 360 desaparece após o carregamento bem-sucedido.
- Dados técnicos continuam sendo coletados pela telemetria em segundo plano.


## 0.35.0-alpha — 2026-08-08

### Immersive First
- A prioridade visual da plataforma foi invertida.
- Home deixou de listar todos os módulos, ferramentas e relatórios.
- A primeira ação agora é entrar em uma experiência 360/3D.
- Relatórios, currículo, diagnóstico e histórico foram movidos para hubs secundários.

### Nova navegação
A navegação principal passou a ter somente:
- Início;
- Explorar;
- Simular;
- Missões;
- Meu trabalho;
- Mais.

Os 14 laboratórios e demais módulos continuam registrados no sistema, mas não ocupam simultaneamente a navegação principal.

### Central de Experiências
- Nova rota `/explorar`.
- Destaque grande para Exploração Bioeconomia 360.
- Experiências classificadas honestamente:
  - Panorama 360 ilustrado;
  - Experiência 3D;
  - Simulação 3D;
  - Simulador.
- O sistema não chama panorama ilustrado de fotografia 360.

### Home reconstruída
- Hero visual usando panorama local.
- CTA principal “Entrar na experiência 360”.
- Quatro experiências 3D em destaque.
- Apenas três caminhos secundários:
  - Simular;
  - Missões;
  - Meu trabalho.

### Canvas-first para 3D
- Rotas 3D passam para layout amplo quando WebGL realmente está ativo.
- Sidebar é ocultada durante a experiência.
- Cabeçalhos extensos são ocultados.
- Canvas ocupa praticamente toda a área abaixo da topbar.
- Painéis laterais ficam em gaveta.
- Botão global “Ferramentas” abre/fecha a gaveta.
- Toolbars e seleção de cenário viram overlays compactos.
- Se o laboratório cair em fallback 2D, o modo canvas-first é removido.

### 360 em tela ampla
- Panorama ocupa toda a área útil.
- Texto explicativo permanente foi removido da frente da cena.
- Informações aparecem em drawer.
- Hotspot abre automaticamente o drawer.
- Controles compactos no rodapé:
  - recenter;
  - gyro;
  - áudio;
  - Cardboard;
  - WebXR quando suportado;
  - informação;
  - entrar no 3D.
- Troca de cena fica em uma barra compacta superior.
- Nota de realismo foi movida para Configurações.


## 0.34.0-alpha — 2026-08-08

### Timeline V2
- `MissionTimelineManager` passou para schema V2.
- Evento agora gera dois registros distintos:
  - `event-trigger`;
  - `event-resolution`.
- Consequências persistentes entraram explicitamente na timeline.
- Correções de branch recebem item próprio `correction`.
- Conclusões de etapa geram eventos sintéticos `stage-complete`.
- Evidências passaram a usar escopo estrito por `missionSessionId`.
- Ordenação de empates usa:
  1. timestamp;
  2. prioridade de tipo;
  3. ID estável.

### Proveniência de Branch V3
- Ativações agora registram:
  - versão/schema do catálogo;
  - prioridade;
  - sticky;
  - targetStageId;
  - action snapshot;
  - condition snapshot;
  - source records;
  - sourceAt;
  - métricas reais usadas na ativação.
- Predicados `transferMetric` guardam:
  - transferId;
  - path;
  - actual;
  - operator;
  - expected.
- `eventChoice` guarda occurrenceId e escolha.
- `evidenceCount` guarda contagem e IDs observados.

### Conflitos determinísticos
- Regras são aplicadas por prioridade crescente.
- Regra de maior prioridade é aplicada por último.
- Empate é resolvido por ID estável.
- O engine retorna grupos de conflito por etapa.
- `perf-governanca-robusta-dispensa` recebeu prioridade alta para dispensar corretamente uma reparação quando os indicadores justificarem.

### Correções somente depois da ativação
- Etapas criadas por `addStage`/`addOptionalStage` recebem `branchActivatedAt`.
- Uma transferência corretiva anterior à ativação não conclui a etapa.
- O usuário recebe mensagem indicando que precisa registrar nova correção após a ramificação.
- `correctionStateForActivation()` informa:
  - pendente/concluída;
  - transfer válido;
  - registros anteriores ignorados.

### Eventos com proveniência
- Ocorrências guardam:
  - versão do catálogo;
  - triggerStageId;
  - triggerStageCompletedAt;
  - triggerSource;
  - triggerTransferId;
  - decisionLatencyMs.

### Relatório e Comparador
- Relatório mostra relações causais da timeline.
- Seção de proveniência das branches.
- Correções e conflitos de regra visíveis.
- Comparador V3 mostra:
  - decisões de eventos;
  - branches exclusivas;
  - correções pós-ativação;
  - resultado/margem financeiros;
  - insights de divergência de percurso.


## 0.33.0-alpha — 2026-08-08

### Inspeção histórica não destrutiva
- Novo `MultiLabInspectionManager`.
- Relatórios históricos não chamam mais `multilab.setActive`.
- Selecionar outra sessão no Relatório altera somente o contexto de inspeção.
- A missão e o produto ativos permanecem intactos.
- O relatório mostra claramente quando está em modo histórico.
- Existe ação explícita “Retomar esta sessão” quando o usuário realmente deseja torná-la ativa.

### Session Bundle completo
- Novo `MultiLabSessionBundleManager`.
- Exporta uma sessão completa em JSON:
  - sessão;
  - produto/passaporte;
  - projeto;
  - transferências;
  - evidências;
  - consequências;
  - ramificações;
  - eventos;
  - resumo de relatório.
- Importação valida schema.
- Colisão de IDs cria cópia com remapeamento de:
  - sessionId;
  - productId;
  - projectId;
  - transferIds;
  - evidenceIds;
  - consequence/effectIds;
  - event occurrence IDs;
  - branch IDs.
- A sessão importada entra como histórica/inspeção e não substitui automaticamente a missão ativa.

### Clonagem sem escrita bruta
- `MultiLabMissionEngine` ganhou `createSession(...)` público.
- `start(...)` agora delega à API pública.
- `MultiLabSessionHistory.cloneAsNew(...)` não escreve mais diretamente nas chaves internas do engine.

### Desfecho com completude e confiança
- `MissionOutcomeEvaluator` não trata mais dados ausentes como se fossem observados.
- Os seis pilares mantêm valor projetado para compatibilidade, mas cada pilar registra:
  - `observed`;
  - `estimated`;
  - fonte;
  - quantidade de métricas;
  - nota explicativa.
- Novo:
  - `completenessPercent`;
  - `confidence`;
  - `confidenceLabel`;
  - `observedPillars`;
  - `missingPillars`;
  - `scoreStatus`;
  - `statusLabel`.
- Apenas missão concluída com 100% dos seis pilares observados recebe “Desfecho final”.
- Demais casos ficam explicitamente como “Desfecho projetado”.

### Comparator V2
- Completude entrou nos indicadores comparativos.
- Comparações com menos de 50% de completude em uma das estratégias não declaram vencedora.
- Diferenças relevantes de completude geram insight explícito.
- Cards mostram confiança e percentual de dados.


## 0.32.0-alpha — 2026-08-08

### Perfil do dispositivo
- Novo `DeviceProfileManager`.
- Registra localmente:
  - classe do dispositivo;
  - memória exposta pelo navegador;
  - núcleos expostos;
  - tela;
  - DPR;
  - touch;
  - plataforma.
- Permite nome amigável como “Moto G34” ou “PC Sala 2”.
- Não utiliza endereço, conta ou identificadores externos.

### Benchmark Bundle
- Novo `BenchmarkBundleManager`.
- Exporta JSON contendo:
  - telemetria;
  - benchmark;
  - baselines;
  - budgets versionados;
  - progresso do Benchmark Guiado;
  - perfil do dispositivo;
  - metadados das capturas visuais.
- Opção separada para incluir as imagens em base64.
- Importação valida schema e tipo do pacote.
- Merge por `sessionId` e `baseline.id`.
- Evita duplicação.
- Pacote permite coletar no celular e analisar depois em outro navegador/instalação.

### Telemetria por dispositivo
- Novas sessões registram:
  - `deviceId`;
  - `deviceClass`.
- Isso melhora a leitura de comparações entre hardwares.

### Benchmark Guiado mais fluido
- Corrigida integração com a API real do QualityManager (`set`).
- Banner ganhou:
  - tempo mínimo;
  - botão “Concluir etapa”;
  - botão “Voltar sem concluir”.
- Concluir só é liberado após o tempo mínimo.
- O dispose do laboratório continua sendo a fonte autoritativa da telemetria.

### Diagnóstico Gráfico v0.5
- Painel do dispositivo.
- Renomear dispositivo.
- Atualizar detecção.
- Exportar pacote.
- Exportar pacote com imagens.
- Importar pacote e visualizar resumo antes do merge.


## 0.31.0-alpha — 2026-08-08

### Benchmark Guiado G6
- Novo `GuidedBenchmarkManager`.
- Dois planos:
  - rápido: 8 cenas × ECO/ULTRA = 16 passos;
  - completo: 8 cenas × 4 perfis = 32 passos.
- Cada passo:
  - define automaticamente o perfil gráfico;
  - abre o laboratório correto;
  - registra início;
  - aguarda a sessão de telemetria;
  - valida cena/perfil/versão;
  - exige tempo mínimo proporcional ao alvo;
  - marca concluído ou tempo insuficiente.
- Progresso persistente por versão.

### Banner de benchmark
- Novo `guided-benchmark-banner.js`.
- Durante um passo ativo mostra:
  - perfil;
  - laboratório;
  - tempo medido;
  - alvo;
  - progresso;
  - botão para retornar ao Diagnóstico Gráfico.

### Performance Gate
- Novo gate para impedir otimização por suposição.
- Considera:
  - cobertura rápida ECO×ULTRA;
  - cobertura total;
  - baseline anterior;
  - pares comparáveis.
- A fila de otimização só é liberada quando há cobertura mínima.
- Estados:
  - blocked;
  - ready-ranking;
  - ready-regression.

### Critério inicial do gate
- ECO×ULTRA ≥ 75%;
- cobertura total ≥ 25%;
- regressão exige baseline anterior e pelo menos 4 pares equivalentes.

### Diagnóstico Gráfico v0.4
- Benchmark Guiado.
- Performance Gate.
- Sequência completa visível.
- Retomada automática.
- Fila de otimização bloqueada enquanto não houver dados suficientes.


## 0.30.0-alpha — 2026-08-08

### Budgets versionados e persistentes
- Novo `GraphicsBudgetStore`.
- Cada versão recebe uma cópia persistente dos 32 budgets cena/perfil.
- Ajustes futuros não alteram retroativamente versões anteriores.
- `GraphicsBenchmarkManager` consulta o budget da versão correspondente à sessão.

### Baseline visual real
- Novo `GraphicsVisualBaselineManager`.
- ThreeRuntime tenta capturar uma miniatura real do `renderer.domElement` antes do dispose.
- JPEG 320×180, comprimido e limitado a 24 capturas locais.
- Uma captura substitui a anterior da mesma combinação versão/cena/perfil.
- Galeria integrada ao Diagnóstico Gráfico.

### Relatório automático de regressão
- Novo `GraphicsRegressionReportBuilder`.
- Exporta HTML independente com cobertura, PASS/WARN/FAIL, baseline comparado, maiores regressões e recomendações.
- As imagens completas não são embutidas no relatório; somente metadados do baseline visual.

### Fila de otimização orientada por dados
- Novo `GraphicsOptimizationQueue`.
- Prioridades são geradas primeiro por regressões comparáveis e depois por cenas fora do budget.
- Sem medições suficientes, a fila permanece vazia.
- Status: pendente, em andamento, concluído e ignorado.

### Diagnóstico Gráfico v0.3
- Galeria de baseline visual.
- Budgets persistidos da versão atual.
- Relatório HTML de regressão.
- Fila de otimização com status.
- Mantidos benchmark, ranking, baseline técnico e histórico por versão.


## 0.29.0-alpha — 2026-08-08

### Budgets específicos por laboratório
- Novo `GraphicsBudgetCatalog`.
- Oito cenas G6 possuem budgets próprios.
- Cada budget varia também por perfil:
  - ECO;
  - BALANCEADO;
  - ALTO;
  - ULTRA.
- Métricas de budget:
  - FPS mínimo;
  - P95 máximo;
  - draw calls;
  - triângulos;
  - texturas;
  - geometrias;
  - objetos.

### Benchmark G6 automático
- Novo `GraphicsBenchmarkManager`.
- Consolida a última medição de cada par cena/perfil.
- Calcula:
  - cobertura do benchmark;
  - pares dentro/atenção/fora do budget;
  - índice de custo normalizado;
  - score por cena;
  - ranking das cenas mais pesadas.
- Matriz inicial: 8 cenas × 4 perfis = 32 pares.

### Baseline por versão
- O usuário pode capturar um baseline do estado atual.
- Baselines armazenam:
  - versão;
  - cobertura;
  - perfil;
  - cena;
  - métricas resumidas;
  - assinatura grosseira de hardware.
- Máximo de 12 baselines locais.

### Detecção de regressão
- Compara pares equivalentes cena/perfil.
- Detecta aumentos relevantes em:
  - P95;
  - draw calls;
  - triângulos;
  - texturas;
  - objetos.
- Detecta queda relevante de FPS.
- Também identifica melhorias.
- Informa quando a assinatura de hardware pode ser diferente.

### Diagnóstico Gráfico v0.2
- Novo painel Benchmark G6.
- Ranking das cenas.
- Cobertura 0–100%.
- Lista de combinações ainda não medidas.
- Baselines.
- Regressões e melhorias.
- Histórico de custo por versão.
- Exportação completa do benchmark.

### Versionamento da telemetria
- Novas sessões registram `appVersion`.
- Sessões antigas permanecem como `legacy`.
- Permite acompanhar evolução do custo ao longo das versões.


## 0.28.0-alpha — 2026-08-08

### Telemetria gráfica real
- Novo `GraphicsTelemetryManager`.
- ThreeRuntime anexa telemetria automaticamente a cada viewport Three.js.
- Coleta em intervalos, não em toda lógica pesada de cena.
- Métricas:
  - FPS;
  - frame time;
  - P95 de frame;
  - draw calls;
  - triângulos;
  - pontos/linhas;
  - texturas;
  - geometrias;
  - objetos da cena;
  - DPR;
  - duração da sessão.
- Ao desmontar a cena, um resumo é salvo localmente.

### Diagnóstico automático
- Regras internas detectam:
  - FPS baixo;
  - picos de frame;
  - draw calls elevados;
  - excesso de triângulos;
  - muitas texturas;
  - muitas geometrias;
  - excesso de objetos;
  - DPR alto para o FPS observado.
- Cada alerta inclui recomendação técnica.
- Os limiares são orçamentos internos e não são tratados como padrões universais.

### Módulo Diagnóstico Gráfico G6
- Novo módulo `/module/diagnostico-grafico`.
- Comparação observada entre ECO/BALANCEADO/ALTO/ULTRA.
- Histórico por cena.
- Última sessão detalhada.
- Exportação JSON.
- Limpeza do histórico local.
- Protocolo sugerido para benchmark manual comparável.

### HUD técnico G6
- Território, Agroindústria, Produção Animal, Economia Circular, Turismo, Cadeia, Marketing e Associativismo exibem resumo:
  - FPS;
  - calls;
  - triângulos;
  - texturas;
  - objetos.

### Correção de telemetria
- ThreeRuntime encerra a sessão antes de liberar renderer/scene.
- Histórico limitado a 80 sessões para evitar crescimento indefinido do localStorage.


## 0.27.0-alpha — 2026-08-08

### Instancing compartilhado G6
- Novo `instanced-object-factory.js`.
- Membros de cooperativa agora podem ser desenhados com um único `InstancedMesh`.
- Embalagens no Marketing usam instancing.
- Marcadores de trilha no Turismo usam instancing.
- Beacons da Cadeia Integrada usam instancing.
- Reduz draw calls em objetos repetidos.

### Scene Complexity Budget
- Novo `scene-complexity-budget.js`.
- Limita objetos decorativos/repetidos conforme:
  - perfil gráfico;
  - orçamento do Runtime Quality Governor.
- Marketing, Associativismo, Turismo e Cadeia usam a primeira versão do orçamento.

### Shadow Regions
- Novo `shadow-region-manager.js`.
- Ajusta dinamicamente a área ortográfica da sombra direcional.
- Evita gastar resolução de shadow map em regiões muito maiores que a área útil.
- Aplicado inicialmente em:
  - Marketing;
  - Associativismo;
  - Turismo;
  - Cadeia Integrada.

### Marketing G6
- LOD de quiosque.
- LOD de expositor.
- Embalagens instanciadas.
- Quantidade visual reage ao orçamento de complexidade.
- IBL industrial leve.
- Quality Governor e sombra regional.

### Associativismo G6
- Membros individuais substituídos por `InstancedMesh`.
- Participação muda as cores das instâncias.
- Mesa cooperativa recebeu DETAIL/PROXY/CULLED.
- IBL e Quality Governor.
- Sombra regional.

### Turismo G6
- Novo portal turístico ECO/HIGH.
- Marcadores da trilha instanciados.
- Complexidade visual adaptativa.
- Sombra regional acompanha a área útil.

### Cadeia Integrada G6
- Novo núcleo visual central ECO/HIGH.
- Beacons instanciados nas nove etapas.
- Sombra regional.
- Complexidade visual adaptativa.
- Botão Atualizar Jornada não abandona mais o laboratório.

### Correção de isolamento de produto
- `IntegratedJourneyManager` não usa mais transferências de outro produto quando o produto ativo ainda não possui transferências.
- A Cadeia passa a respeitar estritamente o `productId` ativo.


## 0.26.0-alpha — 2026-08-08

### Runtime Quality Governor
- Novo `runtime-quality-governor.js`.
- Atua abaixo do perfil gráfico global, sem trocar ECO/BALANCEADO/ALTO/ULTRA a cada oscilação.
- Coordena:
  - sombras;
  - tamanho do shadow map;
  - vegetação;
  - detalhe;
  - partículas;
  - LOD.
- Reduz qualidade em quedas persistentes e recupera gradualmente.

### Sombras adaptativas
- Sombras podem ser desativadas temporariamente em ALTO/ULTRA se o runtime estiver pressionado.
- Shadow map é reduzido progressivamente para 512/768/1024 conforme orçamento.
- Recriação do shadow map ocorre apenas quando a faixa realmente muda.

### Auto Quality estabilizado
- Uptime mínimo: 8 s.
- Cooldown entre mudanças globais: 18 s.
- Downgrade global exige mais amostras ruins.
- Upgrade global exige período estável significativamente maior.
- Aba oculta não altera qualidade.

### LOD expandido
- Turismo Sustentável:
  - centro de visitantes detalhado/proxy;
  - comércio local detalhado/proxy.
- Cadeia Produtiva Integrada:
  - nove estações com DETAIL → PROXY → CULLED.
- Produção Animal e Agroindústria passaram a receber o fator de detalhe do Quality Governor.

### Cadeia Integrada G6
- IBL local.
- Sombras adaptativas.
- Estações com LOD.
- HUD mostra estado do runtime.

### WebXR progressivo
- Panorama360Engine verifica `navigator.xr.isSessionSupported("immersive-vr")`.
- Botão WebXR só aparece quando há suporte.
- Sessão `immersive-vr` é solicitada apenas por ação do usuário.
- Ao encerrar, o viewer 360 comum é retomado.
- Cardboard continua existindo como fallback experimental independente.
- WebXR não é exigência para funcionamento da plataforma.


## 0.25.0-alpha — 2026-08-08

### Giroscópio orientado à tela
- Panorama360Engine passou a considerar `screen.orientation.angle`.
- Fallback para `window.orientation`.
- Beta/gamma são convertidos para um sinal relativo à orientação atual da tela.
- Mudanças portrait/landscape recalibram o baseline automaticamente.
- HUD 360 informa o ângulo de tela.

### Cardboard / VR experimental
- Novo modo estéreo lado a lado no Panorama360Engine.
- Renderização de olho esquerdo/direito com pequeno offset angular.
- Compatível com o giroscópio existente.
- Hotspots HTML são ocultados enquanto o estéreo está ativo.
- Não depende de WebXR e permanece opcional.
- Não deve ser descrito como VR completo.

### LOD dinâmico G5
- Novo `DynamicLODManager`.
- Produção Animal: modelo detalhado próximo, proxy leve em média distância e culling distante.
- Agroindústria: equipamentos G5 detalhados próximos, proxy técnico em média distância.
- Distâncias de LOD recebem ajuste pelo perfil ECO/BALANCEADO/ALTO/ULTRA.

### Água reativa
- `water-surface-g5.js` ganhou:
  - amplitude dinâmica;
  - turbidez;
  - stress visual;
  - velocidade de fluxo;
  - alteração de cor.
- Rio do Território reage a `production.waterAccess`.
- Lagoa do Turismo reage a disponibilidade/qualidade hídrica.
- Bebedouro da Produção Animal combina controle local + consequência MultiLab.

### Partículas adaptativas
- Novo `adaptive-effect-budget.js`.
- Orçamento reage ao FPS suavizado e ao perfil gráfico.
- Economia Circular reduz ou recupera gradualmente:
  - partículas de rota;
  - efluentes;
  - compostagem;
  - biogás;
  - reciclagem;
  - biomassa.
- HUD exibe percentual atual do orçamento de partículas.


## 0.24.0-alpha — 2026-08-07

### Imersão 360/3D V2
- ImmersiveBridge com `hotspotId`.
- Território e Agroindústria retornam ao setor panorâmico mais próximo.
- Viewer 360 restaura yaw/pitch/FOV e destaca o hotspot.
- Miniaturas locais dos hotspots.

### Giroscópio
- DeviceOrientationEvent opcional.
- `requestPermission()` quando exigido.
- Referência relativa e recalibração por arraste.

### Água G5
- Shader leve compartilhado.
- Rio do Território.
- Lagoa do Turismo.
- Bebedouro da Produção Animal.

### Produção Animal
- Modelos GLB locais de bovino, ave e peixe.
- Instalações por espécie.
- Piscicultura com tanques.

### Economia Circular
- Biomassa sólida animada.
- Efluentes, vapor e biogás.
- Tratamento hídrico em etapas.

### Agroindústria
- Jatos de lavagem.
- Misturador rotativo.
- Líquido de processo.
- Scanner de embalagem.
- Névoa fria.


## 0.21.0-alpha — 2026-08-07

### IBL local
- Novo `EnvironmentLightingManager`.
- Mapas equiretangulares locais para ambiente exterior e industrial.
- Conversão PMREM em runtime.
- `scene.environment` para reflexos e iluminação indireta dos materiais PBR.
- Território, Agroindústria, Produção Vegetal, Turismo e Roteirização utilizam IBL local.
- Mantém iluminação direta como fallback.

### Vegetação G5 expandida
- `vegetation-g5.js` ganhou modo genérico `addLandscapeVegetation`.
- Produção Vegetal migrou para vegetação G5.
- Turismo Sustentável migrou para vegetação G5.
- Roteirização Turística migrou para vegetação G5.
- Duas camadas de copa, cores variadas, gramíneas e movimento ambiental.
- Contagem continua adaptada ao perfil gráfico.

### Animação industrial
- Novo `industrial-animation-kit.js`.
- Correia/linha de embalagem animada.
- Embalagens em movimento.
- Fluxo líquido didático na estação de processo.
- Válvula giratória.
- Ventilação da câmara refrigerada.
- Luzes de status seguindo o avanço do processo.

### Áudio posicional
- Novo `SpatialAudioManager`.
- Usa Web Audio API após gesto explícito.
- Sons sintetizados por equipamento.
- Atenuação por distância.
- Stereo panning conforme posição relativa à câmera.
- Fontes iniciais: higiene, processo, embalagem e armazenamento.
- Som ambiente e som posicional podem ser controlados separadamente.


## 0.20.0-alpha — 2026-08-07

### Vegetação G5
- Novo `vegetation-g5.js`.
- Árvores instanciadas com duas camadas de copa.
- Variação determinística de escala, posição e cor.
- Gramíneas instanciadas.
- Movimento ambiental leve.
- Quantidade adaptada ao perfil gráfico.

### PBR local
- Nova `PBRMaterialLibrary`.
- Conjuntos locais: solo, concreto e metal.
- Base color, normal map e roughness map.
- Texturas 512×512 locais.
- Asset Manager agora diferencia `srgb` e `data`.
- Anisotropia adaptável.
- Território usa solo PBR.
- Agroindústria usa concreto PBR.

### Equipamentos G5
- Linha de higienização ECO/HIGH.
- Pasteurizador/tanque de processo ECO/HIGH.
- Linha de envase ECO/HIGH.
- Câmara refrigerada ECO/HIGH.
- Equipamentos integrados às estações clicáveis da Agroindústria.

### Som ambiente
- Novo `AmbientAudioManager`.
- Áudios locais sintetizados para Território e Agroindústria.
- Ativação explícita pelo usuário para respeitar políticas de autoplay.
- Som também disponível na experiência 360.
- Pausa e dispose no ciclo de vida do laboratório.

### Consequências visuais
- Novo `consequence-visualizer.js`.
- Território: disponibilidade hídrica altera visual do rio e gera marcas de seca.
- Território: oferta produtiva altera visual das culturas.
- Agroindústria: qualidade e embalagem geram sinais visuais e luzes de alerta.
- Painéis mostram quais consequências estão afetando a cena.

### Correções
- Removida construção frágil de `Color` no `markDone` da Agroindústria.
- Mantidos fallbacks procedurais quando PBR ou asset detalhado não carrega.


## 0.19.0-alpha — 2026-08-07

### Engine 360
- Novo `Panorama360Engine`.
- Panorama equiretangular em esfera WebGL.
- Arrastar para olhar ao redor.
- Pinça e roda para zoom.
- FOV limitado.
- Hotspots HTML projetados sobre a esfera.
- Qualidade adaptativa por DPR.
- Suporte a pausa/retomada e dispose.

### Asset Manager
- Suporte a assets `texture` e `panorama`.
- `loadTexture`.
- Cache e referência também para texturas.
- Dispose de textura quando não possui mais referências.

### Exploração Bioeconomia 360
- Novo laboratório.
- Território Bioeconômico 360.
- Agroindústria 360.
- Hotspots curriculares.
- Transição 360 → 3D.
- Links 3D → 360 nos laboratórios Território e Agroindústria.
- Fallback 2D.
- Perfis ECO/BALANCEADO usam panorama 2048×1024.
- ALTO/ULTRA usam panorama 4096×2048.
- `Save-Data` força panorama ECO.

### Realismo G4/G5
- Novo `realism-kit.js`.
- Texturas procedurais locais para solo, estrada e concreto.
- Sky dome procedural.
- Tone mapping e exposição adaptativa.
- Configuração de sombras por perfil gráfico.
- Território recebeu solo/estrada detalhados e sky dome.
- Agroindústria recebeu piso/parede procedurais e iluminação adaptativa.

### Panoramas
- Primeiros panoramas equiretangulares locais foram gerados como ilustrações próprias.
- Eles validam o pipeline 360 completo sem depender de rede.
- Não são fotografias de campo; podem ser substituídos futuramente por capturas 360 reais sem alterar o motor.

### Assets G4
- `panorama-portal` ECO/HIGH.
- `info-pedestal` ECO/HIGH.


## 0.18.0-alpha — 2026-08-07

### Retomada de sessões
- Novo `MultiLabSessionHistory`.
- Histórico local de sessões.
- Retomar sessão restaura produto ativo e missão ativa.
- Clonar estratégia cria novo produto, novo Projeto Integrador e nova sessão baseada na mesma missão.
- A sessão clonada começa limpa, evitando reutilizar evidências e transferências da estratégia anterior.

### Comparador MultiLab
- Novo `MultiLabComparisonManager`.
- Novo módulo `Comparador MultiLab`.
- Compara duas sessões diferentes.
- Pilares lado a lado.
- Score, eventos, ramificações, consequências, evidências e Projeto Integrador.
- Insights automáticos sobre as maiores diferenças.
- Exportação JSON e HTML.

### Histórico MultiLab
- Novo módulo `Histórico de Missões MultiLab`.
- Lista produto, missão, data, status, score, projeto, eventos e ramificações.
- Ações: Retomar, Clonar estratégia e Relatório.

### Integração de interface
- Missão ganhou atalhos para Histórico e Comparador.
- Relatório ganhou Histórico e Comparador.
- Dashboard e Painel Curricular ganharam novos atalhos.

### Assets G4
- `resume-terminal` ECO/HIGH.
- `compare-board` ECO/HIGH.


## 0.17.0-alpha — 2026-08-07

### Linha do tempo
- Novo `MissionTimelineManager`.
- Consolida início da sessão, transferências, eventos, ramificações, evidências e desfecho.
- Linha do tempo ordenada cronologicamente por produto e missão.
- Preview das últimas ações dentro da Missão MultiLab.

### Mapa 3D da Missão
- Novo módulo `Mapa 3D da Missão`.
- Árvore visual com etapas normais, ramificações, etapas dispensadas e eventos.
- Estado visual para concluído, pendente e dispensado.
- Fallback 2D.
- Desfecho projetado visível ao lado da árvore.

### Relatório Final MultiLab
- Novo `MultiLabReportBuilder`.
- Novo módulo `Relatório Final MultiLab`.
- Seleção de sessões históricas.
- Linha do tempo completa.
- Produto, projeto, desfecho, eventos, ramificações, consequências e evidências.
- Exportação JSON.
- Download HTML.
- Impressão / salvar como PDF pelo navegador.

### Interface
- Missão MultiLab ganhou links diretos para Mapa 3D e Relatório.
- Painel Curricular ganhou atalhos.
- Dashboard ganhou Mapa 3D e Relatório MultiLab.

### Assets G4
- `timeline-node` ECO/HIGH.
- `report-terminal` ECO/HIGH.


## 0.16.0-alpha — 2026-08-07

### Branch Engine V2 — desempenho
- `MultiLabBranchEngine` agora aceita regras por escolha, existência de transferência, métricas e quantidade de evidências.
- Predicados `eventChoice`, `transferMetric`, `transferExists` e `evidenceCount`.
- Condições `all` e `any`.
- Ramificações por desempenho são persistentes após ativação.
- Nova ação `waiveStage` para dispensar etapa por desempenho excepcional.

### Regras de desempenho
- Governança/equidade baixas → reforço de governança.
- Governança excepcional pode dispensar reparação formal após centralização.
- Solução sustentável frágil → revisão obrigatória.
- Marketing com confiança/market fit baixos → revisão obrigatória.
- Circularidade e desempenho ambiental altos → rota premium circular bônus.
- Resultado negativo ou margem < 8% → recuperação financeira obrigatória.

### Correção curricular da Economia Circular
- A etapa MultiLab agora exige `circularity-performance`.
- Receber um fluxo de resíduos não conclui mais a etapa.
- O aluno precisa abrir Economia Circular, tomar decisão e registrar indicadores.

### Desfechos
- Novo `MissionOutcomeEvaluator`.
- Desfecho projetado em tempo real.
- 6 pilares: governança, produção, circularidade, mercado, resiliência e financeiro.
- Finais: Bioeconomia regenerativa e viável; Modelo equilibrado e viável; Potencial com fragilidades; Projeto exige revisão estrutural.
- Desfecho final é salvo na sessão, evidência e transferência da missão.

### Recuperações
- Soluções Sustentáveis: `sustainable-solution-revision`.
- Marketing: `market-strategy-revision`.
- Marketing: `circular-premium-route`.
- Gestão Financeira: `financial-remediation`.

### Estabilidade
- UUIDs dos arquivos JS foram endurecidos para `globalThis.crypto?.randomUUID?.()`.

### Assets G4
- `performance-gauge` ECO/HIGH.
- `outcome-medal` ECO/HIGH.


## 0.15.0-alpha — 2026-08-07

### MultiLab V2 — Ramificações
- Novo `MultiLabBranchEngine`.
- Catálogo `data/multilab-branches.json`.
- Decisões podem adicionar etapas obrigatórias.
- Decisões podem adicionar etapas bônus.
- Decisões podem transformar etapa opcional em obrigatória.

### Ramificações iniciais
- Manter produção sem adaptação durante seca → exige Soluções Sustentáveis.
- Centralizar decisão em conflito → exige plano corretivo de governança.
- Vender lote sem ajuste → exige recuperação de qualidade na Agroindústria.
- Parceria com turismo na oscilação de demanda → Turismo torna-se obrigatório.
- Implantar rastreabilidade → desbloqueia rota premium de Marketing.

### Novo laboratório
- Soluções Sustentáveis 3D.
- Água, energia renovável, recuperação de resíduos e investimento.
- 3 cenários V2.
- Evidências.
- Fallback 2D.
- Transferência `sustainable-solution-plan`.

### Correções e recuperação
- Associativismo registra `governance-remediation`.
- Agroindústria registra `quality-remediation`.
- Marketing registra `premium-market-route`.

### Projeto Integrador
- Importa planos sustentáveis.
- Importa reparação de governança.
- Importa recuperação de qualidade.
- Importa rota premium.

### Assets G4
- `branch-gate` ECO/HIGH.
- `sustainable-module` ECO/HIGH.


## 0.14.0-alpha — 2026-08-07

### Eventos e consequências MultiLab
- Novo `MultiLabEventEngine`.
- Novo `ConsequenceManager`.
- Catálogo `data/multilab-events.json`.
- Eventos ativados após etapas da missão.
- Cada evento oferece decisões com efeitos persistentes.
- Missões podem exigir resolução de todos os eventos.

### Consequências aplicadas
- Seca altera disponibilidade hídrica, oferta e custos.
- Governança altera confiança e risco de demanda.
- Variabilidade de lote altera qualidade industrial e custos.
- Exigência de rastreabilidade altera confiança, valor sustentável e preço.
- Oscilação de demanda altera volume, preço e risco de mercado.

### Laboratórios afetados
- Produção Vegetal e Animal leem consequências hídricas e de oferta.
- Agroindústria aplica modificadores de qualidade.
- Marketing aplica confiança, sustentabilidade e market fit.
- Precificação aplica preço e risco de demanda.
- Gestão Financeira aplica volume, custo variável e custo fixo.

### Rastreabilidade
- Decisões de eventos geram LabContext `mission-event`.
- Consequências são vinculadas ao `productId` e `missionSessionId`.
- Portfólio passa a exibir consequências do produto ativo.
- Chip global mostra quantidade de consequências ativas.

### Assets G4
- `event-marker` ECO/HIGH.
- `decision-node` ECO/HIGH.


## 0.13.0-alpha — 2026-08-07

### Scenario Engine MultiLab
- Novo MultiLabMissionEngine.
- Catálogo `data/multilab-missions.json`.
- Missões com etapas obrigatórias e opcionais.
- Critérios por transferência, evidências e progresso do Projeto Integrador.
- Conclusão gera evidência final e LabContext para o Projeto Integrador.

### Produto persistente
- Novo ProductPassportManager.
- Produto possui nome, categoria, matéria-prima, território, mercado e narrativa.
- LabContext agora marca `productId` e `missionSessionId`.
- Evidências também recebem produto e missão automaticamente.
- Passaporte registra etapas realizadas.

### Nova experiência
- Módulo Missão MultiLab.
- Criação/seleção do produto.
- Missão "Produto Territorial — da origem ao resultado".
- Missão "Produto Agroindustrial Circular".
- Progresso em tempo real.
- Próxima etapa.
- Evidências mínimas.
- Projeto Integrador criado e vinculado automaticamente.

### Cadeia Integrada
- `IntegratedJourneyManager` passa a priorizar transferências do produto ativo.
- Cadeia Integrada mostra o nome do produto persistente.
- Produto 3D usa token de identidade quando há produto ativo.

### Interface
- Chip global do produto ativo no topo.
- Painel Curricular mostra produtos e Missões MultiLab.

### Assets G4
- `product-identity-token` ECO/HIGH.
- `mission-beacon` ECO/HIGH.


## 0.12.0-alpha — 2026-08-07

### Fluxo de mercado e viabilidade
- Nova ferramenta Precificação e Posicionamento.
- Marketing → Precificação.
- Precificação → Gestão Financeira.
- Precificação → Projeto Integrador.
- Gestão Financeira recebe estratégia e pode enviá-la ao Projeto Integrador.

### Cadeia Produtiva Integrada
- Antiga Cadeia Produtiva transformada em experiência integrada 3D.
- Novo IntegratedJourneyManager.
- Passaporte do produto com 9 etapas.
- Reconhece LabContext e resultados financeiros locais.
- Síntese da cadeia pode ser enviada ao Projeto Integrador.
- Fallback 2D completo.

### Assets G4
- Embalagem de produto ECO/HIGH.
- Marco de etapa da cadeia ECO/HIGH.

### Projeto Integrador
- Importa pricing-strategy.
- Importa financial-result.
- Importa integrated-chain.


## 0.11.0-alpha — 2026-08-07

### Novos laboratórios curriculares
- Associativismo e Cooperativismo 3D.
- Marketing e Consumo Sustentável 3D.
- 3 cenários V2 em cada laboratório.
- Evidências e fallback 2D.

### Integração
- Associativismo → Projeto Integrador.
- Agroindústria → Marketing.
- Marketing → Projeto Integrador.
- Projeto Integrador ampliado de 6 para 8 eixos.

### Projeto Integrador V2
- Governança e associativismo.
- Marketing e consumo sustentável.
- Importador LabContext ampliado para múltiplos tipos.

### Assets G4
- Mesa cooperativa ECO/HIGH.
- Expositor de produtos ECO/HIGH.

### Correção Asset Manager
- Paths de variantes agora são resolvidos relativamente ao arquivo de manifesto que os declarou.
- Corrige o uso de caminhos `./models/...` do `assets/shared/assets-manifest.json`.


## 0.10.0-alpha — 2026-08-07

### Integração de fluxo
- Território → Produção Vegetal.
- Território → Produção Animal.
- Produção Vegetal → Agroindústria.
- Produção Animal → Agroindústria.
- Agroindústria recebe e aplica lotes de matéria-prima.

### Portfólio e relatórios
- Novo PortfolioExporter.
- Novo módulo Portfólio de Bioeconomia.
- Relatório HTML por Projeto Integrador.
- Impressão / salvar PDF pelo navegador.
- Portfólio geral em HTML.
- Projeto Integrador ganhou botões Relatório HTML e Imprimir/PDF.
- Correção da importação da Gestão Financeira (`tool.gestao-financeira.last`).

### Assets G3/G4
- Novo tanque industrial GLB ECO/HIGH.
- Novo quiosque de mercado GLB ECO/HIGH.
- Agroindústria usa tanque industrial local.
- Território usa quiosque de mercado local.
- Variantes selecionadas pelo perfil gráfico.


## 0.9.0-alpha — 2026-08-07

### Projeto Integrador
- Novo ProjectManager.
- Novo módulo Projeto Integrador de Bioeconomia.
- Seções: território, produção, processamento, circularidade, turismo e viabilidade.
- Salvamento local.
- Vários projetos.
- Progresso interno.
- Importação de LabContext.
- Associação de evidências.
- Importação de Gestão Financeira.
- Exportação JSON.

### LabContext ampliado
- Turismo Sustentável → Roteirização Turística.
- Agroindústria → Economia Circular.
- Roteirização pode aplicar limite sugerido de paradas e prioridade comunitária.
- Economia Circular recebe fluxo material da Agroindústria.

### Painel Curricular
- Contagem de Projetos Integradores.


## 0.8.0-alpha — 2026-08-07

### LabContext
- Novo LabContextManager.
- Transferência local de dados entre laboratórios.
- Produção Animal → Biodigestor.
- Produção Animal → Economia Circular.
- Aplicação/consumo/descartar transferência.
- Painel Curricular exibe transferências pendentes.

### Novo laboratório
- Roteirização Turística 3D.
- Seleção e ordenação de paradas.
- Tempo, deslocamento, experiência, logística, sustentabilidade e benefício local.
- 3 cenários V2.
- Evidências.
- Fallback 2D.
- Integração com Turismo Sustentável.

### G3
- Território Bioeconômico elevado para G3.
- Agroindústria Virtual elevada para G3.
- Melhorias de iluminação, ambientação, névoa e elementos técnicos.


## 0.7.0-alpha — 2026-08-07

### Novo laboratório
- Economia Circular 3D.
- Rotas: destinação final, reciclagem, compostagem, biodigestor e estratégia integrada.
- Fluxos materiais animados.
- 3 cenários V2.
- Evidências.
- Fallback 2D.

### Integração entre laboratórios
- Produção Animal → Biodigestor.
- Produção Animal → Economia Circular.
- Economia Circular → Agroindústria / Biodigestor / Produção Animal.

### Painel Curricular
- Novo módulo de acompanhamento local.
- Progresso didático por unidade curricular.
- Contagem de evidências e cenários.
- Histórico de evidências.
- Exportação JSON.

### Núcleo
- Novo CurriculumProgressManager.
- Novo Flow Kit compartilhado para fluxos materiais.


## 0.6.0-alpha — 2026-08-07

### Scenario Engine V2
- Níveis: iniciante, intermediário e desafio.
- Metas por indicador.
- Limites por entrada ou indicador.
- Avaliação automática do cenário.
- Perguntas de reflexão.
- Preparação para rubricas e eventos.

### Evidências
- Novo EvidenceManager.
- Registro local de cenário, entrada, indicadores, avaliação e reflexão.
- Exportação das evidências em JSON.
- Painel reutilizável de evidência.

### Environment Pack
- Rochas.
- Arbustos.
- Pallets.
- Compostagem.
- Mini biodigestor.
- Sprinklers.
- Gotas de irrigação.
- Plantas por tipo.

### Produção Vegetal G2
- Estágio de crescimento.
- Culturas diferentes por cenário.
- Irrigação visual animada.
- Metas visíveis.
- Evidência de aprendizagem.

### Produção Animal G2
- Rota de resíduos: armazenamento, compostagem ou biodigestor.
- Integração conceitual com o Biodigestor Virtual.
- Metas visíveis.
- Evidência de aprendizagem.


## 0.5.0-alpha — 2026-08-07

### Scenario Engine
- Novo `ScenarioEngine`.
- Catálogos de cenários em JSON.
- Seleção persistente por laboratório.
- Validação de IDs e campos essenciais.
- Separação entre motor do laboratório e conteúdo da missão.

### Biblioteca gráfica compartilhada
- Novo `js/graphics/scene-kit.js`.
- Terreno, árvores, cercas, galpões, água, lavoura e marcadores de animais reutilizáveis.
- Redução de duplicação entre laboratórios.

### Novos laboratórios
- Produção Vegetal 3D.
- Produção Animal Sustentável 3D.
- Ambos possuem cenários JSON e fallback 2D.

### Correções
- Controle Auto de qualidade no Dashboard corrigido.
- Toasts de ajuste automático reativados.
- Dashboard atualizado para destacar produção e cenários.


## 0.4.0-alpha — 2026-08-07

### A3 — qualidade adaptativa
- Controle automático baseado em FPS.
- Histerese.
- Cooldown de 15 segundos.
- Degradação mais rápida e melhoria mais conservadora.
- Persistência do modo Auto.

### LOD
- Helper `createLOD()` no ThreeRuntime.
- Primeiro LOD real no Território Bioeconômico.
- LOD também utilizado no Turismo Sustentável.

### Asset Pipeline
- Descritores de assets.
- Variantes ECO/BALANCEADO/ALTO/ULTRA.
- Resolução de asset conforme perfil gráfico.
- Preparação do GLTFLoader para Draco.
- Preparação arquitetural para KTX2.
- Variantes `bio-crate-eco.glb`, `bio-crate.glb` e `bio-crate-high.glb`.

### Novo laboratório
- Turismo Sustentável 3D.
- Controle de visitantes, infraestrutura de trilha e participação local.
- Indicadores didáticos de conservação, experiência e benefício local.
- Fallback 2D.


## 0.3.0-alpha — 2026-08-07

### Correções estruturais
- Integração efetiva de QualityManager, PerformanceManager e GraphicsAdapter no AppContext.
- Ciclo de vida gráfico revisado.

### Asset Pipeline A1
- Novo AssetManager.
- Escopos de assets por laboratório.
- Cache e reference counting.
- Loader GLTF sob demanda.
- Primeiro GLB local (`bio-crate.glb`).

### Engine 3D A2
- Novo ThreeRuntime compartilhado.
- Three.js carregado sob demanda.
- OrbitControls.
- DPR adaptativo.
- sombras por perfil.
- dispose centralizado.
- fallback 2D quando WebGL/Three.js não estiver disponível.

### Laboratórios
- Território Bioeconômico atualizado de 2.5D para 3D real G2.
- Agroindústria Virtual atualizada para 3D real G2 e GLB local.
- Novo Biodigestor Virtual 3D com simulação didática e fallback 2D.


## 0.2.0-alpha — 2026-08-07

### Gráficos
- Quality Manager com ECO/BALANCEADO/ALTO/ULTRA.
- Performance Manager.
- Graphics Adapter responsivo.

### Laboratórios
- Território Bioeconômico 360 G1.
- Cadeia Produtiva Interativa.
- Agroindústria Virtual G1.

### Arquitetura
- Progresso persistente por laboratório.
- Preparação para Asset Pipeline e Three.js/GLB.


## 0.1.0-alpha — 2026-08-07

### Criado
- App Shell responsivo.
- Router por hash.
- Event Bus.
- Storage Manager.
- Module Loader.
- Module Registry.
- Catálogos JSON.
- Módulo Fundamentos.
- Módulo Profissão.
- Ferramenta Gestão Financeira.
- Sandbox gráfico.
- Tema claro/escuro.
- Estrutura para GitHub Pages.
