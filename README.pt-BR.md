# Evidence Assistant

Assistente independente para consultar documentos e inspecionar evidências. A implementação segue o [plano aprovado](docs/superpowers/plans/2026-10-06-evidence-assistant.md), com verificação por etapa.

A primeira entrega inclui quatro documentos originais, fragmentação por títulos, identificadores estáveis e recuperação determinística combinando BM25 com similaridade de cosseno sobre frequências de termos. O índice é criado uma vez e reutilizado. Não são embeddings semânticos neurais; pontuações não comprovam a verdade de uma resposta.

O demo agora produz respostas extrativas com frases completas das fontes. A validação rejeita estruturas inválidas, citações desconhecidas e trechos alterados. Esses checks não comprovam correção semântica. Consulte os [contratos e limites das respostas](docs/answers.md).

A API HTTP, o servidor MCP de leitura e o adaptador opcional OpenAI estão implementados. Consulte [configuração e limites da API](docs/api.md) e [configuração do MCP](docs/mcp.md). Chamadas reais ao provedor não foram verificadas; os testes de baseline simulam apenas o HTTP externo. A interface ainda é uma etapa posterior.

Com Node.js 22.12 ou superior e npm:

```sh
npm ci
npm run verify
```

Para executar a API local:

```sh
npm run build
npm run start:api
```

As verificações cobrem formatação, lint sem avisos, dependências entre pacotes, tipos, testes, cobertura do core e build. Nenhuma credencial externa é necessária. Consulte o [baseline de recuperação](docs/retrieval.md) para as fórmulas, regras e limitações.
