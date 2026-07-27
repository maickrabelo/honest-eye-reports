// Diagnóstico de Clima, Bem-Estar e Riscos Psicossociais (NR-01) — Aprendizagem CLASA
// Instrumento exclusivo (Futuramed). 29 questões objetivas (escala 1-3) + 1 campo aberto.

export type CLASACategory = "eixo_a" | "eixo_b" | "eixo_c" | "eixo_d" | "eixo_e" | "eixo_f" | "eixo_g" | "eixo_h" | "eixo_i" | "sintese";

export interface CLASAQuestion {
  number: number;
  text: string;
  category: CLASACategory;
  options: { value: number; label: string }[];
}

export const CLASA_CATEGORY_LABELS: Record<CLASACategory, string> = {
  "eixo_a": "Clima Social e Relações Interpessoais",
  "eixo_b": "Carga Mental e Organização da Rotina",
  "eixo_c": "Infraestrutura e Ergonomia",
  "eixo_d": "Propósito e Valorização Profissional",
  "eixo_e": "Prevenção de Riscos e Integridade Moral",
  "eixo_f": "Comunicação e Transparência",
  "eixo_g": "Escuta Ativa e Reconhecimento",
  "eixo_h": "Adaptação Profissional e Saúde Emocional",
  "eixo_i": "Diversidade, Inclusão e Equidade",
  "sintese": "Síntese e Recomendação"
};

export const CLASA_CATEGORY_ORDER: CLASACategory[] = ["eixo_a", "eixo_b", "eixo_c", "eixo_d", "eixo_e", "eixo_f", "eixo_g", "eixo_h", "eixo_i", "sintese"];

export const CLASA_OPEN_QUESTION = "Sinta-se à vontade para registrar elogios, críticas ou sugestões de melhorias para aperfeiçoar a rotina na CLASA:";

