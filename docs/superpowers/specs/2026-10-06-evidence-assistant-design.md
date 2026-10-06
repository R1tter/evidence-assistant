# Evidence Assistant — especificação do portfólio

Data: 6 de outubro de 2026
Status: escopo aprovado em 6 de outubro de 2026; revisão de qualidade e UX incorporada para validação final

## Objetivo

Criar um projeto público independente que ajude recrutadores a avaliar a experiência de Marcelo em IA aplicada, frontend, backend e Quality Engineering. O produto permite fazer perguntas sobre uma coleção pequena de documentos técnicos públicos, visualizar os trechos recuperados e verificar as fontes da resposta.

O projeto não usa código, documentos, dados, arquitetura interna ou identidade visual do Black Box ou de empregadores. Não apresenta métricas comerciais ou resultados de testes ainda não executados.

## Abordagem escolhida

Uma aplicação React e TypeScript com API Node.js, recuperação de documentos e um servidor MCP compartilhando a mesma camada de consulta. Uma demonstração local sem credenciais apresenta recuperação e respostas extrativas; um modo opcional com LLM gera respostas fundamentadas nos trechos recuperados.

Alternativas consideradas: um chatbot dependente de uma API paga cria atrito para avaliar o portfólio; uma plataforma com upload de documentos, contas e múltiplos agentes aumenta o escopo sem melhorar a primeira demonstração. A coleção fixa torna o comportamento reproduzível e permite testes objetivos.

## Escopo da primeira versão

- Interface em inglês, responsiva e acessível, com perguntas sugeridas, entrada livre, resposta, fontes e painel de evidências.
- Coleção versionada de documentos sintéticos originais sobre práticas de engenharia: testes, CI/CD, contratos de API e validação de IA. Os documentos serão públicos no próprio repositório. Não copiar documentação protegida de terceiros.
- Recuperação híbrida com busca lexical e embeddings locais de vocabulário fixo (vetores determinísticos de frequência de termos), combinadas com pesos explícitos. Documentar que esse baseline não equivale a embeddings semânticos neurais.
- Fragmentação com identificadores estáveis, título, caminho, seção e conteúdo; os resultados incluem pontuação e trechos.
- Respostas extrativas no modo demo, claramente identificadas como tal. Não simular geração de LLM.
- Adaptador opcional para um provedor de LLM, configurado exclusivamente no backend. O provedor final será definido no plano após verificar sua documentação oficial.
- Servidor MCP por stdio com ferramentas `search_documents` e `get_document`, usando a mesma coleção e serviço de recuperação da API. Instruções para conexão por um cliente MCP; não afirmar que o chat utiliza MCP quando chama a API diretamente.
- Validação determinística da estrutura da resposta, identificadores de fontes e citações de trechos. Mostrar evidências verificáveis; não alegar que a validação prova a verdade ou elimina alucinações.
- Testes unitários e de integração, avaliações fixas de recuperação e Playwright para os fluxos principais. CI executa essas verificações sem credenciais externas.
- README em inglês, guia em português, especificação, decisões de arquitetura e instruções reproduzíveis.

## Fora do escopo

Login, cobrança, upload de arquivos, dados pessoais, acesso à internet durante perguntas, armazenamento de conversas, treinamento de modelos e agentes autônomos com ferramentas de escrita. Publicação online será uma etapa posterior ao funcionamento local, dependente de um destino de hospedagem definido e custos conhecidos.

## Fluxo do usuário

1. Abre a aplicação e identifica imediatamente o modo de execução e o conteúdo da coleção.
2. Escolhe uma pergunta sugerida ou escreve uma pergunta de até 1.000 caracteres.
3. A API valida a entrada, recupera até cinco fragmentos e decide se há evidência suficiente usando um limiar configurado e documentado.
4. Sem evidência suficiente, informa que a coleção não sustenta uma resposta e mostra os resultados disponíveis sem inventar conteúdo.
5. No modo demo, apresenta trechos relevantes e uma resposta extrativa. No modo LLM, envia a pergunta e os trechos ao provedor e exige saída estruturada com citações.
6. O usuário pode abrir cada referência e comparar o trecho citado com o documento original.

## Componentes e contratos

- `web`: interface React, estados de carregamento, erro, ausência de evidências e sucesso. Não contém segredos nem chama o provedor diretamente.
- `api`: validação, recuperação, adaptador de respostas e validação de evidências. `POST /api/ask` recebe `{ question, mode }`; retorna `{ mode, answer, citations, evidence, validation }`. `GET /api/documents` lista os documentos públicos.
- `core`: ingestão, fragmentação, busca e validação, sem dependência da interface ou transporte MCP.
- `mcp`: ferramentas de leitura com validação de entrada e respostas estruturadas. Testes comprovam equivalência entre os resultados de busca da API e do MCP.
- `corpus`: documentos originais versionados e casos de avaliação com perguntas, fontes esperadas e perguntas não respondíveis.

