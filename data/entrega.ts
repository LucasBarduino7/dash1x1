// Conteúdo do portal de entrega do Workshop (Agência Com.IA).
// Preencha os links reais; o que ficar vazio mostra estado "em breve".

export type Entregavel = {
  titulo: string;
  descricao?: string;
  url: string;
  /** Etiqueta curta (ex: "Vídeo", "PDF", "Planilha"). */
  tag?: string;
};

export type SkillItem = {
  nome: string;
  descricao?: string;
  /** Link pra instalar/usar a skill (opcional). */
  url?: string;
};

export const ENTREGAVEIS: Entregavel[] = [
  // Exemplos — troque pelos reais:
  { titulo: 'Gravação do Workshop', descricao: 'Acesso completo às gravações dos 2 dias.', url: '', tag: 'Vídeo' },
  { titulo: 'Slides e materiais', descricao: 'Apresentações usadas no workshop.', url: '', tag: 'PDF' },
  { titulo: 'Templates e prompts', descricao: 'Biblioteca de prompts e modelos prontos.', url: '', tag: 'Planilha' },
];

export const SKILLS: SkillItem[] = [
  // Exemplos — troque pelos reais:
  { nome: 'MCP Meta', descricao: 'Conecte o Meta Ads ao seu agente de IA.', url: '' },
  { nome: 'Claude no Chrome', descricao: 'Automatize tarefas direto no navegador.', url: '' },
];