export const CLASA_QUESTIONS: CLASAQuestion[] = [
  { number: 1, category: "eixo_a", text: "Em que medida você sente que é tratado(a) de forma humana e respeitosa por facilitadores, mentores e equipe da CLASA?", options: [{ value: 1, label: "Respeito e acolhimento total em todas as interações do dia a dia." }, { value: 2, label: "A convivência é formal e correta, mas com certa distância." }, { value: 3, label: "Sinto falta de consideração ou já vivenciei episódios de constrangimento." }] },
  { number: 2, category: "eixo_a", text: "Qual é o nível de cooperação e respeito que você observa no dia a dia entre os jovens da sua turma?", options: [{ value: 1, label: "Alto companheirismo, apoio mútuo e bom espírito de equipe." }, { value: 2, label: "Relações amigáveis, embora existam pequenos grupos isolados." }, { value: 3, label: "Ambiente competitivo, com atritos, fofocas ou exclusão evidente." }] },
  { number: 3, category: "eixo_a", text: "Caso enfrente um momento de grande vulnerabilidade emocional ou pessoal, você encontra um canal seguro para conversar na CLASA?", options: [{ value: 1, label: "Sim, há pessoas de confiança e espaços abertos para me escutar." }, { value: 2, label: "Sei quem procurar, mas fico hesitante em desabafar sobre temas pessoais." }, { value: 3, label: "Não percebo abertura nem suporte estruturado para lidar com questões emocionais." }] },
  { number: 4, category: "eixo_b", text: "O ritmo de entregas, exames e atividades solicitadas pela CLASA é compatível com o seu tempo de aprendizado?", options: [{ value: 1, label: "Totalmente adequado, permitindo absorver os conteúdos sem desgaste exagerado." }, { value: 2, label: "Exige bastante agilidade, gerando correria em dias específicos." }, { value: 3, label: "Pressionado(a) e sobrecarregado(a) com a quantidade de cobranças sobrepostas." }] },
  { number: 5, category: "eixo_b", text: "Como os horários destinados aos intervalos para descanso e refeições repercutem na sua disposição física e mental?", options: [{ value: 1, label: "Permitem relaxar a mente, alimentar-se sem pressa e renovar a energia." }, { value: 2, label: "O tempo atende o básico, mas a pausa parece um pouco apressada." }, { value: 3, label: "O tempo é insuficiente, fazendo com que eu retorne à sala com fadiga acumulada." }] },
  { number: 6, category: "eixo_b", text: "De que forma as demandas da CLASA afetam o seu bem-estar fora da instituição (vida familiar, lazer e sono)?", options: [{ value: 1, label: "Há um equilíbrio saudável entre o programa e os meus compromissos pessoais." }, { value: 2, label: "Consigo gerenciar, embora por vezes tenha que abdicar de momentos de descanso." }, { value: 3, label: "O desgaste compromete minha rotina pessoal, gerando estresse e insônia." }] },
  { number: 7, category: "eixo_c", text: "Qual é o grau de conforto postural das mobílias (assentos, bancadas e espaço de circulação) disponíveis nas salas da CLASA?", options: [{ value: 1, label: "Excelente ergonomia, permitindo passar várias horas sem incômodos no corpo." }, { value: 2, label: "Condição mediana, o mobiliário atende mas ocasiona cansaço ao longo do dia." }, { value: 3, label: "Estrutura inadequada, causando dores musculares, nas costas ou postura desconfortável." }] },
  { number: 8, category: "eixo_c", text: "A climatização e a iluminação dos espaços de estudo na CLASA proporcionam um ambiente agradável para o aprendizado?", options: [{ value: 1, label: "Sim, as condições térmicas e visuais são ótimas para manter o foco." }, { value: 2, label: "Espaço por vezes muito quente/frio ou com iluminação fraca, mas tolerável." }, { value: 3, label: "Condições ruins que costumam provocar sonolência, vista cansada ou dores de cabeça." }] },
  { number: 9, category: "eixo_c", text: "O nível sonoro (ruídos externos ou internos) na CLASA permite que você preste atenção nas explicações sem distrações constantes?", options: [{ value: 1, label: "Sim, os ambientes são acusticamente bem isolados e silenciosos." }, { value: 2, label: "Eventuais barulhos atrapalham pontualmente, mas é possível acompanhar." }, { value: 3, label: "Ruído excessivo e frequente que compromete meu aprendizado e gera irritação." }] },
  { number: 10, category: "eixo_d", text: "As competências técnicas e comportamentais desenvolvidas na CLASA agregam valor real ao seu futuro no mercado?", options: [{ value: 1, label: "Muito úteis, sinto que estou adquirindo bagagem prática e relevante." }, { value: 2, label: "Parcialmente, alguns temas são práticos e outros parecem meramente teóricos." }, { value: 3, label: "Sinto pouca aplicação prática nos assuntos abordados no meu dia a dia." }] },
  { number: 11, category: "eixo_d", text: "Qual é o seu nível médio de energia e disposição para participar dos encontros na CLASA ao longo da semana?", options: [{ value: 1, label: "Elevado, chego motivado(a) e com vontade de absorver novos conteúdos." }, { value: 2, label: "Neutro, cumpro a programação por ser um dever associado ao contrato." }, { value: 3, label: "Baixo, sinto desânimo frequente e desmotivação para comparecer." }] },
  { number: 12, category: "eixo_d", text: "Como você avalia a complexidade das tarefas que lhe são propostas nas dinâmicas e módulos teóricos?", options: [{ value: 1, label: "Desafios bem dosados que instigam o raciocínio e o crescimento contínuo." }, { value: 2, label: "Atividades razoáveis, embora por vezes se tornem meio repetitivas." }, { value: 3, label: "Dinâmicas excessivamente simples ou mecânicas, provocando desinteresse." }] },
  { number: 13, category: "eixo_e", text: "Ao longo da sua trajetória na CLASA, você já sofreu ou observou práticas caracterizadas como assédio moral (exposição ridícula, broncas abusivas ou apelidos)?", options: [{ value: 1, label: "Nenhuma situação do gênero ocorreu, o ambiente pauta-se pelo respeito." }, { value: 2, label: "Tive conhecimento de fofocas ou piadas inadequadas, sem gravidade direta." }, { value: 3, label: "Sim, vivenciei ou presenciei posturas abusivas e intimidações explícitas." }] },
  { number: 14, category: "eixo_e", text: "Você compreende a utilidade e o funcionamento dos meios seguros/confidenciais para encaminhar relatos éticos ou denúncias na CLASA?", options: [{ value: 1, label: "Sim, sei onde recorrer e confio no sigilo da apuração das demandas." }, { value: 2, label: "Sei da existência dos meios de denúncia, mas tenho receio de usá-los." }, { value: 3, label: "Não conheço os meios formais de relato ou temo represálias caso utilize." }] },
  { number: 15, category: "eixo_e", text: "Você se sente protegido(a) contra eventuais conflitos graves, hostilidades físicas ou ameaças nas instalações da CLASA?", options: [{ value: 1, label: "Percepção total de segurança e ordem nas dependências do local." }, { value: 2, label: "Sinto-me razoavelmente seguro(a), mas fico alerta em momentos específicos." }, { value: 3, label: "Ambiente inseguro ou propício a brigas e comportamentos agressivos." }] },
  { number: 16, category: "eixo_f", text: "Quando surgem mudanças na grade curricular, salas ou horários, de que forma essas orientações são repassadas a você?", options: [{ value: 1, label: "Informações claras, divulgadas com boa antecedência nos canais oficiais." }, { value: 2, label: "Avisos em cima da hora, mas que ainda assim permitem se organizar." }, { value: 3, label: "Comunicação falha, truncada ou desorganizada, gerando constantes imprevistos." }] },
  { number: 17, category: "eixo_f", text: "As diretrizes normativas da CLASA (assiduidade, trajes, normas de comportamento e nota) são transparentes para você?", options: [{ value: 1, label: "Absolutamente transparentes; compreendo o que se espera da minha conduta." }, { value: 2, label: "Entendo a maior parte, mas restam dúvidas sobre a aplicação de certas regras." }, { value: 3, label: "Regras pouco explicadas ou aplicadas de forma instável pela gestão." }] },
  { number: 18, category: "eixo_f", text: "Na sua percepção, o cumprimento do regulamento interno da CLASA é exigido com equidade entre todos os aprendizes?", options: [{ value: 1, label: "Isonomia total; as diretrizes valem rigorosamente para todos da mesma forma." }, { value: 2, label: "Na maior parte do tempo sim, embora note concessões isoladas." }, { value: 3, label: "Há nitidamente um padrão duplo, com privilégios para alguns aprendizes." }] },
  { number: 19, category: "eixo_g", text: "Qual é o nível de facilidade para contatar mentores e coordenadores da CLASA quando você precisa esclarecer uma dúvida ou problema?", options: [{ value: 1, label: "Diálogo fácil, acessível e resolutivo sempre que procuro auxílio." }, { value: 2, label: "Acesso razoável, embora o tempo de resposta seja por vezes moroso." }, { value: 3, label: "Pouca disponibilidade ou postura distante por parte das lideranças." }] },
  { number: 20, category: "eixo_g", text: "Suas opiniões, críticas construtivas e ideias trazidas nas conversas são aproveitadas para a melhoria da CLASA?", options: [{ value: 1, label: "Sim, sinto que nossa voz é valorizada e se converte em melhorias reais." }, { value: 2, label: "As ideias são colhidas em pesquisas, porém poucas mudanças acontecem na prática." }, { value: 3, label: "Sentimento de desconsideração; nossas opiniões não geram impactos." }] },
  { number: 21, category: "eixo_g", text: "A dedicação, evolução individual e bons resultados obtidos por você ao longo das etapas recebem o devido retorno (feedback positivo)?", options: [{ value: 1, label: "Sim, meu esforço é constantemente notado e validado com feedbacks construtivos." }, { value: 2, label: "O retorno é pontual, concentrado quase exclusivamente nas falhas a corrigir." }, { value: 3, label: "Raramente sinto qualquer tipo de elogio ou valorização da minha dedicação." }] },
  { number: 22, category: "eixo_h", text: "Como você administra a pressão por não cometer falhas e a necessidade de adaptação ao ambiente profissional da CLASA?", options: [{ value: 1, label: "Com serenidade; encaro os erros como etapas normais do aprendizado." }, { value: 2, label: "Sinto ansiedade momentânea em novos desafios, mas logo me adapto." }, { value: 3, label: "A apreensão de cometer equívocos gera forte insegurança e estresse diário." }] },
  { number: 23, category: "eixo_h", text: "Em que grau as notificações em dispositivos móveis e redes sociais interferem no seu foco e convivência na CLASA?", options: [{ value: 1, label: "Uso consciente do celular, sem que isso comprometa o aprendizado ou trocas interpessoais." }, { value: 2, label: "Eventualmente perco a atenção com o celular, mas me policio para não atrapalhar." }, { value: 3, label: "Dificuldade constante de desconectar, prejudicando o aproveitamento e contatos sociais." }] },
  { number: 24, category: "eixo_h", text: "Analisando a sua vivência na CLASA de modo abrangente, qual é o saldo da rotina para o seu bem-estar psíquico?", options: [{ value: 1, label: "Gratificante; contribui para o meu amadurecimento e autoestima." }, { value: 2, label: "Neutro; envolve contratempos comuns da rotina sem abalar minha saúde." }, { value: 3, label: "Prejudicial; o ambiente tem sido um fator desencadeador de ansiedade ou esgotamento." }] },
  { number: 25, category: "eixo_i", text: "No contexto das atividades na CLASA, você presencia ou sofre comentários/atitudes preconceituosas referentes à raça, gênero, orientação ou condição social?", options: [{ value: 1, label: "Inexistente; a CLASA destaca-se como um ambiente genuinamente inclusivo e plural." }, { value: 2, label: "Já ouvi brincadeiras infelizes pontuais, mas sem desdobramentos graves." }, { value: 3, label: "Sim; vivenciei ou presenciarei episódios de preconceito e segregação manifesta." }] },
  { number: 26, category: "eixo_i", text: "Na sua visão, aprendizes neurodivergentes (ex: TDAH, autismo) ou PCDs possuem as devidas adequações metodológicas na CLASA?", options: [{ value: 1, label: "Sim; existe um cuidado genuíno com adaptações pedagógicas e acessibilidade." }, { value: 2, label: "Existem adaptações superficiais ou que atendem apenas aos requisitos mínimos." }, { value: 3, label: "Não há preparo pedagógico ou sensibilidade para lidar com essas necessidades." }] },
  { number: 27, category: "eixo_i", text: "Todos os jovens possuem as mesmas oportunidades para assumir lideranças e protagonizar projetos na CLASA?", options: [{ value: 1, label: "Sim; o critério de participação baseia-se no interesse e na dedicação de cada um." }, { value: 2, label: "Na maior parte das vezes sim, embora sinta favoritismos em certas turmas." }, { value: 3, label: "As oportunidades são distribuídas de maneira desigual e pouco transparente." }] },
  { number: 28, category: "sintese", text: "Fazendo um balanço geral, qual é o seu nível global de satisfação com a jornada de formação na CLASA?", options: [{ value: 1, label: "Plenamente satisfeito(a); superou minhas expectativas iniciais." }, { value: 2, label: "Moderadamente satisfeito(a); cumpre o papel do programa." }, { value: 3, label: "Insatisfeito(a); a instituição necessita de melhorias urgentes." }] },
  { number: 29, category: "sintese", text: "Você recomendaria o programa de formação da CLASA a outro jovem que esteja em busca da primeira oportunidade profissional?", options: [{ value: 1, label: "Recomendaria sem hesitação, por ser uma vivência transformadora." }, { value: 2, label: "Recomendaria ponderando os pontos que ainda necessitam de evolução." }, { value: 3, label: "Não recomendaria a experiência no formato atual." }] },
];