Usar uma estrutura simples de workspace TypeScript. Não adicionar banco de dados ou infraestrutura externa para a primeira versão.

## Confiabilidade e limites

Tratar o conteúdo recuperado como dados, nunca como instruções. Testar um documento que contenha instruções adversariais para verificar a separação. Chaves ficam em variáveis de ambiente no servidor, com exemplos sem valores reais. Limites de entrada, saída e timeout do provedor são explícitos. Erros de provedor não expõem detalhes internos nem credenciais.

Uma referência válida não garante que toda afirmação seja sustentada. O painel de validação distingue verificação estrutural, correspondência de trechos e limites de verificação semântica. Nenhuma alegação de produção, precisão ou segurança será publicada sem evidência correspondente.

## Critérios de aceitação

1. Instalação e execução local documentadas a partir de um checkout limpo; demo sem chave externa.
2. Perguntas de referência recuperam os documentos esperados; resultados são determinísticos e ordenados com desempate estável.
3. Pergunta sem resposta na coleção apresenta abstenção explícita.
4. Toda citação aceita aponta para um fragmento existente; trechos citados correspondem ao conteúdo fonte. Saídas inválidas do adaptador são rejeitadas.
5. Interface permite inspecionar as fontes por teclado e distingue modo demo de modo LLM.
6. Testes de MCP exercitam as ferramentas pelo protocolo, além dos testes do serviço compartilhado.
7. Playwright cobre pergunta respondível, abstenção, erro e inspeção de fontes.
8. CI executa testes, avaliação, verificação de tipos e build. Métricas publicadas são obtidas das execuções, sem resultados inventados.
9. README explica a finalidade de recrutamento, arquitetura, escolhas e limitações; separa funcionalidades implementadas de extensões futuras.

## Etapas posteriores

Após a primeira versão validada: embeddings semânticos opcionais com comparação de avaliação; demonstração online com controle de custos; vídeo curto; integração ao site de portfólio. Essas extensões não impedem concluir e apresentar a versão inicial.

## Qualidade de código e evolução

Regras detalhadas: `docs/engineering-quality.md`. Devem ser copiadas para o projeto e referenciadas pelo `AGENTS.md` da raiz antes da implementação.

- Código direto, com nomes claros, funções coesas e composição. Evitar abstrações sem necessidade demonstrada, duplicação de regras, estados redundantes e componentes que misturem transporte, regras de negócio e apresentação.
- TypeScript strict, sem `any` explícito; validação nas fronteiras e contratos compartilhados. ESLint e formatação são gates do CI. Complexidade ciclomática máxima 10 por função; exceções precisam de justificativa local e revisão, sem desativar regras globalmente.
- Core independente de React, HTTP, MCP e SDK de LLM. Dependências apontam dos adaptadores para os contratos do domínio. Trocar o provedor ou a recuperação não deve exigir reescrever a interface.
- Índice carregado uma vez no startup, buscas sem IO por pergunta, limites de concorrência no provedor, cancelamento e observabilidade sem conteúdo das perguntas. Escalabilidade é demonstrada por limites e medições reproduzíveis, sem alegar capacidade de produção.
- Testes comprovam comportamentos e contratos, com casos adversariais e falhas. Cobertura mede lacunas; não substituir qualidade por porcentagem ou snapshots indiscriminados.

## UX e design de interface

Brief detalhado: `docs/ux-design.md`. A implementação começa por uma proposta visual e seu fluxo, cobrindo todos os estados antes de codificar componentes.

Uma ferramenta de leitura e verificação, com tipografia confortável, hierarquia visual clara e uso contido de cor. A pergunta e a resposta são o foco; fontes e verificações aparecem por divulgação progressiva, sem transformar a tela em um painel técnico.

Componentes reutilizáveis, tokens de design, Storybook para estados relevantes e verificações de acessibilidade e regressão visual fazem parte da entrega. Validar desktop e mobile, teclado, contraste, loading, erro, ausência de evidências e respostas longas. Meta de acessibilidade: WCAG 2.2 AA nos critérios aplicáveis, sem alegar certificação a partir de testes automáticos.

A skill UI UX Pro Max foi instalada neste workspace e aplicada ao brief de UX em 6 de outubro de 2026: `.agents/skills/ui-ux-pro-max/SKILL.md`. Suas recomendações foram verificadas e adaptadas ao produto em `docs/ux-design.md`; aplicar a skill novamente nas decisões de interface e revisão visual. Figma pode ser utilizado para artefatos de design quando necessário, com as skills correspondentes.
