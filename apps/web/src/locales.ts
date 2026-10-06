export const en = {
  language: 'Language',
  purpose: 'Read the answer. Inspect the evidence.',
  title: 'Ask a question. Keep the sources in view.',
  intro:
    'Explore four original documents about API contracts, evidence checks, CI quality gates and regression testing.',
  question: 'Your question',
  help: 'English collection · up to 1,000 characters. Sources and extractive answers keep their original language.',
  mode: 'Answer mode',
  demo: 'Demo · extractive answers',
  ai: 'AI · generated answers',
  modeHelp:
    'Demo selects exact source sentences. AI generates text from retrieved excerpts.',
  unavailable: 'AI is unavailable. Demo works without external credentials.',
  ask: 'Ask the collection',
  cancel: 'Cancel',
  answer: 'Answer',
  sources: 'Sources',
  loading: 'Searching the collection… You can cancel this request.',
  initial: 'Choose a suggested question or write your own.',
  abstention:
    'The collection does not contain enough evidence to answer this question.',
  suggestion:
    'Try asking about citations, API contracts, CI gates or regression testing.',
  error: 'We could not complete this request. Your question is still here.',
  retry: 'Try again',
  checks: 'What was checked?',
  limits:
    'Structure, source identifiers and exact quotes were checked. Semantic correctness and source truth remain unverified.',
  read: 'Read original document',
  sourceError: 'Could not load the original source.',
  relevance: 'Lexical relevance',
  original: 'Original language: English',
  examples: [
    'How are citations checked?',
    'What should CI check?',
    'How should tests be selected?',
  ],
  footer: 'Independent project · original collection',
  skip: 'Skip to question',
};
export type Messages = Omit<typeof en, 'examples'> & { examples: string[] };
export type Locale = 'en' | 'pt-BR' | 'es';
const pt: Messages = {
  language: 'Idioma',
  purpose: 'Leia a resposta. Confira as evidências.',
  title: 'Faça uma pergunta. Mantenha as fontes à vista.',
  intro:
    'Explore quatro documentos originais sobre contratos de API, verificação de evidências, qualidade no CI e testes de regressão.',
  question: 'Sua pergunta',
  help: 'Coleção em inglês · até 1.000 caracteres. Fontes e respostas extrativas mantêm o idioma original.',
  mode: 'Modo de resposta',
  demo: 'Demo · respostas extrativas',
  ai: 'IA · respostas geradas',
  modeHelp:
    'O demo seleciona frases exatas das fontes. A IA gera texto dos trechos recuperados.',
  unavailable: 'IA indisponível. O demo funciona sem credenciais externas.',
  ask: 'Consultar a coleção',
  cancel: 'Cancelar',
  answer: 'Resposta',
  sources: 'Fontes',
  loading: 'Consultando a coleção… Você pode cancelar esta solicitação.',
  initial: 'Escolha uma pergunta sugerida ou escreva a sua.',
  abstention:
    'A coleção não contém evidências suficientes para responder a esta pergunta.',
  suggestion:
    'Pergunte sobre citações, contratos de API, qualidade no CI ou testes de regressão.',
  error:
    'Não foi possível concluir a solicitação. Sua pergunta foi preservada.',
  retry: 'Tentar novamente',
  checks: 'O que foi verificado?',
  limits:
    'Estrutura, identificadores das fontes e correspondência exata das citações foram verificados. Correção semântica e veracidade das fontes não foram verificadas.',
  read: 'Ler documento original',
  sourceError: 'Não foi possível carregar a fonte original.',
  relevance: 'Relevância lexical',
  original: 'Idioma original: inglês',
  examples: [
    'Como as citações são verificadas?',
    'O que o CI deve verificar?',
    'Como selecionar os testes?',
  ],
  footer: 'Projeto independente · coleção original',
  skip: 'Ir para a pergunta',
};
const es: Messages = {
  language: 'Idioma',
  purpose: 'Lee la respuesta. Revisa las evidencias.',
  title: 'Haz una pregunta. Mantén las fuentes a la vista.',
  intro:
    'Explora cuatro documentos originales sobre contratos de API, evidencias, calidad en CI y pruebas de regresión.',
  question: 'Tu pregunta',
  help: 'Colección en inglés · hasta 1.000 caracteres. Las fuentes y respuestas extractivas conservan el idioma original.',
  mode: 'Modo de respuesta',
  demo: 'Demo · respuestas extractivas',
  ai: 'IA · respuestas generadas',
  modeHelp:
    'El demo selecciona frases exactas de las fuentes. La IA genera texto de los fragmentos recuperados.',
  unavailable: 'IA no disponible. El demo funciona sin credenciales externas.',
  ask: 'Consultar la colección',
  cancel: 'Cancelar',
  answer: 'Respuesta',
  sources: 'Fuentes',
  loading: 'Consultando la colección… Puedes cancelar esta solicitud.',
  initial: 'Elige una pregunta sugerida o escribe la tuya.',
  abstention:
    'La colección no contiene evidencias suficientes para responder a esta pregunta.',
  suggestion:
    'Pregunta sobre citas, contratos de API, calidad en CI o pruebas de regresión.',
  error: 'No se pudo completar la solicitud. Tu pregunta se ha conservado.',
  retry: 'Intentar de nuevo',
  checks: '¿Qué se verificó?',
  limits:
    'Se verificaron la estructura, los identificadores y las citas exactas. La corrección semántica y la veracidad de las fuentes no se verificaron.',
  read: 'Leer documento original',
  sourceError: 'No se pudo cargar la fuente original.',
  relevance: 'Relevancia léxica',
  original: 'Idioma original: inglés',
  examples: [
    '¿Cómo se verifican las citas?',
    '¿Qué debe verificar el CI?',
    '¿Cómo seleccionar las pruebas?',
  ],
  footer: 'Proyecto independiente · colección original',
  skip: 'Ir a la pregunta',
};
export const messages: Record<Locale, Messages> = { en, 'pt-BR': pt, es };
