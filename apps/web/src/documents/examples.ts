export type ExampleLocale = 'en' | 'pt-BR' | 'es';
export type ExampleKind = 'manual' | 'scan' | 'note';
export interface DocumentExample {
  id: string;
  locale: ExampleLocale;
  kind: ExampleKind;
  title: string;
  text: string;
  questions: string[];
  file: string;
  thumbnail: string;
  prepared: true;
}
interface ExampleContent {
  title: string;
  text: string;
  questions: string[];
}
const content: Record<ExampleLocale, Record<ExampleKind, ExampleContent>> = {
  'pt-BR': {
    manual: {
      title: 'Cuidado com uma planta',
      text: 'Cuidado com uma planta\nRegue a planta duas vezes por semana. Coloque o vaso perto de uma janela com luz indireta. Verifique se a terra está seca antes de regar. Não deixe água acumulada no prato.',
      questions: [
        'Quantas vezes devo regar a planta?',
        'Onde colocar o vaso?',
        'O que verificar antes de regar?',
      ],
    },
    scan: {
      title: 'Oficina criativa',
      text: 'Oficina criativa\nA oficina começa às 14h no sábado. Os materiais estão incluídos. Leve um avental e uma garrafa de água. O encontro acontece na sala 2 e termina às 17h.',
      questions: [
        'A que horas começa a oficina?',
        'Preciso levar um avental?',
        'Onde acontece o encontro?',
      ],
    },
    note: {
      title: 'Anotação de viagem',
      text: 'Anotação de viagem\nEncontrar Ana na estação às 9h. Levar o caderno azul e a câmera. O trem sai às 9h30 da plataforma 3. Comprar água antes de embarcar.',
      questions: [
        'A que horas encontrar Ana?',
        'O que devo levar?',
        'De qual plataforma sai o trem?',
      ],
    },
  },
  en: {
    manual: {
      title: 'Caring for a plant',
      text: 'Caring for a plant\nWater the plant twice a week. Place the pot near a window with indirect light. Check that the soil is dry before watering. Do not leave standing water in the saucer.',
      questions: [
        'How often should I water the plant?',
        'Where should I place the pot?',
        'What should I check before watering?',
      ],
    },
    scan: {
      title: 'Creative workshop',
      text: 'Creative workshop\nThe workshop starts at 14:00 on Saturday. Materials are included. Bring an apron and a bottle of water. The meeting takes place in room 2 and ends at 17:00.',
      questions: [
        'What time does the workshop start?',
        'What should I bring?',
        'Where does the meeting take place?',
      ],
    },
    note: {
      title: 'Travel note',
      text: 'Travel note\nMeet Ana at the station at 09:00. Bring the blue notebook and the camera. The train leaves at 09:30 from platform 3. Buy water before boarding.',
      questions: [
        'What time should I meet Ana?',
        'What should I bring?',
        'Which platform does the train leave from?',
      ],
    },
  },
  es: {
    manual: {
      title: 'Cuidado de una planta',
      text: 'Cuidado de una planta\nRiega la planta dos veces por semana. Coloca la maceta cerca de una ventana con luz indirecta. Comprueba que la tierra esté seca antes de regar. No dejes agua acumulada en el plato.',
      questions: [
        '¿Cuántas veces debo regar la planta?',
        '¿Dónde colocar la maceta?',
        '¿Qué comprobar antes de regar?',
      ],
    },
    scan: {
      title: 'Taller creativo',
      text: 'Taller creativo\nEl taller empieza a las 14:00 el sábado. Los materiales están incluidos. Lleva un delantal y una botella de agua. El encuentro tiene lugar en la sala 2 y termina a las 17:00.',
      questions: [
        '¿A qué hora empieza el taller?',
        '¿Necesito un delantal?',
        '¿Dónde tiene lugar el encuentro?',
      ],
    },
    note: {
      title: 'Nota de viaje',
      text: 'Nota de viaje\nEncontrar a Ana en la estación a las 09:00. Llevar el cuaderno azul y la cámara. El tren sale a las 09:30 del andén 3. Comprar agua antes de embarcar.',
      questions: [
        '¿A qué hora encontrar a Ana?',
        '¿Qué debo llevar?',
        '¿De qué andén sale el tren?',
      ],
    },
  },
};
export function documentExamples(locale: ExampleLocale): DocumentExample[] {
  return (['manual', 'scan', 'note'] as const).map((kind) => ({
    ...content[locale][kind],
    id: `${locale}-${kind}`,
    locale,
    kind,
    prepared: true,
    file: `/examples/${locale}/${kind}.${kind === 'manual' ? 'pdf' : 'png'}`,
    thumbnail: `/examples/${locale}/${kind}.png`,
  }));
}