export const CLASA_TOTAL_QUESTIONS = CLASA_QUESTIONS.length;

export type CLASARiskLevel = 'baixo' | 'moderado' | 'alto';

export const CLASA_RISK_LABELS: Record<CLASARiskLevel, string> = {
  baixo: 'Risco Baixo',
  moderado: 'Risco Moderado',
  alto: 'Risco Alto',
};

export const CLASA_RISK_COLORS: Record<CLASARiskLevel, string> = {
  baixo: '#16a34a',
  moderado: '#f59e0b',
  alto: '#dc2626',
};

/** Converte a média (1-3) em índice de risco 0-100 (1 = 0, 3 = 100). */
export function toRiskIndex(mean: number): number {
  if (!isFinite(mean) || mean <= 0) return 0;
  return Math.round(((mean - 1) / 2) * 100);
}

export function getRiskLevel(index: number): CLASARiskLevel {
  if (index < 33) return 'baixo';
  if (index < 66) return 'moderado';
  return 'alto';
}

export interface CLASACategoryScore {
  category: CLASACategory;
  label: string;
  mean: number;
  index: number;
  level: CLASARiskLevel;
  answered: number;
}

/** answers: mapa question_number -> valor (1-3) */
export function calculateCLASAScores(answers: Record<number, number>) {
  const byCategory: CLASACategoryScore[] = [];
  let total = 0;
  let count = 0;

  for (const cat of CLASA_CATEGORY_ORDER) {
    const qs = CLASA_QUESTIONS.filter(q => q.category === cat);
    const vals = qs.map(q => answers[q.number]).filter(v => typeof v === 'number' && v > 0) as number[];
    const mean = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    const index = toRiskIndex(mean);
    byCategory.push({
      category: cat,
      label: CLASA_CATEGORY_LABELS[cat],
      mean: Number(mean.toFixed(2)),
      index,
      level: getRiskLevel(index),
      answered: vals.length,
    });
    total += vals.reduce((a, b) => a + b, 0);
    count += vals.length;
  }

  const globalMean = count ? total / count : 0;
  const globalIndex = toRiskIndex(globalMean);

  return {
    byCategory,
    globalMean: Number(globalMean.toFixed(2)),
    globalIndex,
    globalLevel: getRiskLevel(globalIndex),
    totalScore: total,
    answered: count,
  };
}
