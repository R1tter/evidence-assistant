import { documentMessages } from './messages.js';
const updates = {
  'pt-BR': {
    historyTitle: 'Histórico da sessão',
    historyHelp:
      'Perguntas concluídas ficam disponíveis enquanto este documento estiver aberto.',
    historyEmpty: 'Nenhuma pergunta concluída ainda.',
    revisionLabel: 'Revisão',
    currentRevision: 'Revisão atual',
    previousRevision: 'Revisão anterior',
    historyStaleHelp:
      'Esta resposta usa uma versão anterior do texto. Os trechos abaixo pertencem àquela revisão.',
    exportSession: 'Exportar sessão em TXT',
    exportHelp:
      'Baixa a transcrição salva, perguntas, respostas e trechos citados. Rascunhos não salvos ficam de fora. O arquivo salvo permanece no seu dispositivo.',
    savedTranscript: 'Transcrição salva',
    exportFailed: 'Não foi possível baixar o arquivo. Tente novamente.',

    compareTab: 'Comparar',
    searchDocument: 'Buscar no documento',
    previousMatch: 'Resultado anterior',
    nextMatch: 'Próximo resultado',
    clearSearch: 'Limpar busca',
    searchCount: '{current} de {total}',
    noSearchResults:
      'Nenhum resultado. Tente outra palavra ou confira a transcrição.',
    searchPrompt: 'Digite uma palavra para localizar no texto.',
    searchHelp:
      'Busca literal na transcrição salva, sem distinguir maiúsculas de minúsculas.',
    linkScroll: 'Vincular rolagem',
    linkScrollHelp:
      'Acompanha a posição proporcional na página; não alinha palavras.',

    syncingTitle: 'Recuperando a sessão',
    syncingBody:
      'Conferindo a revisão salva no servidor. Seus rascunhos locais são preservados.',
    retrySync: 'Recuperar sessão',
    originEmbedded: 'Texto extraído do arquivo',
    originVision: 'Transcrição por IA · confira o original',
    originReviewed: 'Texto corrigido por você',
    modeAi: 'IA · resposta gerada',
    answerExtracted: 'Resposta extrativa · frase do documento',
    readingTitle: 'Lendo o arquivo',
    readingBody: 'Preparando as páginas e o texto. Você pode cancelar.',
    ocrTitle: 'Reconhecendo texto',
    ocrBody:
      'Enviando as páginas selecionadas ao provedor configurado. Você pode cancelar.',
    revisionHelp:
      'Salvar cria uma nova revisão e remove respostas baseadas no texto anterior.',
    footerNote:
      'Sessão temporária de 30 minutos · sem armazenamento permanente',
    originalNotice:
      'A interface pode mudar de idioma; seu documento mantém o idioma original.',
    noEvidenceTitle: 'Não encontrei uma resposta suficiente.',
    noEvidenceBody:
      'Tente uma pergunta com palavras do documento ou revise a transcrição. O modo extrativo não faz busca semântica entre idiomas.',
    checksBody:
      'A citação corresponde à transcrição desta revisão. Isso não verifica a qualidade de OCR, a veracidade do original ou a correção semântica da resposta.',
    privacyBody:
      'O original fica no navegador. O texto consultável é enviado ao servidor e mantido em uma sessão temporária, excluída após 30 minutos sem atividade.',
    errorTitle: 'Não foi possível concluir',
  },
  en: {
    historyTitle: 'Session history',
    historyHelp:
      'Completed questions remain available while this document is open.',
    historyEmpty: 'No completed questions yet.',
    revisionLabel: 'Revision',
    currentRevision: 'Current revision',
    previousRevision: 'Previous revision',
    historyStaleHelp:
      'This answer uses a previous text version. The excerpts below belong to that revision.',
    exportSession: 'Export session as TXT',
    exportHelp:
      'Downloads the saved transcript, questions, answers and quoted excerpts. Unsaved drafts are excluded. The saved file remains on your device.',
    savedTranscript: 'Saved transcript',
    exportFailed: 'The file could not be downloaded. Try again.',

    compareTab: 'Compare',
    searchDocument: 'Search document',
    previousMatch: 'Previous result',
    nextMatch: 'Next result',
    clearSearch: 'Clear search',
    searchCount: '{current} of {total}',
    noSearchResults: 'No results. Try another word or check the transcript.',
    searchPrompt: 'Type a word to find it in the text.',
    searchHelp: 'Literal search in the saved transcript, ignoring letter case.',
    linkScroll: 'Link scrolling',
    linkScrollHelp:
      'Follows the proportional position on the page; does not align words.',

    syncingTitle: 'Recovering session',
    syncingBody:
      'Checking the saved server revision. Local drafts are preserved.',
    retrySync: 'Recover session',
    originEmbedded: 'Text extracted from the file',
    originVision: 'AI transcription · inspect the original',
    originReviewed: 'Text corrected by you',
    modeAi: 'AI · generated answer',
    answerExtracted: 'Extractive answer · sentence from the document',
    readingTitle: 'Reading file',
    readingBody: 'Preparing pages and text. You can cancel.',
    ocrTitle: 'Recognizing text',
    ocrBody:
      'Sending selected pages to the configured provider. You can cancel.',
    revisionHelp:
      'Saving creates a new revision and removes answers based on the previous text.',
    footerNote: 'Temporary 30-minute session · no permanent storage',
    originalNotice:
      'The interface can change language; your document keeps its original language.',
    noEvidenceTitle: 'I could not find sufficient evidence.',
    noEvidenceBody:
      'Try a question using words from the document or review its transcript. Extractive mode does not perform semantic search across languages.',
    checksBody:
      'The citation matches this revision of the transcript. It does not verify OCR quality, source truth or the semantic correctness of the answer.',
    privacyBody:
      'The original stays in your browser. Searchable text is sent to the server in a temporary session, removed after 30 minutes of inactivity.',
    errorTitle: 'The operation could not finish',
  },
  es: {
    historyTitle: 'Historial de la sesión',
    historyHelp:
      'Las preguntas completadas siguen disponibles mientras este documento esté abierto.',
    historyEmpty: 'Todavía no hay preguntas completadas.',
    revisionLabel: 'Revisión',
    currentRevision: 'Revisión actual',
    previousRevision: 'Revisión anterior',
    historyStaleHelp:
      'Esta respuesta usa una versión anterior del texto. Los fragmentos siguientes pertenecen a esa revisión.',
    exportSession: 'Exportar sesión en TXT',
    exportHelp:
      'Descarga la transcripción guardada, preguntas, respuestas y fragmentos citados. No incluye borradores sin guardar. El archivo guardado permanece en tu dispositivo.',
    savedTranscript: 'Transcripción guardada',
    exportFailed: 'No se pudo descargar el archivo. Inténtalo de nuevo.',

    compareTab: 'Comparar',
    searchDocument: 'Buscar en el documento',
    previousMatch: 'Resultado anterior',
    nextMatch: 'Resultado siguiente',
    clearSearch: 'Limpiar búsqueda',
    searchCount: '{current} de {total}',
    noSearchResults:
      'Sin resultados. Prueba otra palabra o revisa la transcripción.',
    searchPrompt: 'Escribe una palabra para localizarla en el texto.',
    searchHelp:
      'Búsqueda literal en la transcripción guardada, sin distinguir mayúsculas.',
    linkScroll: 'Vincular desplazamiento',
    linkScrollHelp:
      'Sigue la posición proporcional en la página; no alinea palabras.',

    syncingTitle: 'Recuperando sesión',
    syncingBody:
      'Comprobando la revisión guardada. Se conservan los borradores locales.',
    retrySync: 'Recuperar sesión',
    originEmbedded: 'Texto extraído del archivo',
    originVision: 'Transcripción por IA · comprueba el original',
    originReviewed: 'Texto corregido por ti',
    modeAi: 'IA · respuesta generada',
    answerExtracted: 'Respuesta extractiva · frase del documento',
    readingTitle: 'Leyendo el archivo',
    readingBody: 'Preparando las páginas y el texto. Puedes cancelar.',
    ocrTitle: 'Reconociendo texto',
    ocrBody:
      'Enviando las páginas seleccionadas al proveedor configurado. Puedes cancelar.',
    revisionHelp:
      'Guardar crea una nueva revisión y elimina respuestas basadas en el texto anterior.',
    footerNote: 'Sesión temporal de 30 minutos · sin almacenamiento permanente',
    originalNotice:
      'La interfaz puede cambiar de idioma; tu documento conserva el idioma original.',
    noEvidenceTitle: 'No encontré evidencia suficiente.',
    noEvidenceBody:
      'Prueba una pregunta con palabras del documento o revisa su transcripción. El modo extractivo no realiza búsqueda semántica entre idiomas.',
    checksBody:
      'La cita coincide con la transcripción de esta revisión. No verifica la calidad de OCR, la veracidad del original ni la corrección semántica de la respuesta.',
    privacyBody:
      'El original permanece en el navegador. El texto consultable se envía al servidor en una sesión temporal, eliminada tras 30 minutos de inactividad.',
    errorTitle: 'No se pudo completar la operación',
  },
};
export const workspaceMessages = {
  'pt-BR': { ...documentMessages['pt-BR'], ...updates['pt-BR'] },
  en: { ...documentMessages.en, ...updates.en },
  es: { ...documentMessages.es, ...updates.es },
};
