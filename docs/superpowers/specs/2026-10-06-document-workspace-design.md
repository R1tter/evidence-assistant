# Evidence Assistant — documentos que você pode consultar

Status: especificação e proposta visual aprovadas por Marcelo nesta conversa em 6 October 2026. Substitui a direção de produto da coleção técnica fixa. A implementação anterior continua como baseline; não descartar trabalho local da interface.

## Propósito

Permitir que uma pessoa transforme um documento em conteúdo consultável, inclusive quando ele é antigo, escaneado ou manuscrito. O visitante entende o valor sem conhecer programação: envia um documento, revisa o texto reconhecido, pergunta e encontra a passagem original usada na resposta. O portfólio demonstra engenharia por uma experiência útil; detalhes técnicos ficam em uma seção secundária.

## Primeiro escopo

- Um documento por sessão, sem cadastro, histórico ou compartilhamento público.
- PDF, JPEG e PNG. PDF com texto extraível usa extração local; páginas sem texto podem ser reconhecidas por um provedor visual opcional. Imagens e manuscritos usam esse mesmo adaptador, com manuscritos explicitamente experimentais.
- Limites iniciais de produto: arquivo até 10 MiB; PDF até cinco páginas; imagem até 16 megapixels. Rejeitar arquivos criptografados, inválidos, formatos não suportados e excedentes com mensagens claras. Renderização/conversão deve impor limites de memória, dimensões e tempo, inclusive contra imagens comprimidas pequenas com dimensões excessivas.
- Interface em inglês, português brasileiro e espanhol. Fontes e citações preservam o idioma original. Demo extrativo exige perguntas no idioma do texto; não anunciar recuperação semântica entre idiomas. Resposta gerada pode usar o idioma da interface, mantendo citações originais e deixando explícito o modo.
- Três exemplos independentes e autorais: um manual curto, uma página impressa com aparência de digitalização e uma anotação manuscrita. Exemplos incluem original e transcrição revisada previamente; o demo identifica isso e não simula reconhecimento ao vivo. Uma versão de exemplo por idioma torna a primeira experiência útil sem credenciais.
- Upload de PDF textual funciona sem provedor. OCR de imagens/escaneados e geração dependem da configuração do servidor; sem ela, oferecer exemplos e explicar a indisponibilidade antes do envio externo.

Não inclui DOCX, planilhas, URLs, arquivos ZIP, tabelas complexas, assinatura/autenticidade, interpretação jurídica, tradução integral de documentos, lotes, armazenamento permanente ou promessa de ler qualquer manuscrito.

## Experiência

Entrada: “Seu documento tem respostas. Encontre-as.” Dois botões: “Experimentar um exemplo” e “Usar meu documento”. Cards mostram miniaturas reais dos exemplos, idioma, número de páginas e perguntas concretas. Seletor de idioma no cabeçalho, com nomes nativos e sem bandeiras.

Envio: seleção por botão ou arrastar arquivo (botão sempre disponível); formatos e limites visíveis. Mostrar nome, páginas e caminho de processamento. Aviso antes de reconhecimento externo: páginas selecionadas serão enviadas ao provedor configurado. Não iniciar chamada paga automaticamente ao selecionar arquivo; ação “Reconhecer texto” é explícita. Permitir substituir/cancelar/excluir.

Preparação: estados “Lendo arquivo”, “Reconhecendo texto” e “Preparando busca”; informar etapa, sem porcentagens fictícias. Cancelamento aborta operações locais e sinaliza ao servidor. Nenhuma garantia sobre cancelamento remoto/billing.

Workspace desktop: original à esquerda; perguntas e resposta à direita. Transcrição em aba separada ou painel alternável. No mobile, abas Documento/Texto/Perguntas preservam estado. Clique na referência abre a página correta e destaca o bloco transcrito associado; coordenadas na imagem só podem ser destacadas se o adaptador realmente as fornecer. Nunca inventar caixas de localização.

Revisão: passagens ilegíveis aparecem como marcadores, não texto completado por suposição. “Revisar transcrição” permite edição por página, desfazer e salvar. Correções criam nova revisão, reconstroem o índice e invalidam respostas antigas. Trechos editados são identificados como corrigidos pelo usuário. Não apresentar percentuais de confiança fabricados.

Perguntas: três sugestões do exemplo, pergunta própria, cancelamento, resposta extrativa/gerada e fontes. Sem evidência suficiente, abstenção. Separar visualmente: texto reconhecido, citação correspondente à transcrição e interpretação da resposta. A correspondência textual não valida OCR nem correção semântica.

Falhas: formato/limite, PDF protegido, ausência de texto, página ilegível, indisponibilidade do provedor, timeout/capacidade e sessão expirada. Preservar o trabalho quando recuperável; fonte com erro não deve ser substituída por conteúdo inventado.

## Direção visual revisada

