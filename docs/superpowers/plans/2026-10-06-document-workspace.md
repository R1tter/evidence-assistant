# Document Workspace Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans task by task after approval of the revised written scope and this plan. Follow TDD and perform a fresh whole-branch review at the end.

**Goal:** Enviar ou experimentar um documento, revisar a transcrição e obter respostas com referências ao original.

**Architecture:** Preservar core independente e adaptadores existentes. Acrescentar proveniência por página/revisão, sessões efêmeras e reconhecimento visual opcional. React apresenta original, texto e perguntas; demo e CI não precisam de credenciais.

**Tech Stack:** TypeScript/React/Vite existentes; PDF.js em worker (versão e compatibilidade a verificar); Fastify; adaptador visual OpenAI opcional; Vitest, Playwright, axe e Storybook existentes.

**Status:** roteiro e proposta visual aprovados por Marcelo nesta conversa em 6 October 2026. Tasks 1–5 concluídas; Task 6 em execução. Referência normativa: [especificação revisada](../specs/2026-10-06-document-workspace-design.md). Não continuar o plano antigo de coleção fixa como direção de produto.

## Task 1 — proposta visual e baseline preservado

Arquivos: `docs/ux-document-preview.html`, `docs/ux-design.md`, `docs/execution-ledger.md`, `apps/web/src/assets/brand-*.svg` (na implementação), configurações existentes.

- [x] Registrar aprovação da especificação/plano e ponto de retomada; preservar alterações locais atuais. Separar baseline antigo e nova experiência por commits, sem reset destrutivo.
- [x] Aplicar UI UX Pro Max com stack React e foco/reduced motion. Criar preview dos caminhos exemplo/upload e estados leitura/OCR/revisão/resposta/ilegível/erro/expiração nos três idiomas; dois sketches de marca e miniaturas autorais.
- [x] Revisar desktop/mobile, propósito, contraste e fluxo com Marcelo antes de consolidar visual. Atualizar a proibição antiga de gradientes para a regra localizada da nova especificação.
- [x] Corrigir shell de stories com heading/landmark próprios; testar RED/GREEN. Rodar gates atuais e registrar capturas ainda não aprovadas. Commit somente após verificar o escopo efetivamente entregue.

## Task 2 — ingestão local e exemplos úteis

Arquivos novos: `apps/web/src/documents/{input,pdf,examples}.ts`, worker PDF, `examples/{en,pt-BR,es}/`, testes adjacentes. Responsabilidades: validação, parser e assets/proveniência separados.

Contrato: `readDocument(file,signal):Promise<{pages:PageText[], previews:PagePreview[], requiresRecognition:boolean}>`; preview tem página, URL local e dimensões. Nunca gerar trecho para página sem texto.

- [x] Escrever casos para PDF textual, scan sem texto, PNG/JPEG, PDF protegido/inválido, limite cinco páginas/10 MiB/16 MP, worker cancelado e URL revogada. Executar RED.
- [x] Verificar versão PDF.js, worker Vite e fixtures reais no Windows/browser; decidir e registrar limitações verificadas. Instalar versão fixada somente nesta entrega.
- [x] Implementar extração/rasterização com orçamento de pixels e timeout de 15 s, cancelamento e limpeza; API revalida tudo posteriormente.
- [x] Criar exemplos nos três idiomas, originais e transcrições revisadas com autoria registrada. Identificar texto previamente preparado; não simular OCR.
- [x] GREEN, build/browser com demo sem chave e commit.

## Task 3 — proveniência e sessões temporárias

Arquivos: `packages/core/src/{document-revisions,page-chunks}.ts`, `apps/api/src/{document-session,document-routes}.ts`, testes. Manter contratos antigos compatíveis e imports públicos.

API proposta: `POST /api/document-sessions` inicia sessão a partir de texto validado; token em header `X-Document-Session` nas rotas `GET/DELETE /api/document-session`, `PATCH /api/document-session/pages/:page`, `POST /api/document-session/ask`. IDs/revisões vêm do servidor; erros não expõem dados de outras sessões.

- [x] RED para isolamento entre tokens, token ausente/inválido, revisão obsoleta, expiry, exclusão, orçamento 20 sessões/50 MiB, 40.000 caracteres e origem de página.
- [x] Implementar token criptograficamente aleatório, TTL de inatividade 30 min, limpeza previsível, índice uma vez por revisão e rejeição de conflitos. Token/conteúdo nunca nos logs.
- [x] Manter MCP sem acesso às sessões pessoais; testar regressão da coleção pública e core.
- [x] GREEN/gates e commit.

