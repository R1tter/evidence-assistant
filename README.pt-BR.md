# Evidence Assistant

Envie um documento, faça perguntas e abra o trecho usado na resposta. Experimente nove exemplos autorais em português brasileiro, inglês e espanhol ou escolha um PDF, PNG ou JPEG próprio. A interface está disponível nos três idiomas e segue o [plano aprovado](docs/superpowers/plans/2026-10-06-document-workspace.md).

O demo sem chave seleciona frases exatas; não gera nem traduz respostas. PDFs com texto funcionam diretamente. Imagens/scans precisam de transcrição manual ou provedor visual opcional após consentimento. Exemplos usam texto preparado e informam isso. Manuscritos são experimentais; a nota cursiva é uma ilustração tipográfica, sem avaliação de escrita à mão.

A primeira entrega inclui quatro documentos originais, fragmentação por títulos, identificadores estáveis e recuperação determinística combinando BM25 com similaridade de cosseno sobre frequências de termos. O índice é criado uma vez e reutilizado. Não são embeddings semânticos neurais; pontuações não comprovam a verdade de uma resposta.

O demo agora produz respostas extrativas com frases completas das fontes. A validação rejeita estruturas inválidas, citações desconhecidas e trechos alterados. Esses checks não comprovam correção semântica. Consulte os [contratos e limites das respostas](docs/answers.md).

A interface de documentos, API HTTP, MCP público e adaptadores opcionais OpenAI estão implementados. Consulte [API](docs/api.md) e [MCP](docs/mcp.md). Chamadas reais não foram verificadas; os testes simulam apenas HTTP externo. A demonstração anterior permanece em `/technical-demo.html`; documentos privados não chegam ao MCP.

Com Node.js >=22.13.0 (verificado com 22.17.0) e npm:

```sh
npm ci
npm run verify
```

Para executar a API local:

```sh
npm run build
npm run start:api
```

Em outro terminal, execute `npm run dev:web` e abra `http://127.0.0.1:5173`. Escolha um exemplo ou **Usar meu documento**, confira a transcrição e pergunte no idioma do documento no modo extrativo. A fonte abre página/trecho. Salvar correções cria nova revisão e remove a resposta antiga.

O seletor guarda somente a preferência de idioma no navegador. Sem preferência, usa um idioma compatível do navegador ou inglês. Rascunhos de revisão permanecem ao alternar páginas e visualizações durante a sessão. Se a resposta de um salvamento se perder, a aplicação recupera a revisão existente; enquanto não puder confirmá-la, bloqueia perguntas e mantém o rascunho.

Limites: um documento, cinco páginas, 10 MiB, imagem de 16 MP, 40.000 caracteres e 15 segundos para leitura local. O original fica no navegador. O texto consultável vai para a API e fica em memória por 30 minutos sem atividade. Trocar documento solicita exclusão; fechamento abrupto ou falha na exclusão depende do TTL. Reiniciar perde sessões. Sem armazenamento permanente nem autenticação.

Configure `OPENAI_API_KEY` e `OPENAI_VISION_MODEL` no processo da API para reconhecimento; adicione `OPENAI_MODEL` para respostas geradas. `.env` não é carregado automaticamente. Páginas selecionadas são enviadas somente após consentimento. Geração envia pergunta/trechos. Não executamos chamadas reais, testes pagos ou avaliação de manuscritos. Cancelar localmente não garante cancelamento/cobrança remotos.

```sh
npm run evaluate
npm run benchmark
npm run build:web
npx playwright install chromium
npm run build:storybook
npm run test:e2e
```

[Resultados executados e limitações](eval/documents/README.md). CI usa Windows para capturas revisadas; resultado remoto e hospedagem são verificações separadas.

As verificações cobrem formatação, lint sem avisos, dependências entre pacotes, tipos, testes, cobertura do core e build. Nenhuma credencial externa é necessária. Consulte o [baseline de recuperação](docs/retrieval.md) para as fórmulas, regras e limitações.
