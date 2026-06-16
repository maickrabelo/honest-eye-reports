export interface PulseTemplateQuestion {
  text: string;
  category: string;
}

export interface PulseTemplate {
  id: string;
  name: string;
  description: string;
  questions: PulseTemplateQuestion[];
}

export const PULSE_SURVEY_TEMPLATES: PulseTemplate[] = [
  {
    id: 'bem-estar',
    name: 'Bem-estar',
    description: 'Humor, energia e estresse percebido no período.',
    questions: [
      { text: 'Como você se sentiu em relação ao seu humor no último período?', category: 'Bem-estar' },
      { text: 'Como avalia sua energia e disposição no trabalho?', category: 'Bem-estar' },
      { text: 'O quanto você se sentiu tranquilo(a) e com baixo nível de estresse?', category: 'Bem-estar' },
      { text: 'Você consegue equilibrar trabalho e descanso?', category: 'Bem-estar' },
    ],
  },
  {
    id: 'engajamento',
    name: 'Engajamento',
    description: 'Motivação, propósito e reconhecimento.',
    questions: [
      { text: 'Estou motivado(a) com o trabalho que tenho realizado.', category: 'Engajamento' },
      { text: 'Sinto propósito no que faço todos os dias.', category: 'Engajamento' },
      { text: 'Recebo reconhecimento adequado pelo meu desempenho.', category: 'Engajamento' },
      { text: 'Recomendaria a empresa como um bom lugar para trabalhar.', category: 'Engajamento' },
    ],
  },
  {
    id: 'carga-trabalho',
    name: 'Carga de Trabalho',
    description: 'Volume de demandas, prazos e equilíbrio.',
    questions: [
      { text: 'Meu volume de trabalho está em um nível adequado.', category: 'Carga' },
      { text: 'Os prazos definidos são realistas.', category: 'Carga' },
      { text: 'Consigo concluir minhas tarefas dentro do horário de trabalho.', category: 'Carga' },
    ],
  },
];

export const EMOJI_SCALE: { score: 1 | 2 | 3 | 4 | 5; emoji: string; label: string }[] = [
  { score: 1, emoji: '😡', label: 'Muito ruim' },
  { score: 2, emoji: '😕', label: 'Ruim' },
  { score: 3, emoji: '😐', label: 'Neutro' },
  { score: 4, emoji: '🙂', label: 'Bom' },
  { score: 5, emoji: '😄', label: 'Muito bom' },
];

export const LIKERT_SCALE: { score: 1 | 2 | 3 | 4 | 5; label: string }[] = [
  { score: 1, label: 'Discordo totalmente' },
  { score: 2, label: 'Discordo' },
  { score: 3, label: 'Neutro' },
  { score: 4, label: 'Concordo' },
  { score: 5, label: 'Concordo totalmente' },
];