## Task 4 — reconhecimento opcional e revisão

Arquivos: `apps/api/src/{recognition,recognition-provider,recognition-routes}.ts`, contratos públicos de reconhecimento, testes de fila existentes estendidos. `recognize(pages,signal):Promise<PageText[]>` recebe imagens limitadas e devolve apenas transcrição/avisos por página.

- [x] RED com HTTP externo simulado: manuscrito legível, ilegível, instruções adversariais como dados, saída malformada/oversized, timeout, cancelamento, limite de fila e privacidade de logs.
- [x] Implementar schema canônico de páginas, input MIME/magic/dimensões e budget revalidados. `POST /api/document-session/recognize` aceita imagens selecionadas, somente após ação explícita do usuário. Limite de corpo específico sem aumentar globalmente o POST de perguntas.
- [x] Compartilhar capacidade de dois ativos/oito em espera com geração; deadline 60 s para OCR incluindo fila, 20 s para geração. Sem retries automáticos pagos.
- [x] Configuração de visão indisponível desabilita reconhecimento e deixa exemplos/PDF textual funcionais. Chaves e modelos explícitos, nenhuma chamada live neste marco.
- [x] Edição salva nova revisão, distingue correção humana e invalida respostas antigas. GREEN/gates e commit.

## Task 5 — workspace e respostas sobre o documento

Arquivos: `apps/web/src/documents/{DocumentInput,DocumentViewer,TranscriptEditor,DocumentWorkspace}.tsx`, `useDocumentSession.ts`, `api.ts`, componentes existentes, stories/testes. `DocumentViewer` mostra página e bloco associado sem inventar coordenadas.

- [x] RED: upload/exemplo, consentimento antes de OCR, cancelar/trocar documento, texto revisado, perguntas/abstenção, resposta atrasada, idioma preservado e sessão expirada.
- [x] Implementar workspace aprovado e entradas acessíveis; integrar endpoints de sessão; pergunta usa revisão explícita. Modo demo não traduz citações nem promete busca entre idiomas; geração responde no idioma solicitado, com fontes originais.
- [x] Conectar referência à página/bloco; foco previsível e retorno ao acionador. Textos e transcrições renderizados como texto, sem HTML de documento.
- [x] Tokens/marca/miniaturas e animações aprovadas; reduced motion remove deslocamento. Stories para todos os estados e idiomas; nenhuma lógica de parser/provedor dentro de componentes de apresentação.
- [x] Playwright com exemplo, PDF textual e OCR simulado; fluxo com API real sem chave; axe app/stories; screenshots 390/1440, long text e imagem; revisar baselines. Inspeção de teclado, 320 px, aumento de texto e zoom 200%, reduced motion. GREEN/gates e commit.

## Task 6 — avaliação e publicação verificável

Arquivos: `eval/documents/`, `scripts/{evaluate,benchmark}.ts`, `.github/workflows/ci.yml`, ADRs, README/README.pt-BR e avisos de privacidade.

- [ ] RED para transcrição incorreta, fonte ausente, abstenção indevida, citação/revisão incompatível e regressão de isolamento. Comparar texto embedded, transcrição revisada e resultado real do provedor separadamente.
- [ ] Publicar métricas executadas: CER/WER de transcrição com normalização definida, Recall@5/MRR, abstenção e citações. Sem casos live, reportar fixtures e revisão manual; não atribuir qualidade OCR ao mock.
- [ ] CI sem segredos: npm ci, format/lint/boundaries/types/core coverage, tests/protocol/evaluation/build/storybook/browser/axe. Usar runner Windows para baselines Windows atuais ou revisar novos baselines por plataforma. Artefatos de falha; nenhum dado privado.
- [ ] Benchmark original de 1.000 documentos, ADRs de parsing local, sessão efêmera e provedor opcional; explicar limites de memória/instância sem alegar produção distribuída.
- [ ] Revisão final independente, correções com RED/GREEN, execução completa do lockfile, documentação do uso real e limites, commit/push autorizados. Merge exige autorização aplicável; hospedagem é separada.

## Decisões antes de reconhecimento ao vivo

Modelo e orçamento de testes pagos; comportamento de retenção do provedor; qualidade em manuscritos nas línguas alvo; documentos de exemplo finais. Não precisam bloquear demo/PDF textual, mas nenhum teste pago ou lançamento público de upload fica implicitamente aprovado por este roteiro.
