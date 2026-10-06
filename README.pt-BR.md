# Evidence Assistant

Assistente independente para consultar documentos e inspecionar evidências. A implementação segue o [plano aprovado](docs/superpowers/plans/2026-10-06-evidence-assistant.md), com verificação por etapa.

A primeira entrega inclui quatro documentos originais, fragmentação por títulos, identificadores estáveis e recuperação determinística combinando BM25 com similaridade de cosseno sobre frequências de termos. O índice é criado uma vez e reutilizado. Não são embeddings semânticos neurais; pontuações não comprovam a verdade de uma resposta.

O demo agora produz respostas extrativas com frases completas das fontes. A validação rejeita estruturas inválidas, citações desconhecidas e trechos alterados. Esses checks não comprovam correção semântica. Consulte os [contratos e limites das respostas](docs/answers.md).

API HTTP, MCP, geração opcional com IA e interface são etapas posteriores ainda não implementadas.

Com Node.js 22.12 ou superior e npm:

```sh
npm ci
npm run verify
```

As verificações cobrem formatação, lint sem avisos, dependências entre pacotes, tipos, testes, cobertura do core e build. Nenhuma credencial externa é necessária. Consulte o [baseline de recuperação](docs/retrieval.md) para as fórmulas, regras e limitações.