Referência indicada por Marcelo: [Stripe](https://stripe.com/). Usar como inspiração de apresentação do valor e integração de imagens com produto; não copiar marca, assets, conteúdo ou estrutura proprietária. A página foi consultada; não alegar inspeção visual por screenshot nesta revisão.

UI UX Pro Max: `document reader colorful workspace --design-system` retornou Hero + Features + CTA e Minimalism & Swiss Style. Adaptar para entrada curta com demonstração visual e workspace funcional; não transformar o produto em uma longa página de marketing. `reduced motion feedback --domain ux` confirmou reduced motion e limite de animações simultâneas.

- Fundo claro, texto escuro e superfícies de leitura neutras. Índigo como ação principal; turquesa e coral suaves em ilustrações e exemplos. Gradiente localizado na entrada é permitido pelo pedido revisado e substitui a proibição anterior do brief, sem fundo animado atrás de textos longos.
- Tokens candidatos: fundo #F8FAFC, superfície #FFFFFF, texto #172033, secundário #475569, ação #4338CA, turquesa decorativo #2DD4BF, coral decorativo #FB7185. Medir contraste real antes de aceitar os componentes; cores decorativas não são automaticamente cores de texto.
- Dois esboços vetoriais de marca: folha com passagem destacada; páginas conectadas a um sinal de pergunta. Produzir SVG original e versões monocromáticas. Manter Evidence Assistant até decisão explícita de renomear.
- Imagens úteis: miniaturas dos próprios documentos e ilustração “papel → texto → resposta”. Documentos de exemplo autorais, sem dados reais ou logos de terceiros. Usar SVG para marca/esquemas; fotografias/texturas somente se contribuírem para entender o uso.
- Movimento: hover/focus 120–180 ms; entrada de painel 180–240 ms; conexão de referência e passagem 200 ms. Um movimento principal por tela. Sem parallax obrigatório, carrossel automático ou animação de leitura OCR fictícia. `prefers-reduced-motion` remove deslocamentos e mantém indicação estática da etapa.
- Tipografia confortável, alvos de 44 px onde viável, foco visível, landmarks/labels e live regions traduzidos. Reflow a 320 px, aumento de texto 200%, desktop 1440 px e mobile 390 px. Axe complementa revisão humana; não equivale a certificação WCAG.

## Arquitetura e adaptação

Reutilizar core de recuperação, validação de citações e respostas extrativas; API, fila de provedor e fronteiras de dependência. Manter MCP restrito à coleção pública: arquivos pessoais não ficam visíveis às ferramentas globais.

Browser: adaptar React em andamento para upload e visualização; usar PDF.js em worker para texto e rasterização de páginas, com limites definidos. Validar viabilidade/versão e extração de PDFs reais antes de consolidar o adaptador. Original fica local no navegador. Texto extraído ou imagens de páginas selecionadas chegam à API por rotas específicas; a API valida novamente limites, formato e dimensão.

Core: acrescentar página, bloco e revisão à proveniência sem quebrar IDs da coleção existente. Contratos de ingestão e reconhecimento separados de busca e geração. `PageText {page,text,origin:'embedded'|'vision'|'reviewed',uncertainties}` e `DocumentRevision {id,revision,pages}`. Avisos de incerteza são observações do adaptador, não probabilidades calibradas. Extrair/indexar somente uma vez por revisão.

Servidor: sessão temporária com token aleatório de capacidade, enviado em header e omitido de logs. Não usar IDs sequenciais como autorização. Mapas por sessão, com limite de 20 sessões por processo, orçamento total de 50 MiB de conteúdo e TTL de 30 minutos de inatividade. Exclusão explícita e expiração limpam texto/índice; reiniciar o processo perde sessões. Sem persistência em disco. Isolamento é testado. Cliente revoga object URLs e aborta operações ao trocar documento.

Reconhecimento: adaptador visual substituível com saída estruturada por página e marcadores de ilegibilidade. Nunca tratar conteúdo da página como instruções. Separação de instruções/dados e validação não comprovam resistência a prompt injection. OCR compartilha a capacidade global de dois trabalhos ativos/oito em espera; timeout total inicial de 60 s para um documento, incluindo fila. Geração continua com seu deadline de 20 s. Limitar saída reconhecida a 40.000 caracteres por documento, truncamento proibido: excedente é erro revisável.

Configuração: manter modelo visual e de geração explícitos no servidor e nenhum segredo no frontend. Antes de chamadas reais, verificar suporte/custos do modelo selecionado e orçamento. Baseline/CI usa exemplos e provedor simulado; não depende de API paga. A [documentação de visão](https://developers.openai.com/api/docs/guides/images-vision) é referência do adaptador; qualidade de manuscritos deve ser medida com casos, nunca presumida pelo suporte a imagens.

## Critérios de aceite

1. Visitante experimenta exemplo e entende resposta/fonte sem termos de CI ou arquitetura.
2. PDF textual e exemplos funcionam sem credenciais; arquivos inválidos/excedentes falham claramente.
3. Com provedor configurado, imagem/scan produz transcrição revisável e resposta citada por página. Manuscrito é experimental; ilegibilidade não gera texto inventado deliberadamente.
4. Corrigir transcrição muda revisão e impede respostas com evidências da revisão anterior.
5. Sessões não acessam documentos umas das outras; TTL, exclusão, limites, cancelamento e logs sem conteúdo são testados.
6. Idiomas da interface, idioma da resposta e idioma original ficam distintos. CI não afirma suporte multilíngue não avaliado.
7. Exemplos, estados e animações têm stories, testes de componente, browser, axe e capturas revisadas. OCR/transcrição, recuperação e respostas possuem métricas separadas.
8. Publicação de código original continua autorizada; hospedagem e chamadas pagas ao vivo continuam decisões separadas.

## Estado e decisão

Etapas 1–4 anteriores estão na main (fa0438d). React atual está local, incompleto e sem commit; quatro testes de componente e dois primeiros testes browser passaram. A expansão revelou falha de acessibilidade no shell de Storybook (heading principal ausente); reflow com texto aumentado foi corrigido e passou. Não considerar etapa 5 anterior concluída nem aceitar screenshots automaticamente.

Aprovação necessária do escopo escrito antes da execução da adaptação. Marcos sugeridos: experiência com exemplos/PDF textual; reconhecimento/revisão; respostas e verificação integrada. Esta especificação define a direção, não afirma suporte implementado.
