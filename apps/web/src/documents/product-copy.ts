import { documentMessages } from './messages.js';
const updates = {
  'pt-BR': {
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
