import type { ExampleLocale } from './examples.js';
export function errorCopy(locale: ExampleLocale, code: string) {
  const messages: Record<ExampleLocale, Record<string, string>> = {
    'pt-BR': {
      SECTION_TOO_LARGE:
        'A conclusão completa excede o limite da resposta. Confira a seção inteira na transcrição do documento.',
      SESSION_UNCERTAIN:
        'Não foi possível confirmar a revisão salva. Recupere a revisão antes de continuar; seu rascunho foi preservado.',
      FILE_TOO_LARGE: 'O arquivo ou as páginas selecionadas excedem 10 MiB.',
      IMAGE_TOO_LARGE:
        'A imagem excede 16 megapixels ou as dimensões permitidas.',
      TOO_MANY_PAGES: 'O PDF pode ter até cinco páginas.',
      PROTECTED_PDF: 'Este PDF é protegido. Use uma cópia sem senha.',
      INVALID_FILE:
        'Não foi possível ler este arquivo. Confira se é um PDF, PNG ou JPEG válido.',
      UNSUPPORTED_FILE: 'Use PDF, PNG ou JPEG.',
      TEXT_TOO_LARGE: 'O texto excede 40.000 caracteres.',
      READ_TIMEOUT: 'A leitura excedeu 15 segundos. Tente um arquivo menor.',
      PROVIDER_TIMEOUT:
        'O reconhecimento ou a resposta excedeu o prazo. Seu texto foi preservado.',
      PROVIDER_BUSY: 'O serviço está ocupado. Tente novamente em instantes.',
      REVISION_CONFLICT:
        'O texto mudou. A revisão disponível foi recuperada; confira o texto antes de continuar.',
    },
    en: {
      SECTION_TOO_LARGE:
        'The complete conclusion exceeds the answer limit. Read the entire section in the document transcription.',
      SESSION_UNCERTAIN:
        'The saved revision could not be confirmed. Recover it before continuing; your draft was preserved.',
      FILE_TOO_LARGE: 'The file or selected pages exceed 10 MiB.',
      IMAGE_TOO_LARGE:
        'The image exceeds 16 megapixels or the dimension limit.',
      TOO_MANY_PAGES: 'PDFs may contain up to five pages.',
      PROTECTED_PDF: 'This PDF is protected. Use an unprotected copy.',
      INVALID_FILE:
        'This file could not be read. Check that it is a valid PDF, PNG or JPEG.',
      UNSUPPORTED_FILE: 'Use PDF, PNG or JPEG.',
      TEXT_TOO_LARGE: 'The text exceeds 40,000 characters.',
      READ_TIMEOUT: 'Reading exceeded 15 seconds. Try a smaller file.',
      PROVIDER_TIMEOUT:
        'Recognition or answering exceeded its deadline. Your text was preserved.',
      PROVIDER_BUSY: 'The service is busy. Try again shortly.',
      REVISION_CONFLICT:
        'The text changed. The available revision was recovered; check the text before continuing.',
    },
    es: {
      SECTION_TOO_LARGE:
        'La conclusión completa supera el límite de respuesta. Consulta la sección entera en la transcripción del documento.',
      SESSION_UNCERTAIN:
        'No se pudo confirmar la revisión guardada. Recupérala antes de continuar; se conservó tu borrador.',
      FILE_TOO_LARGE: 'El archivo o las páginas seleccionadas superan 10 MiB.',
      IMAGE_TOO_LARGE:
        'La imagen supera 16 megapíxeles o el límite de dimensiones.',
      TOO_MANY_PAGES: 'El PDF puede tener hasta cinco páginas.',
      PROTECTED_PDF: 'Este PDF está protegido. Usa una copia sin contraseña.',
      INVALID_FILE:
        'No se pudo leer el archivo. Comprueba que sea un PDF, PNG o JPEG válido.',
      UNSUPPORTED_FILE: 'Usa PDF, PNG o JPEG.',
      TEXT_TOO_LARGE: 'El texto supera 40.000 caracteres.',
      READ_TIMEOUT: 'La lectura superó 15 segundos. Prueba un archivo menor.',
      PROVIDER_TIMEOUT:
        'El reconocimiento o la respuesta superó el plazo. Se conservó tu texto.',
      PROVIDER_BUSY: 'El servicio está ocupado. Inténtalo de nuevo más tarde.',
      REVISION_CONFLICT:
        'El texto cambió. Vuelve a abrir el documento antes de continuar.',
    },
  };
  return (
    messages[locale][code] ??
    {
      'pt-BR':
        'Não foi possível concluir. Seu trabalho disponível foi preservado; tente novamente.',
      en: 'The operation could not finish. Available work was preserved; try again.',
      es: 'No se pudo completar. Se conservó el trabajo disponible; vuelve a intentarlo.',
    }[locale]
  );
}
