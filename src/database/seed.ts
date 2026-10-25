import { getDatabase } from './db';
import type {
  CategoryBudget,
  CategoryId,
  FinancialGoal,
  Transaction,
  UserProfile,
} from '../models';

export const DEMO_USER_ID = 'user-demo-teste';

export const DEMO_USER_CREDENTIALS = {
  name: 'Teste',
  email: 'teste@email.com',
  password: '123456',
} as const;

interface MonthlySeedDefinition {
  month: string; // YYYY-MM
  incomes: Array<{
    day: string; // DD
    title: string;
    description: string;
    amount: number;
    isRecurring?: boolean;
    isFrequent?: boolean;
  }>;
  expenses: Array<{
    day: string; // DD
    title: string;
    description: string;
    amount: number;
    categoryId: CategoryId;
    isRecurring?: boolean;
    isFrequent?: boolean;
    installments?: number;
  }>;
}

const MONTHS_DATA: MonthlySeedDefinition[] = [
  // ── Mês 1: Novembro/2025 (Inc: 4350.00 | Exp: 3550.00 | Diff: +800.00 | Acum: 800.00) ──
  {
    month: '2025-11',
    incomes: [
      {
        day: '05',
        title: 'Salário Base CLT',
        description: 'Crédito em conta corrente',
        amount: 4200.0,
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '15',
        title: 'Rendimentos FIIs',
        description: 'Proventos de Fundos Imobiliários',
        amount: 150.0,
        isRecurring: false,
        isFrequent: false,
      },
    ],
    expenses: [
      {
        day: '06',
        title: 'Aluguel e Condomínio',
        description: 'Mensalidade do apartamento',
        amount: 1500.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '08',
        title: 'Supermercado Mensal',
        description: 'Compras de mantimentos e limpeza',
        amount: 680.0,
        categoryId: 'alimentacao',
        isRecurring: false,
        isFrequent: true,
      },
      {
        day: '10',
        title: 'Combustível Posto Shell',
        description: 'Abastecimento etanol',
        amount: 280.0,
        categoryId: 'transporte',
        isRecurring: false,
        isFrequent: true,
      },
      {
        day: '12',
        title: 'Farmácia e Vitaminas',
        description: 'Suplementos e medicamentos',
        amount: 140.0,
        categoryId: 'saude',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '15',
        title: 'Jantar Restaurante Italiano',
        description: 'Passeio fim de semana',
        amount: 190.0,
        categoryId: 'lazer',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '18',
        title: 'Livros e Cursos Online',
        description: 'Especialização técnica',
        amount: 160.0,
        categoryId: 'educacao',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '20',
        title: 'Roupas e Calçados',
        description: 'Peças básicas casuais',
        amount: 260.0,
        categoryId: 'compras',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '22',
        title: 'Energia Elétrica e Água',
        description: 'Contas de consumo residenciais',
        amount: 220.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '25',
        title: 'Internet Fibra Óptica',
        description: 'Plano 500 Mega',
        amount: 120.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
    ],
  },

  // ── Mês 2: Dezembro/2025 (Inc: 7100.00 | Exp: 6300.00 | Diff: +800.00 | Acum: 1600.00) ──
  {
    month: '2025-12',
    incomes: [
      {
        day: '05',
        title: 'Salário Base CLT',
        description: 'Crédito em conta corrente',
        amount: 4200.0,
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '15',
        title: '13º Salário e Gratificação',
        description: 'Parcela de gratificação natalina',
        amount: 2100.0,
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '20',
        title: 'Projeto Freelance Design',
        description: 'Identidade visual para cliente',
        amount: 800.0,
        isRecurring: false,
        isFrequent: false,
      },
    ],
    expenses: [
      {
        day: '06',
        title: 'Aluguel e Condomínio',
        description: 'Mensalidade do apartamento',
        amount: 1500.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '08',
        title: 'Supermercado e Ceia de Natal',
        description: 'Mantimentos e confraternização familiar',
        amount: 1250.0,
        categoryId: 'alimentacao',
        isRecurring: false,
        isFrequent: true,
      },
      {
        day: '12',
        title: 'Presentes de Fim de Ano',
        description: 'Lembranças para a família',
        amount: 1350.0,
        categoryId: 'compras',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '15',
        title: 'Revisão Mecânica para Viagem',
        description: 'Freios, óleo e alinhamento',
        amount: 520.0,
        categoryId: 'transporte',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '18',
        title: 'Confraternização de Empresa',
        description: 'Jantar festivo com equipe',
        amount: 480.0,
        categoryId: 'lazer',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '20',
        title: 'Energia Elétrica e Água',
        description: 'Contas residenciais',
        amount: 260.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '22',
        title: 'Internet e Streaming',
        description: 'Serviços de conectividade',
        amount: 140.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '26',
        title: 'Passeios e Cinema Férias',
        description: 'Atividades culturais e lazer',
        amount: 380.0,
        categoryId: 'lazer',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '28',
        title: 'Farmácia e Protetor Solar',
        description: 'Cuidados para o verão',
        amount: 190.0,
        categoryId: 'saude',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '30',
        title: 'Pedágios e Combustível Viagem',
        description: 'Deslocamento de fim de ano',
        amount: 230.0,
        categoryId: 'transporte',
        isRecurring: false,
        isFrequent: false,
      },
    ],
  },

  // ── Mês 3: Janeiro/2026 (Inc: 4580.00 | Exp: 3780.00 | Diff: +800.00 | Acum: 2400.00) ──
  {
    month: '2026-01',
    incomes: [
      {
        day: '05',
        title: 'Salário CLT Reajustado',
        description: 'Salário com dissídio anual',
        amount: 4400.0,
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '16',
        title: 'Rendimento CDB Liquidez Diária',
        description: 'Juros acumulados da reserva',
        amount: 180.0,
        isRecurring: false,
        isFrequent: false,
      },
    ],
    expenses: [
      {
        day: '06',
        title: 'Aluguel e Condomínio',
        description: 'Mensalidade do apartamento',
        amount: 1500.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '08',
        title: 'IPVA 2026 (Parcela 1/3)',
        description: 'Tributo veicular anual',
        amount: 450.0,
        categoryId: 'transporte',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '10',
        title: 'Supermercado Mensal',
        description: 'Compras básicas do mês',
        amount: 720.0,
        categoryId: 'alimentacao',
        isRecurring: false,
        isFrequent: true,
      },
      {
        day: '14',
        title: 'Matrícula Curso de Inglês',
        description: 'Aperfeiçoamento profissional',
        amount: 350.0,
        categoryId: 'educacao',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '18',
        title: 'Energia Elétrica e Gás',
        description: 'Contas residenciais',
        amount: 240.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '20',
        title: 'Combustível Posto Ipiranga',
        description: 'Abastecimento mensal',
        amount: 210.0,
        categoryId: 'transporte',
        isRecurring: false,
        isFrequent: true,
      },
      {
        day: '22',
        title: 'Farmácia e Medicamentos',
        description: 'Itens de uso contínuo',
        amount: 90.0,
        categoryId: 'saude',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '25',
        title: 'Internet Fibra Óptica',
        description: 'Plano 500 Mega',
        amount: 120.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '28',
        title: 'Cinema e Pipoca',
        description: 'Lazer com amigos',
        amount: 100.0,
        categoryId: 'lazer',
        isRecurring: false,
        isFrequent: false,
      },
    ],
  },

  // ── Mês 4: Fevereiro/2026 (Inc: 5350.00 | Exp: 4550.00 | Diff: +800.00 | Acum: 3200.00) ──
  {
    month: '2026-02',
    incomes: [
      {
        day: '05',
        title: 'Salário Base CLT',
        description: 'Crédito em conta corrente',
        amount: 4400.0,
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '14',
        title: 'Consultoria Técnica Cloud',
        description: 'Otimização de infraestrutura',
        amount: 950.0,
        isRecurring: false,
        isFrequent: false,
      },
    ],
    expenses: [
      {
        day: '06',
        title: 'Aluguel e Condomínio',
        description: 'Mensalidade do apartamento',
        amount: 1500.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '08',
        title: 'IPVA 2026 (Parcela 2/3)',
        description: 'Tributo veicular anual',
        amount: 450.0,
        categoryId: 'transporte',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '10',
        title: 'Supermercado Mensal',
        description: 'Compras de alimentação',
        amount: 710.0,
        categoryId: 'alimentacao',
        isRecurring: false,
        isFrequent: true,
      },
      {
        day: '15',
        title: 'Pousada Feriado Carnaval',
        description: 'Hospedagem no litoral',
        amount: 980.0,
        categoryId: 'viagem',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '18',
        title: 'Combustível Estrada',
        description: 'Viagem de feriado',
        amount: 290.0,
        categoryId: 'transporte',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '20',
        title: 'Energia Elétrica e Água',
        description: 'Contas residenciais',
        amount: 230.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '22',
        title: 'Plano de Saúde Coparticipação',
        description: 'Exames de rotina',
        amount: 160.0,
        categoryId: 'saude',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '25',
        title: 'Internet Fibra Óptica',
        description: 'Plano 500 Mega',
        amount: 120.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '27',
        title: 'Restaurante Feriado',
        description: 'Almoço de frutos do mar',
        amount: 110.0,
        categoryId: 'alimentacao',
        isRecurring: false,
        isFrequent: true,
      },
    ],
  },

  // ── Mês 5: Março/2026 (Inc: 5120.00 | Exp: 4320.00 | Diff: +800.00 | Acum: 4000.00) ──
  {
    month: '2026-03',
    incomes: [
      {
        day: '05',
        title: 'Salário Base CLT',
        description: 'Crédito em conta corrente',
        amount: 4400.0,
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '12',
        title: 'Venda Monitor Usado',
        description: 'Venda em plataforma online',
        amount: 600.0,
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '18',
        title: 'Dividendos FIIs',
        description: 'Rendimentos mensais',
        amount: 120.0,
        isRecurring: false,
        isFrequent: false,
      },
    ],
    expenses: [
      {
        day: '06',
        title: 'Aluguel e Condomínio',
        description: 'Mensalidade do apartamento',
        amount: 1500.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '08',
        title: 'IPVA 2026 (Parcela 3/3)',
        description: 'Quitação do tributo veicular',
        amount: 450.0,
        categoryId: 'transporte',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '10',
        title: 'Supermercado Mensal',
        description: 'Alimentação e higiene',
        amount: 740.0,
        categoryId: 'alimentacao',
        isRecurring: false,
        isFrequent: true,
      },
      {
        day: '15',
        title: 'Notebook Dell (Parcela 1/10)',
        description: 'Compra parcelada para trabalho',
        amount: 480.0,
        categoryId: 'compras',
        isRecurring: false,
        isFrequent: false,
        installments: 10,
      },
      {
        day: '18',
        title: 'Curso de Arquitetura de Software',
        description: 'Certificação profissional',
        amount: 380.0,
        categoryId: 'educacao',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '20',
        title: 'Energia Elétrica e Água',
        description: 'Contas residenciais',
        amount: 240.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '22',
        title: 'Combustível Posto Shell',
        description: 'Abastecimento urbano',
        amount: 220.0,
        categoryId: 'transporte',
        isRecurring: false,
        isFrequent: true,
      },
      {
        day: '25',
        title: 'Internet Fibra Óptica',
        description: 'Plano 500 Mega',
        amount: 120.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '28',
        title: 'Passeio Parque e Café',
        description: 'Lazer ao ar livre',
        amount: 190.0,
        categoryId: 'lazer',
        isRecurring: false,
        isFrequent: false,
      },
    ],
  },

  // ── Mês 6: Abril/2026 (Inc: 5650.00 | Exp: 4850.00 | Diff: +800.00 | Acum: 4800.00) ──
  {
    month: '2026-04',
    incomes: [
      {
        day: '05',
        title: 'Salário Base CLT',
        description: 'Crédito em conta corrente',
        amount: 4400.0,
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '20',
        title: 'Restituição Imposto de Renda',
        description: '1º lote da Receita Federal',
        amount: 1250.0,
        isRecurring: false,
        isFrequent: false,
      },
    ],
    expenses: [
      {
        day: '06',
        title: 'Aluguel e Condomínio',
        description: 'Mensalidade do apartamento',
        amount: 1500.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '08',
        title: 'Manutenção Preventiva do Carro',
        description: 'Troca de pastilhas e correia',
        amount: 920.0,
        categoryId: 'transporte',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '10',
        title: 'Supermercado Mensal',
        description: 'Compras domésticas',
        amount: 760.0,
        categoryId: 'alimentacao',
        isRecurring: false,
        isFrequent: true,
      },
      {
        day: '15',
        title: 'Notebook Dell (Parcela 2/10)',
        description: 'Compra parcelada para trabalho',
        amount: 480.0,
        categoryId: 'compras',
        isRecurring: false,
        isFrequent: false,
        installments: 10,
      },
      {
        day: '18',
        title: 'Consultas Médicas e Exames',
        description: 'Checkup anual de rotina',
        amount: 310.0,
        categoryId: 'saude',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '20',
        title: 'Energia Elétrica e Água',
        description: 'Contas residenciais',
        amount: 250.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '22',
        title: 'Combustível Posto Ipiranga',
        description: 'Abastecimento',
        amount: 240.0,
        categoryId: 'transporte',
        isRecurring: false,
        isFrequent: true,
      },
      {
        day: '25',
        title: 'Internet Fibra Óptica',
        description: 'Plano 500 Mega',
        amount: 120.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '28',
        title: 'Jantar com Amigos',
        description: 'Restaurante hamburgueria',
        amount: 270.0,
        categoryId: 'lazer',
        isRecurring: false,
        isFrequent: false,
      },
    ],
  },

  // ── Mês 7: Maio/2026 (Inc: 5900.00 | Exp: 5100.00 | Diff: +800.00 | Acum: 5600.00) ──
  {
    month: '2026-05',
    incomes: [
      {
        day: '05',
        title: 'Salário Base CLT',
        description: 'Crédito em conta corrente',
        amount: 4400.0,
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '18',
        title: 'Freelance Web E-commerce',
        description: 'Desenvolvimento de plataforma web',
        amount: 1500.0,
        isRecurring: false,
        isFrequent: false,
      },
    ],
    expenses: [
      {
        day: '06',
        title: 'Aluguel e Condomínio',
        description: 'Mensalidade do apartamento',
        amount: 1500.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '08',
        title: 'Almoço Dia das Mães e Presente',
        description: 'Celebração e almoço especial',
        amount: 580.0,
        categoryId: 'lazer',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '10',
        title: 'Supermercado Mensal',
        description: 'Alimentação e mantimentos',
        amount: 790.0,
        categoryId: 'alimentacao',
        isRecurring: false,
        isFrequent: true,
      },
      {
        day: '14',
        title: 'Pintura e Reparo Quarto',
        description: 'Manutenção doméstica',
        amount: 460.0,
        categoryId: 'casa',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '15',
        title: 'Notebook Dell (Parcela 3/10)',
        description: 'Compra parcelada para trabalho',
        amount: 480.0,
        categoryId: 'compras',
        isRecurring: false,
        isFrequent: false,
        installments: 10,
      },
      {
        day: '18',
        title: 'Combustível Posto Shell',
        description: 'Abastecimento',
        amount: 250.0,
        categoryId: 'transporte',
        isRecurring: false,
        isFrequent: true,
      },
      {
        day: '20',
        title: 'Energia Elétrica e Água',
        description: 'Contas residenciais',
        amount: 240.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '22',
        title: 'Roupas e Calçados',
        description: 'Renovação do guarda-roupa',
        amount: 410.0,
        categoryId: 'compras',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '25',
        title: 'Internet Fibra Óptica',
        description: 'Plano 500 Mega',
        amount: 120.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '28',
        title: 'Academia Mensalidade',
        description: 'Mensalidade plano anual',
        amount: 150.0,
        categoryId: 'saude',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '30',
        title: 'iFood Final de Semana',
        description: 'Delivery de pizza',
        amount: 120.0,
        categoryId: 'alimentacao',
        isRecurring: false,
        isFrequent: true,
      },
    ],
  },

  // ── Mês 8: Junho/2026 (Inc: 4620.00 | Exp: 3820.00 | Diff: +800.00 | Acum: 6400.00) ──
  {
    month: '2026-06',
    incomes: [
      {
        day: '05',
        title: 'Salário Base CLT',
        description: 'Crédito em conta corrente',
        amount: 4400.0,
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '15',
        title: 'Rendimentos Renda Fixa',
        description: 'Juros de título Tesouro Selic',
        amount: 220.0,
        isRecurring: false,
        isFrequent: false,
      },
    ],
    expenses: [
      {
        day: '06',
        title: 'Aluguel e Condomínio',
        description: 'Mensalidade do apartamento',
        amount: 1500.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '08',
        title: 'Supermercado Mensal',
        description: 'Compras de alimentação',
        amount: 730.0,
        categoryId: 'alimentacao',
        isRecurring: false,
        isFrequent: true,
      },
      {
        day: '12',
        title: 'Jantar Dia dos Namorados',
        description: 'Restaurante especial',
        amount: 240.0,
        categoryId: 'lazer',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '15',
        title: 'Notebook Dell (Parcela 4/10)',
        description: 'Compra parcelada para trabalho',
        amount: 480.0,
        categoryId: 'compras',
        isRecurring: false,
        isFrequent: false,
        installments: 10,
      },
      {
        day: '18',
        title: 'Combustível Posto Ipiranga',
        description: 'Abastecimento',
        amount: 230.0,
        categoryId: 'transporte',
        isRecurring: false,
        isFrequent: true,
      },
      {
        day: '20',
        title: 'Energia Elétrica e Água',
        description: 'Contas residenciais',
        amount: 230.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '22',
        title: 'Academia Mensalidade',
        description: 'Mensalidade plano anual',
        amount: 150.0,
        categoryId: 'saude',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '25',
        title: 'Internet Fibra Óptica',
        description: 'Plano 500 Mega',
        amount: 120.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '28',
        title: 'Livro Desenvolvimento Mobile',
        description: 'Aprimoramento técnico',
        amount: 140.0,
        categoryId: 'educacao',
        isRecurring: false,
        isFrequent: false,
      },
    ],
  },

  // ── Mês 9: Julho/2026 (Inc: 6200.00 | Exp: 5400.00 | Diff: +800.00 | Acum: 7200.00) ──
  {
    month: '2026-07',
    incomes: [
      {
        day: '05',
        title: 'Salário Base CLT',
        description: 'Crédito em conta corrente',
        amount: 4400.0,
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '10',
        title: 'Bônus de Produtividade Semestral',
        description: 'Premiação de metas corporativas',
        amount: 1800.0,
        isRecurring: false,
        isFrequent: false,
      },
    ],
    expenses: [
      {
        day: '06',
        title: 'Aluguel e Condomínio',
        description: 'Mensalidade do apartamento',
        amount: 1500.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '09',
        title: 'Hospedagem e Passeios Férias',
        description: 'Hotel e atrações turísticas',
        amount: 1350.0,
        categoryId: 'viagem',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '12',
        title: 'Supermercado Mensal',
        description: 'Alimentação e higiene',
        amount: 780.0,
        categoryId: 'alimentacao',
        isRecurring: false,
        isFrequent: true,
      },
      {
        day: '15',
        title: 'Notebook Dell (Parcela 5/10)',
        description: 'Compra parcelada para trabalho',
        amount: 480.0,
        categoryId: 'compras',
        isRecurring: false,
        isFrequent: false,
        installments: 10,
      },
      {
        day: '18',
        title: 'Passagens e Pedágios Viagem',
        description: 'Transporte de férias',
        amount: 420.0,
        categoryId: 'transporte',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '20',
        title: 'Energia Elétrica e Água',
        description: 'Contas residenciais',
        amount: 260.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '22',
        title: 'Academia Mensalidade',
        description: 'Mensalidade',
        amount: 150.0,
        categoryId: 'saude',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '24',
        title: 'Restaurantes na Viagem',
        description: 'Gastronomia de férias',
        amount: 220.0,
        categoryId: 'alimentacao',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '26',
        title: 'Internet Fibra Óptica',
        description: 'Plano 500 Mega',
        amount: 120.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '28',
        title: 'Farmácia e Cuidados Pessoais',
        description: 'Itens de viagem e primeiros socorros',
        amount: 120.0,
        categoryId: 'saude',
        isRecurring: false,
        isFrequent: false,
      },
    ],
  },

  // ── Mês 10: Agosto/2026 (Inc: 5100.00 | Exp: 4300.00 | Diff: +800.00 | Acum: 8000.00) ──
  {
    month: '2026-08',
    incomes: [
      {
        day: '05',
        title: 'Salário Base CLT',
        description: 'Crédito em conta corrente',
        amount: 4400.0,
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '16',
        title: 'Mentoria Tech e Code Review',
        description: 'Assessoria a desenvolvedores júnior',
        amount: 700.0,
        isRecurring: false,
        isFrequent: false,
      },
    ],
    expenses: [
      {
        day: '06',
        title: 'Aluguel e Condomínio',
        description: 'Mensalidade do apartamento',
        amount: 1500.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '08',
        title: 'Almoço Dia dos Pais e Presente',
        description: 'Almoço em família',
        amount: 320.0,
        categoryId: 'lazer',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '10',
        title: 'Supermercado Mensal',
        description: 'Compras de alimentação',
        amount: 740.0,
        categoryId: 'alimentacao',
        isRecurring: false,
        isFrequent: true,
      },
      {
        day: '15',
        title: 'Notebook Dell (Parcela 6/10)',
        description: 'Compra parcelada para trabalho',
        amount: 480.0,
        categoryId: 'compras',
        isRecurring: false,
        isFrequent: false,
        installments: 10,
      },
      {
        day: '18',
        title: 'Combustível Posto Shell',
        description: 'Abastecimento',
        amount: 240.0,
        categoryId: 'transporte',
        isRecurring: false,
        isFrequent: true,
      },
      {
        day: '20',
        title: 'Energia Elétrica e Água',
        description: 'Contas residenciais',
        amount: 230.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '22',
        title: 'Dentista e Limpeza Semestral',
        description: 'Saúde bucal preventiva',
        amount: 280.0,
        categoryId: 'saude',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '24',
        title: 'Academia Mensalidade',
        description: 'Mensalidade',
        amount: 150.0,
        categoryId: 'saude',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '26',
        title: 'Internet Fibra Óptica',
        description: 'Plano 500 Mega',
        amount: 120.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '28',
        title: 'Livros e E-books Técnicos',
        description: 'Atualização profissional',
        amount: 140.0,
        categoryId: 'educacao',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '30',
        title: 'iFood Lanche Fim de Semana',
        description: 'Hamburguer artesanal',
        amount: 100.0,
        categoryId: 'alimentacao',
        isRecurring: false,
        isFrequent: true,
      },
    ],
  },

  // ── Mês 11: Setembro/2026 (Inc: 4660.00 | Exp: 3860.00 | Diff: +800.00 | Acum: 8800.00) ──
  {
    month: '2026-09',
    incomes: [
      {
        day: '05',
        title: 'Salário Base CLT',
        description: 'Crédito em conta corrente',
        amount: 4400.0,
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '17',
        title: 'Dividendos Ações e Fundos',
        description: 'Proventos de carteira recomendada',
        amount: 260.0,
        isRecurring: false,
        isFrequent: false,
      },
    ],
    expenses: [
      {
        day: '06',
        title: 'Aluguel e Condomínio',
        description: 'Mensalidade do apartamento',
        amount: 1500.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '08',
        title: 'Supermercado Mensal',
        description: 'Compras básicas',
        amount: 720.0,
        categoryId: 'alimentacao',
        isRecurring: false,
        isFrequent: true,
      },
      {
        day: '12',
        title: 'Combustível Posto Ipiranga',
        description: 'Abastecimento',
        amount: 250.0,
        categoryId: 'transporte',
        isRecurring: false,
        isFrequent: true,
      },
      {
        day: '15',
        title: 'Notebook Dell (Parcela 7/10)',
        description: 'Compra parcelada para trabalho',
        amount: 480.0,
        categoryId: 'compras',
        isRecurring: false,
        isFrequent: false,
        installments: 10,
      },
      {
        day: '18',
        title: 'Cinema e Restaurante',
        description: 'Lazer a dois',
        amount: 180.0,
        categoryId: 'lazer',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '20',
        title: 'Energia Elétrica e Água',
        description: 'Contas residenciais',
        amount: 240.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '22',
        title: 'Academia Mensalidade',
        description: 'Mensalidade',
        amount: 150.0,
        categoryId: 'saude',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '24',
        title: 'Internet Fibra Óptica',
        description: 'Plano 500 Mega',
        amount: 120.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '27',
        title: 'Farmácia e Medicamentos',
        description: 'Higiene e remédios',
        amount: 110.0,
        categoryId: 'saude',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '29',
        title: 'iFood Jantar Delivery',
        description: 'Comida japonesa',
        amount: 110.0,
        categoryId: 'alimentacao',
        isRecurring: false,
        isFrequent: true,
      },
    ],
  },

  // ── Mês 12: Outubro/2026 (Mês Atual) (Inc: 5500.00 | Exp: 4700.00 | Diff: +800.00 | Acum: 9600.00) ──
  {
    month: '2026-10',
    incomes: [
      {
        day: '05',
        title: 'Salário Base CLT',
        description: 'Crédito em conta corrente',
        amount: 4400.0,
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '14',
        title: 'Freelance App Mobile',
        description: 'Entrega de módulo React Native',
        amount: 1100.0,
        isRecurring: false,
        isFrequent: false,
      },
    ],
    expenses: [
      {
        day: '06',
        title: 'Aluguel e Condomínio',
        description: 'Mensalidade do apartamento',
        amount: 1500.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '08',
        title: 'Supermercado Quinzenal',
        description: 'Abastecimento da despensa e limpeza',
        amount: 620.0,
        categoryId: 'alimentacao',
        isRecurring: false,
        isFrequent: true,
      },
      {
        day: '10',
        title: 'Abastecimento Posto Shell',
        description: 'Tanque cheio etanol',
        amount: 260.0,
        categoryId: 'transporte',
        isRecurring: false,
        isFrequent: true,
      },
      {
        day: '12',
        title: 'Passeio Feriado N. Sra Aparecida',
        description: 'Almoço e parque em família',
        amount: 290.0,
        categoryId: 'lazer',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '15',
        title: 'Notebook Dell (Parcela 8/10)',
        description: 'Compra parcelada para trabalho',
        amount: 480.0,
        categoryId: 'compras',
        isRecurring: false,
        isFrequent: false,
        installments: 10,
      },
      {
        day: '17',
        title: 'Supermercado Hortifruti',
        description: 'Frutas, verduras e itens frescos',
        amount: 280.0,
        categoryId: 'alimentacao',
        isRecurring: false,
        isFrequent: true,
      },
      {
        day: '18',
        title: 'Energia Elétrica Enel',
        description: 'Conta de consumo mensal',
        amount: 230.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '19',
        title: 'Combustível e Estacionamento',
        description: 'Deslocamentos urbanos',
        amount: 220.0,
        categoryId: 'transporte',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '20',
        title: 'Academia Mensalidade',
        description: 'Mensalidade plano anual',
        amount: 150.0,
        categoryId: 'saude',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '20',
        title: 'Internet Fibra Óptica',
        description: 'Plano 500 Mega',
        amount: 120.0,
        categoryId: 'casa',
        isRecurring: true,
        isFrequent: false,
      },
      {
        day: '21',
        title: 'Farmácia Drogasil',
        description: 'Medicamentos e produtos de higiene',
        amount: 130.0,
        categoryId: 'saude',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '21',
        title: 'Jantar Restaurante Japonês',
        description: 'Comemoração de entrega de projeto',
        amount: 180.0,
        categoryId: 'lazer',
        isRecurring: false,
        isFrequent: false,
      },
      {
        day: '21',
        title: 'iFood Almoço Trabalho',
        description: 'Almoço delivery executivo',
        amount: 60.0,
        categoryId: 'alimentacao',
        isRecurring: false,
        isFrequent: true,
      },
      {
        day: '21',
        title: 'Curso Online TypeScript Avançado',
        description: 'Aprimoramento técnico e boas práticas',
        amount: 180.0,
        categoryId: 'educacao',
        isRecurring: false,
        isFrequent: false,
      },
    ],
  },
];

const DEMO_GOALS: Array<{
  idSuffix: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  icon: string;
  color: string;
  deadline: string;
}> = [
  {
    idSuffix: 'reserva',
    title: 'Reserva de Emergência',
    targetAmount: 15000.0,
    currentAmount: 6000.0, // 40.0%
    icon: 'shield',
    color: '#009FE3',
    deadline: '2027-12-31',
  },
  {
    idSuffix: 'viagem',
    title: 'Viagem de Férias',
    targetAmount: 3500.0,
    currentAmount: 2400.0, // 68.6%
    icon: 'send',
    color: '#6366F1',
    deadline: '2027-02-28',
  },
  {
    idSuffix: 'notebook',
    title: 'Notebook Profissional',
    targetAmount: 4500.0,
    currentAmount: 1200.0, // 26.7%
    icon: 'monitor',
    color: '#10B981',
    deadline: '2027-06-30',
  },
  {
    idSuffix: 'carro',
    title: 'Entrada Carro Novo',
    targetAmount: 20000.0,
    currentAmount: 0.0, // 0.0%
    icon: 'target',
    color: '#F59E0B',
    deadline: '2028-12-31',
  },
];

const BUDGET_CATEGORIES_CONFIG: Array<{
  categoryId: CategoryId;
  limitAmount: number;
}> = [
  { categoryId: 'casa', limitAmount: 1800.0 },
  { categoryId: 'alimentacao', limitAmount: 1200.0 },
  { categoryId: 'transporte', limitAmount: 600.0 },
  { categoryId: 'compras', limitAmount: 500.0 },
  { categoryId: 'lazer', limitAmount: 500.0 },
  { categoryId: 'saude', limitAmount: 500.0 },
  { categoryId: 'educacao', limitAmount: 400.0 },
  { categoryId: 'viagem', limitAmount: 1000.0 },
];

/**
 * Popula ou sincroniza a conta oficial "Teste" (teste@email.com) no SQLite com 1 ano completo de histórico,
 * receitas variáveis, economia mensal garantida de exatamente R$ 800,00 e metas planejadas.
 */
export async function seedDemoData(forceUserId?: string): Promise<string> {
  const db = await getDatabase();
  const nowIso = new Date().toISOString();

  // 1. Identifica ou cria o usuário Teste
  let targetUserId = forceUserId || DEMO_USER_ID;

  if (!forceUserId) {
    const existing = await db.getFirstAsync<{ id: string }>(
      `SELECT id FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(name) = 'teste' LIMIT 1;`,
      [DEMO_USER_CREDENTIALS.email],
    );

    if (existing) {
      targetUserId = existing.id;
    } else {
      await db.runAsync(
        `INSERT INTO users (
          id, name, email, passwordHash, birthDate, phone, avatarUri,
          monthlyGlobalLimit, twoFactorEnabled, hideBalance,
          hasCompletedOnboarding, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          DEMO_USER_ID,
          DEMO_USER_CREDENTIALS.name,
          DEMO_USER_CREDENTIALS.email,
          DEMO_USER_CREDENTIALS.password,
          '15/05/1995',
          '(11) 98765-4321',
          null,
          6000.0,
          0,
          0,
          1,
          nowIso,
        ],
      );
      targetUserId = DEMO_USER_ID;
    }
  }

  // 2. Limpa dados anteriores do usuário para permitir idempotência e recarga perfeita
  await db.runAsync(
    `DELETE FROM transactions WHERE userId = ? AND isDemoData = 1;`,
    [targetUserId],
  );
  await db.runAsync(
    `DELETE FROM financial_goals WHERE userId = ? AND isDemoData = 1;`,
    [targetUserId],
  );
  await db.runAsync(
    `DELETE FROM category_budgets WHERE userId = ? AND isDemoData = 1;`,
    [targetUserId],
  );

  // 3. Insere todas as transações dos 12 meses
  let txCounter = 1;
  for (const m of MONTHS_DATA) {
    // Incomes
    for (const inc of m.incomes) {
      const txId = `tx-demo-${m.month}-${m.month.replace('-', '')}${inc.day}-${txCounter++}`;
      const dateStr = `${m.month}-${inc.day}`;
      await db.runAsync(
        `INSERT INTO transactions (
          id, userId, title, description, amount, type, categoryId,
          date, isRecurring, isFrequent, installments, isDemoData, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          txId,
          targetUserId,
          inc.title,
          inc.description,
          inc.amount,
          'income',
          'receita',
          dateStr,
          inc.isRecurring ? 1 : 0,
          inc.isFrequent ? 1 : 0,
          null,
          1,
          nowIso,
        ],
      );
    }

    // Expenses
    for (const exp of m.expenses) {
      const txId = `tx-demo-${m.month}-${m.month.replace('-', '')}${exp.day}-${txCounter++}`;
      const dateStr = `${m.month}-${exp.day}`;
      await db.runAsync(
        `INSERT INTO transactions (
          id, userId, title, description, amount, type, categoryId,
          date, isRecurring, isFrequent, installments, isDemoData, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          txId,
          targetUserId,
          exp.title,
          exp.description,
          exp.amount,
          'expense',
          exp.categoryId,
          dateStr,
          exp.isRecurring ? 1 : 0,
          exp.isFrequent ? 1 : 0,
          exp.installments ?? null,
          1,
          nowIso,
        ],
      );
    }

    // Budgets para o mês
    for (const b of BUDGET_CATEGORIES_CONFIG) {
      const bId = `budget-demo-${m.month}-${b.categoryId}`;
      await db.runAsync(
        `INSERT OR REPLACE INTO category_budgets (
          id, userId, categoryId, monthYear, limitAmount, isDemoData
        ) VALUES (?, ?, ?, ?, ?, ?);`,
        [bId, targetUserId, b.categoryId, m.month, b.limitAmount, 1],
      );
    }
  }

  // 4. Insere Metas Financeiras
  for (const g of DEMO_GOALS) {
    const goalId = `goal-demo-${g.idSuffix}`;
    await db.runAsync(
      `INSERT INTO financial_goals (
        id, userId, title, targetAmount, currentAmount, icon, color,
        deadline, isDemoData, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        goalId,
        targetUserId,
        g.title,
        g.targetAmount,
        g.currentAmount,
        g.icon,
        g.color,
        g.deadline,
        1,
        nowIso,
      ],
    );
  }

  return targetUserId;
}

// Aliases para retrocompatibilidade
export const TESTE_22_USER_ID = DEMO_USER_ID;
export const TESTE_22_CREDENTIALS = DEMO_USER_CREDENTIALS;
export const seedTeste22User = seedDemoData;

/**
 * Executa a carga inicial (seed) do banco de dados SQLite local.
 * Garante a exclusividade da conta oficial "Teste" (teste@email.com),
 * expurgando contas legadas de desenvolvimento e populando 1 ano completo de histórico.
 */
export async function runDatabaseSeed(): Promise<void> {
  try {
    const db = await getDatabase();

    // 1. Limpeza preventiva de contas legadas de desenvolvimento (Cristiano e Teste 22)
    await db.runAsync(
      `DELETE FROM users WHERE id IN ('user-demo-cristiano', 'user-teste-22')
       OR LOWER(email) IN ('cristiano@ifsp.edu.br', 'teste22@email.com', 'teste22@nexo.com')
       OR LOWER(name) IN ('cristiano', 'teste 22');`,
    );
    await db.runAsync(
      `DELETE FROM transactions WHERE userId IN ('user-demo-cristiano', 'user-teste-22');`,
    );
    await db.runAsync(
      `DELETE FROM financial_goals WHERE userId IN ('user-demo-cristiano', 'user-teste-22');`,
    );
    await db.runAsync(
      `DELETE FROM category_budgets WHERE userId IN ('user-demo-cristiano', 'user-teste-22');`,
    );
    await db.runAsync(
      `DELETE FROM support_tickets WHERE userId IN ('user-demo-cristiano', 'user-teste-22');`,
    );

    // 2. Garante a existência exclusiva da conta oficial "Teste" (teste@email.com)
    //    populada com 1 ano completo de histórico financeiro, orçamentos e metas.
    const existingDemoUser = await db.getFirstAsync<{ id: string }>(
      `SELECT id FROM users WHERE id = ? OR LOWER(email) = LOWER(?) LIMIT 1;`,
      [DEMO_USER_ID, DEMO_USER_CREDENTIALS.email],
    );

    if (!existingDemoUser) {
      await seedDemoData(DEMO_USER_ID);
    } else {
      const txCount = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM transactions WHERE userId = ?;`,
        [existingDemoUser.id],
      );
      if (!txCount || txCount.count === 0) {
        await seedDemoData(existingDemoUser.id);
      }
    }
  } catch (error) {
    console.error(
      '[Seed] Erro ao executar carga inicial de demonstração:',
      error,
    );
    throw error;
  }
}

/**
 * Restaura os dados de demonstração (1 ano de histórico, orçamentos e metas)
 * para o usuário informado, permitindo recarregar o estado a qualquer momento.
 */
export async function restoreDemoDataForUser(userId: string): Promise<void> {
  await seedDemoData(userId);
}

export const runSeedIfNeeded = runDatabaseSeed;

