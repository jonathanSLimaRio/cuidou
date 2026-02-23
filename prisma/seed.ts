import {
  DocumentType,
  PrismaClient,
  ServiceType,
  Shift,
  UserRole,
  UserStatus,
  VerificationStatus,
  Weekday,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run seeds.");
}

const pool = new Pool({
  connectionString,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

const DEMO_EMAIL_DOMAIN = "demo.cuidou.local";
const DEMO_WORDPRESS_FILE =
  "https://paulojuniorrosa1770257599139.0452147.meusitehostgator.com.br/wp-content/uploads/2026/02/demo-document.pdf";
const LOCAL_DEV_PASSWORD = "Cuidou123!";
const LOCAL_DEV_ADMIN_EMAIL = "admin.local@cuidou.dev";
const LOCAL_DEV_FAMILY_EMAIL = "familia.local@cuidou.dev";
const LOCAL_DEV_CAREGIVER_EMAIL = "cuidadora.local@cuidou.dev";

type DemoFamilySeed = {
  slug: string;
  name: string;
  contactName: string;
  bio: string;
  state: string;
  city: string;
  neighborhood: string;
};

type DemoProfessionalSeed = {
  slug: string;
  name: string;
  bio: string;
  experienceYears: number;
  serviceTypes: ServiceType[];
  state: string;
  city: string;
  neighborhood: string;
  hourlyRateMin: number;
  hourlyRateMax: number;
  availability: string;
  slots: Array<{ weekday: Weekday; shifts: Shift[] }>;
  verificationStatus: VerificationStatus;
};

type DemoJobSeed = {
  familySlug: string;
  serviceType: ServiceType;
  title: string;
  description: string;
  state: string;
  city: string;
  neighborhood: string;
  hourlyRateMin: number;
  hourlyRateMax: number;
  scheduleDetails?: string;
  scheduleSlots: Array<{
    weekday: Weekday;
    startTime: string;
    endTime: string;
  }>;
};

const DEMO_FAMILIES: DemoFamilySeed[] = [
  {
    slug: "familia-mendes",
    name: "Família Mendes",
    contactName: "Mariana Mendes",
    bio: "Casal com duas crianças pequenas, rotina com escola e atividades à tarde.",
    state: "SP",
    city: "São Paulo",
    neighborhood: "Moema",
  },
  {
    slug: "familia-araujo",
    name: "Família Araújo",
    contactName: "Rafael Araújo",
    bio: "Buscamos apoio diário para cuidado infantil e organização da rotina noturna.",
    state: "SP",
    city: "Campinas",
    neighborhood: "Cambuí",
  },
  {
    slug: "familia-almeida",
    name: "Família Almeida",
    contactName: "Fernanda Almeida",
    bio: "Família com idosa em recuperação pós-cirúrgica precisando de acompanhamento.",
    state: "RJ",
    city: "Niterói",
    neighborhood: "Icaraí",
  },
  {
    slug: "familia-goncalves",
    name: "Família Gonçalves",
    contactName: "Paulo Gonçalves",
    bio: "Precisamos de profissional para plantões noturnos e finais de semana.",
    state: "RJ",
    city: "Rio de Janeiro",
    neighborhood: "Tijuca",
  },
  {
    slug: "familia-ribeiro",
    name: "Família Ribeiro",
    contactName: "Carla Ribeiro",
    bio: "Cuidado de idoso com mobilidade reduzida no período da manhã.",
    state: "MG",
    city: "Belo Horizonte",
    neighborhood: "Savassi",
  },
  {
    slug: "familia-souza",
    name: "Família Souza",
    contactName: "Diego Souza",
    bio: "Apoio para bebê de 10 meses durante horário comercial.",
    state: "MG",
    city: "Contagem",
    neighborhood: "Eldorado",
  },
  {
    slug: "familia-castro",
    name: "Família Castro",
    contactName: "Juliana Castro",
    bio: "Buscamos babá com experiência em crianças de 4 a 6 anos.",
    state: "PR",
    city: "Curitiba",
    neighborhood: "Batel",
  },
  {
    slug: "familia-teixeira",
    name: "Família Teixeira",
    contactName: "Roberto Teixeira",
    bio: "Necessidade de cuidadora para idosa com Alzheimer em fase inicial.",
    state: "PR",
    city: "Londrina",
    neighborhood: "Gleba Palhano",
  },
  {
    slug: "familia-moura",
    name: "Família Moura",
    contactName: "Luciana Moura",
    bio: "Procura-se profissional para plantão diurno com disponibilidade imediata.",
    state: "RS",
    city: "Porto Alegre",
    neighborhood: "Moinhos de Vento",
  },
  {
    slug: "familia-ferreira",
    name: "Família Ferreira",
    contactName: "André Ferreira",
    bio: "Família com rotina híbrida e necessidade de suporte em dias alternados.",
    state: "SC",
    city: "Florianópolis",
    neighborhood: "Trindade",
  },
];

const DEMO_PROFESSIONALS: DemoProfessionalSeed[] = [
  {
    slug: "ana-clara-souza",
    name: "Ana Clara Souza",
    bio: "Babá com formação em pedagogia infantil e experiência com recém-nascidos.",
    experienceYears: 6,
    serviceTypes: [ServiceType.BABYSITTER],
    state: "SP",
    city: "São Paulo",
    neighborhood: "Saúde",
    hourlyRateMin: 30,
    hourlyRateMax: 45,
    availability: "Segunda a sexta, manhã e tarde.",
    slots: [
      { weekday: Weekday.MONDAY, shifts: [Shift.MORNING, Shift.AFTERNOON] },
      { weekday: Weekday.TUESDAY, shifts: [Shift.MORNING, Shift.AFTERNOON] },
      { weekday: Weekday.WEDNESDAY, shifts: [Shift.MORNING, Shift.AFTERNOON] },
      { weekday: Weekday.THURSDAY, shifts: [Shift.MORNING, Shift.AFTERNOON] },
      { weekday: Weekday.FRIDAY, shifts: [Shift.MORNING, Shift.AFTERNOON] },
    ],
    verificationStatus: VerificationStatus.VERIFIED,
  },
  {
    slug: "beatriz-lima",
    name: "Beatriz Lima",
    bio: "Cuidadora de idosos com experiência em rotina medicamentosa e mobilidade.",
    experienceYears: 8,
    serviceTypes: [ServiceType.ELDER_CAREGIVER],
    state: "SP",
    city: "Campinas",
    neighborhood: "Taquaral",
    hourlyRateMin: 35,
    hourlyRateMax: 55,
    availability: "Plantões diurnos durante a semana.",
    slots: [
      { weekday: Weekday.MONDAY, shifts: [Shift.MORNING, Shift.AFTERNOON] },
      { weekday: Weekday.TUESDAY, shifts: [Shift.MORNING, Shift.AFTERNOON] },
      { weekday: Weekday.WEDNESDAY, shifts: [Shift.MORNING, Shift.AFTERNOON] },
      { weekday: Weekday.THURSDAY, shifts: [Shift.MORNING, Shift.AFTERNOON] },
      { weekday: Weekday.FRIDAY, shifts: [Shift.MORNING] },
    ],
    verificationStatus: VerificationStatus.VERIFIED,
  },
  {
    slug: "camila-freitas",
    name: "Camila Freitas",
    bio: "Profissional híbrida: babá e cuidadora, com foco em desenvolvimento e acolhimento.",
    experienceYears: 7,
    serviceTypes: [ServiceType.BABYSITTER, ServiceType.ELDER_CAREGIVER],
    state: "RJ",
    city: "Niterói",
    neighborhood: "Ingá",
    hourlyRateMin: 32,
    hourlyRateMax: 52,
    availability: "Segunda a sábado, com flexibilidade para noite.",
    slots: [
      { weekday: Weekday.MONDAY, shifts: [Shift.MORNING, Shift.AFTERNOON] },
      { weekday: Weekday.TUESDAY, shifts: [Shift.AFTERNOON, Shift.EVENING] },
      { weekday: Weekday.WEDNESDAY, shifts: [Shift.MORNING, Shift.AFTERNOON] },
      { weekday: Weekday.THURSDAY, shifts: [Shift.MORNING, Shift.EVENING] },
      { weekday: Weekday.FRIDAY, shifts: [Shift.AFTERNOON, Shift.EVENING] },
      { weekday: Weekday.SATURDAY, shifts: [Shift.MORNING] },
    ],
    verificationStatus: VerificationStatus.VERIFIED,
  },
  {
    slug: "daniela-porto",
    name: "Daniela Porto",
    bio: "Babá para rotina escolar, recreação e apoio em alimentação.",
    experienceYears: 5,
    serviceTypes: [ServiceType.BABYSITTER],
    state: "RJ",
    city: "Rio de Janeiro",
    neighborhood: "Botafogo",
    hourlyRateMin: 28,
    hourlyRateMax: 42,
    availability: "Turnos da tarde e noite em dias úteis.",
    slots: [
      { weekday: Weekday.MONDAY, shifts: [Shift.AFTERNOON, Shift.EVENING] },
      { weekday: Weekday.TUESDAY, shifts: [Shift.AFTERNOON, Shift.EVENING] },
      { weekday: Weekday.WEDNESDAY, shifts: [Shift.AFTERNOON, Shift.EVENING] },
      { weekday: Weekday.THURSDAY, shifts: [Shift.AFTERNOON, Shift.EVENING] },
      { weekday: Weekday.FRIDAY, shifts: [Shift.AFTERNOON] },
    ],
    verificationStatus: VerificationStatus.VERIFIED,
  },
  {
    slug: "elisa-magalhaes",
    name: "Elisa Magalhães",
    bio: "Cuidadora com experiência em acompanhamento noturno e suporte pós-internação.",
    experienceYears: 10,
    serviceTypes: [ServiceType.ELDER_CAREGIVER],
    state: "MG",
    city: "Belo Horizonte",
    neighborhood: "Funcionários",
    hourlyRateMin: 40,
    hourlyRateMax: 62,
    availability: "Plantões 12x36 e noturnos.",
    slots: [
      { weekday: Weekday.MONDAY, shifts: [Shift.OVERNIGHT] },
      { weekday: Weekday.WEDNESDAY, shifts: [Shift.OVERNIGHT] },
      { weekday: Weekday.FRIDAY, shifts: [Shift.OVERNIGHT] },
      { weekday: Weekday.SATURDAY, shifts: [Shift.EVENING, Shift.OVERNIGHT] },
    ],
    verificationStatus: VerificationStatus.VERIFIED,
  },
  {
    slug: "fernanda-nogueira",
    name: "Fernanda Nogueira",
    bio: "Babá com foco em estímulo pedagógico para primeira infância.",
    experienceYears: 4,
    serviceTypes: [ServiceType.BABYSITTER],
    state: "MG",
    city: "Contagem",
    neighborhood: "Cabral",
    hourlyRateMin: 25,
    hourlyRateMax: 38,
    availability: "Segunda a sexta no período da manhã.",
    slots: [
      { weekday: Weekday.MONDAY, shifts: [Shift.MORNING] },
      { weekday: Weekday.TUESDAY, shifts: [Shift.MORNING] },
      { weekday: Weekday.WEDNESDAY, shifts: [Shift.MORNING] },
      { weekday: Weekday.THURSDAY, shifts: [Shift.MORNING] },
      { weekday: Weekday.FRIDAY, shifts: [Shift.MORNING] },
    ],
    verificationStatus: VerificationStatus.VERIFIED,
  },
  {
    slug: "gabriela-campos",
    name: "Gabriela Campos",
    bio: "Profissional para cuidados infantis e apoio em tarefas leves da rotina.",
    experienceYears: 6,
    serviceTypes: [ServiceType.BABYSITTER, ServiceType.ELDER_CAREGIVER],
    state: "PR",
    city: "Curitiba",
    neighborhood: "Água Verde",
    hourlyRateMin: 30,
    hourlyRateMax: 50,
    availability: "Dias úteis e sábados pela manhã.",
    slots: [
      { weekday: Weekday.MONDAY, shifts: [Shift.MORNING, Shift.AFTERNOON] },
      { weekday: Weekday.TUESDAY, shifts: [Shift.MORNING, Shift.AFTERNOON] },
      { weekday: Weekday.WEDNESDAY, shifts: [Shift.MORNING, Shift.AFTERNOON] },
      { weekday: Weekday.THURSDAY, shifts: [Shift.MORNING, Shift.AFTERNOON] },
      { weekday: Weekday.FRIDAY, shifts: [Shift.MORNING, Shift.AFTERNOON] },
      { weekday: Weekday.SATURDAY, shifts: [Shift.MORNING] },
    ],
    verificationStatus: VerificationStatus.VERIFIED,
  },
  {
    slug: "helena-duarte",
    name: "Helena Duarte",
    bio: "Cuidadora especializada em idosos com Alzheimer e rotina de estímulos cognitivos.",
    experienceYears: 9,
    serviceTypes: [ServiceType.ELDER_CAREGIVER],
    state: "PR",
    city: "Londrina",
    neighborhood: "Jardim Quebec",
    hourlyRateMin: 38,
    hourlyRateMax: 60,
    availability: "Turnos da tarde/noite durante a semana.",
    slots: [
      { weekday: Weekday.MONDAY, shifts: [Shift.AFTERNOON, Shift.EVENING] },
      { weekday: Weekday.TUESDAY, shifts: [Shift.AFTERNOON, Shift.EVENING] },
      { weekday: Weekday.WEDNESDAY, shifts: [Shift.AFTERNOON, Shift.EVENING] },
      { weekday: Weekday.THURSDAY, shifts: [Shift.AFTERNOON, Shift.EVENING] },
      { weekday: Weekday.FRIDAY, shifts: [Shift.AFTERNOON] },
    ],
    verificationStatus: VerificationStatus.VERIFIED,
  },
  {
    slug: "isabela-rocha",
    name: "Isabela Rocha",
    bio: "Babá com experiência em gêmeos e rotina com atividades ao ar livre.",
    experienceYears: 5,
    serviceTypes: [ServiceType.BABYSITTER],
    state: "RS",
    city: "Porto Alegre",
    neighborhood: "Bela Vista",
    hourlyRateMin: 29,
    hourlyRateMax: 44,
    availability: "Horários flexíveis em semana completa.",
    slots: [
      { weekday: Weekday.MONDAY, shifts: [Shift.MORNING, Shift.AFTERNOON, Shift.EVENING] },
      { weekday: Weekday.TUESDAY, shifts: [Shift.MORNING, Shift.AFTERNOON] },
      { weekday: Weekday.WEDNESDAY, shifts: [Shift.MORNING, Shift.AFTERNOON] },
      { weekday: Weekday.THURSDAY, shifts: [Shift.MORNING, Shift.AFTERNOON, Shift.EVENING] },
      { weekday: Weekday.FRIDAY, shifts: [Shift.MORNING, Shift.AFTERNOON] },
    ],
    verificationStatus: VerificationStatus.VERIFIED,
  },
  {
    slug: "juliana-reis",
    name: "Juliana Reis",
    bio: "Profissional para cuidados de idosos com foco em companhia e administração de rotina.",
    experienceYears: 11,
    serviceTypes: [ServiceType.ELDER_CAREGIVER],
    state: "SC",
    city: "Florianópolis",
    neighborhood: "Itacorubi",
    hourlyRateMin: 42,
    hourlyRateMax: 65,
    availability: "Plantões diurnos e noturnos sob escala.",
    slots: [
      { weekday: Weekday.MONDAY, shifts: [Shift.MORNING, Shift.OVERNIGHT] },
      { weekday: Weekday.WEDNESDAY, shifts: [Shift.AFTERNOON, Shift.OVERNIGHT] },
      { weekday: Weekday.FRIDAY, shifts: [Shift.MORNING, Shift.OVERNIGHT] },
      { weekday: Weekday.SUNDAY, shifts: [Shift.AFTERNOON, Shift.EVENING] },
    ],
    verificationStatus: VerificationStatus.VERIFIED,
  },
];

const DEMO_JOBS: DemoJobSeed[] = [
  {
    familySlug: "familia-mendes",
    serviceType: ServiceType.BABYSITTER,
    title: "Babá para rotina escolar e pós-escola",
    description:
      "Buscamos profissional para chegada da escola, lanche, banho e atividades até o início da noite.",
    state: "SP",
    city: "São Paulo",
    neighborhood: "Moema",
    hourlyRateMin: 32,
    hourlyRateMax: 48,
    scheduleDetails: "Crianças de 4 e 7 anos. Prioridade para experiência com rotina escolar.",
    scheduleSlots: [
      { weekday: Weekday.MONDAY, startTime: "13:00", endTime: "19:00" },
      { weekday: Weekday.TUESDAY, startTime: "13:00", endTime: "19:00" },
      { weekday: Weekday.WEDNESDAY, startTime: "13:00", endTime: "19:00" },
      { weekday: Weekday.THURSDAY, startTime: "13:00", endTime: "19:00" },
      { weekday: Weekday.FRIDAY, startTime: "13:00", endTime: "19:00" },
    ],
  },
  {
    familySlug: "familia-araujo",
    serviceType: ServiceType.BABYSITTER,
    title: "Babá para bebê com rotina de sono/alimentação",
    description:
      "Família em home office busca apoio diário para alimentação, soneca e estímulos adequados à faixa etária.",
    state: "SP",
    city: "Campinas",
    neighborhood: "Cambuí",
    hourlyRateMin: 30,
    hourlyRateMax: 44,
    scheduleDetails: "Preferência por profissional com experiência em primeira infância.",
    scheduleSlots: [
      { weekday: Weekday.MONDAY, startTime: "09:00", endTime: "17:00" },
      { weekday: Weekday.TUESDAY, startTime: "09:00", endTime: "17:00" },
      { weekday: Weekday.WEDNESDAY, startTime: "09:00", endTime: "17:00" },
      { weekday: Weekday.THURSDAY, startTime: "09:00", endTime: "17:00" },
      { weekday: Weekday.FRIDAY, startTime: "09:00", endTime: "17:00" },
    ],
  },
  {
    familySlug: "familia-almeida",
    serviceType: ServiceType.ELDER_CAREGIVER,
    title: "Cuidadora para recuperação pós-cirúrgica",
    description:
      "Acompanhamento diário, administração de medicação e suporte em mobilidade leve.",
    state: "RJ",
    city: "Niterói",
    neighborhood: "Icaraí",
    hourlyRateMin: 36,
    hourlyRateMax: 56,
    scheduleDetails: "Idosa lúcida, família presente em parte do dia.",
    scheduleSlots: [
      { weekday: Weekday.MONDAY, startTime: "08:00", endTime: "14:00" },
      { weekday: Weekday.TUESDAY, startTime: "08:00", endTime: "14:00" },
      { weekday: Weekday.WEDNESDAY, startTime: "08:00", endTime: "14:00" },
      { weekday: Weekday.THURSDAY, startTime: "08:00", endTime: "14:00" },
      { weekday: Weekday.FRIDAY, startTime: "08:00", endTime: "14:00" },
      { weekday: Weekday.SATURDAY, startTime: "08:00", endTime: "12:00" },
    ],
  },
  {
    familySlug: "familia-goncalves",
    serviceType: ServiceType.ELDER_CAREGIVER,
    title: "Plantão noturno para idosa (escala)",
    description:
      "Necessário experiência com monitoramento noturno, troca de posição e rotina medicamentosa.",
    state: "RJ",
    city: "Rio de Janeiro",
    neighborhood: "Tijuca",
    hourlyRateMin: 42,
    hourlyRateMax: 64,
    scheduleDetails: "Escala noturna recorrente com folgas alternadas.",
    scheduleSlots: [
      { weekday: Weekday.MONDAY, startTime: "19:00", endTime: "23:00" },
      { weekday: Weekday.TUESDAY, startTime: "00:00", endTime: "07:00" },
      { weekday: Weekday.WEDNESDAY, startTime: "19:00", endTime: "23:00" },
      { weekday: Weekday.THURSDAY, startTime: "00:00", endTime: "07:00" },
      { weekday: Weekday.FRIDAY, startTime: "19:00", endTime: "23:00" },
      { weekday: Weekday.SATURDAY, startTime: "00:00", endTime: "07:00" },
    ],
  },
  {
    familySlug: "familia-ribeiro",
    serviceType: ServiceType.ELDER_CAREGIVER,
    title: "Cuidadora para turnos da manhã",
    description:
      "Apoio em higiene, alimentação e preparação para fisioterapia domiciliar.",
    state: "MG",
    city: "Belo Horizonte",
    neighborhood: "Savassi",
    hourlyRateMin: 34,
    hourlyRateMax: 50,
    scheduleDetails: "Família valoriza pontualidade e rotina estruturada.",
    scheduleSlots: [
      { weekday: Weekday.MONDAY, startTime: "07:00", endTime: "12:00" },
      { weekday: Weekday.TUESDAY, startTime: "07:00", endTime: "12:00" },
      { weekday: Weekday.WEDNESDAY, startTime: "07:00", endTime: "12:00" },
      { weekday: Weekday.THURSDAY, startTime: "07:00", endTime: "12:00" },
      { weekday: Weekday.FRIDAY, startTime: "07:00", endTime: "12:00" },
    ],
  },
  {
    familySlug: "familia-souza",
    serviceType: ServiceType.BABYSITTER,
    title: "Babá para período comercial",
    description:
      "Cuidado de bebê com rotina estruturada e apoio em alimentação e higienização.",
    state: "MG",
    city: "Contagem",
    neighborhood: "Eldorado",
    hourlyRateMin: 28,
    hourlyRateMax: 42,
    scheduleDetails: "Necessário seguir rotina de sono e alimentação enviada pela família.",
    scheduleSlots: [
      { weekday: Weekday.MONDAY, startTime: "08:00", endTime: "17:00" },
      { weekday: Weekday.TUESDAY, startTime: "08:00", endTime: "17:00" },
      { weekday: Weekday.WEDNESDAY, startTime: "08:00", endTime: "17:00" },
      { weekday: Weekday.THURSDAY, startTime: "08:00", endTime: "17:00" },
      { weekday: Weekday.FRIDAY, startTime: "08:00", endTime: "17:00" },
    ],
  },
  {
    familySlug: "familia-castro",
    serviceType: ServiceType.BABYSITTER,
    title: "Babá para criança em fase pré-escolar",
    description:
      "Apoio com tarefas leves, atividades recreativas e acompanhamento em aulas extracurriculares.",
    state: "PR",
    city: "Curitiba",
    neighborhood: "Batel",
    hourlyRateMin: 30,
    hourlyRateMax: 44,
    scheduleDetails: "Rotina em dias alternados com foco em desenvolvimento infantil.",
    scheduleSlots: [
      { weekday: Weekday.MONDAY, startTime: "12:00", endTime: "18:00" },
      { weekday: Weekday.WEDNESDAY, startTime: "12:00", endTime: "18:00" },
      { weekday: Weekday.FRIDAY, startTime: "12:00", endTime: "18:00" },
    ],
  },
  {
    familySlug: "familia-teixeira",
    serviceType: ServiceType.ELDER_CAREGIVER,
    title: "Cuidadora para Alzheimer em fase inicial",
    description:
      "Acompanhamento com estímulos cognitivos, companhia ativa e gestão de medicação.",
    state: "PR",
    city: "Londrina",
    neighborhood: "Gleba Palhano",
    hourlyRateMin: 39,
    hourlyRateMax: 58,
    scheduleDetails: "Família pede relatório breve no fim de cada turno.",
    scheduleSlots: [
      { weekday: Weekday.MONDAY, startTime: "14:00", endTime: "20:00" },
      { weekday: Weekday.TUESDAY, startTime: "14:00", endTime: "20:00" },
      { weekday: Weekday.WEDNESDAY, startTime: "14:00", endTime: "20:00" },
      { weekday: Weekday.THURSDAY, startTime: "14:00", endTime: "20:00" },
      { weekday: Weekday.FRIDAY, startTime: "14:00", endTime: "20:00" },
    ],
  },
  {
    familySlug: "familia-moura",
    serviceType: ServiceType.BABYSITTER,
    title: "Babá para fins de semana (sexta a domingo)",
    description:
      "Atendimento focado em rotina lúdica para criança de 3 anos durante os finais de semana.",
    state: "RS",
    city: "Porto Alegre",
    neighborhood: "Moinhos de Vento",
    hourlyRateMin: 32,
    hourlyRateMax: 46,
    scheduleDetails: "Pode incluir saída em parque no sábado, mediante alinhamento prévio.",
    scheduleSlots: [
      { weekday: Weekday.FRIDAY, startTime: "10:00", endTime: "18:00" },
      { weekday: Weekday.SATURDAY, startTime: "10:00", endTime: "18:00" },
      { weekday: Weekday.SUNDAY, startTime: "10:00", endTime: "18:00" },
    ],
  },
  {
    familySlug: "familia-ferreira",
    serviceType: ServiceType.ELDER_CAREGIVER,
    title: "Cuidadora para turnos alternados semanais",
    description:
      "Família busca apoio em dias alternados para idoso ativo com necessidade de acompanhamento em deslocamentos curtos.",
    state: "SC",
    city: "Florianópolis",
    neighborhood: "Trindade",
    hourlyRateMin: 38,
    hourlyRateMax: 56,
    scheduleDetails: "Escala combinada entre manhã e tarde, sem plantão noturno.",
    scheduleSlots: [
      { weekday: Weekday.MONDAY, startTime: "08:00", endTime: "12:00" },
      { weekday: Weekday.TUESDAY, startTime: "14:00", endTime: "18:00" },
      { weekday: Weekday.THURSDAY, startTime: "08:00", endTime: "12:00" },
      { weekday: Weekday.FRIDAY, startTime: "14:00", endTime: "18:00" },
    ],
  },
];

function demoEmail(slug: string, role: "family" | "professional") {
  return `${slug}.${role}@${DEMO_EMAIL_DOMAIN}`;
}

async function seedSuperAdmin() {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;

  if (!superAdminEmail) {
    console.log("SUPER_ADMIN_EMAIL not set. Skipping admin seed.");
    return;
  }

  const existing = await prisma.user.findUnique({
    where: { email: superAdminEmail },
    select: { id: true },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        acceptedTermsAt: new Date(),
        acceptedPrivacyAt: new Date(),
      },
    });

    console.log(`Updated existing super admin: ${superAdminEmail}`);
    return;
  }

  await prisma.user.create({
    data: {
      email: superAdminEmail,
      name: "Super Admin",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      acceptedTermsAt: new Date(),
      acceptedPrivacyAt: new Date(),
    },
  });

  console.log(`Created super admin: ${superAdminEmail}`);
}

async function seedLocalDevUsers() {
  const now = new Date();
  const passwordHash = await hash(LOCAL_DEV_PASSWORD, 12);

  await prisma.user.upsert({
    where: { email: LOCAL_DEV_ADMIN_EMAIL },
    update: {
      name: "Admin Local",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      passwordHash,
      acceptedTermsAt: now,
      acceptedPrivacyAt: now,
    },
    create: {
      email: LOCAL_DEV_ADMIN_EMAIL,
      name: "Admin Local",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      passwordHash,
      acceptedTermsAt: now,
      acceptedPrivacyAt: now,
    },
  });

  const familyUser = await prisma.user.upsert({
    where: { email: LOCAL_DEV_FAMILY_EMAIL },
    update: {
      name: "Família Local",
      role: UserRole.FAMILY,
      status: UserStatus.ACTIVE,
      passwordHash,
      acceptedTermsAt: now,
      acceptedPrivacyAt: now,
    },
    create: {
      email: LOCAL_DEV_FAMILY_EMAIL,
      name: "Família Local",
      role: UserRole.FAMILY,
      status: UserStatus.ACTIVE,
      passwordHash,
      acceptedTermsAt: now,
      acceptedPrivacyAt: now,
    },
    select: {
      id: true,
    },
  });

  await prisma.familyProfile.upsert({
    where: { userId: familyUser.id },
    update: {
      contactName: "Fernanda Local",
      bio: "Família de desenvolvimento para testes de jornada local.",
      state: "SP",
      city: "São Paulo",
      neighborhood: "Pinheiros",
    },
    create: {
      userId: familyUser.id,
      contactName: "Fernanda Local",
      bio: "Família de desenvolvimento para testes de jornada local.",
      state: "SP",
      city: "São Paulo",
      neighborhood: "Pinheiros",
    },
  });

  const caregiverUser = await prisma.user.upsert({
    where: { email: LOCAL_DEV_CAREGIVER_EMAIL },
    update: {
      name: "Cuidadora Local",
      role: UserRole.PROFESSIONAL,
      status: UserStatus.ACTIVE,
      passwordHash,
      acceptedTermsAt: now,
      acceptedPrivacyAt: now,
    },
    create: {
      email: LOCAL_DEV_CAREGIVER_EMAIL,
      name: "Cuidadora Local",
      role: UserRole.PROFESSIONAL,
      status: UserStatus.ACTIVE,
      passwordHash,
      acceptedTermsAt: now,
      acceptedPrivacyAt: now,
    },
    select: {
      id: true,
    },
  });

  const caregiverProfile = await prisma.professionalProfile.upsert({
    where: { userId: caregiverUser.id },
    update: {
      bio: "Profissional local de desenvolvimento para testar fluxo de contratação.",
      experienceYears: 7,
      serviceTypes: [ServiceType.ELDER_CAREGIVER],
      availability: "Segunda a sexta, manhã e tarde.",
      state: "SP",
      city: "São Paulo",
      neighborhood: "Vila Mariana",
      hourlyRateMin: 35,
      hourlyRateMax: 55,
      verificationStatus: VerificationStatus.VERIFIED,
      verificationNotes: "Conta local de desenvolvimento verificada por seed.",
    },
    create: {
      userId: caregiverUser.id,
      bio: "Profissional local de desenvolvimento para testar fluxo de contratação.",
      experienceYears: 7,
      serviceTypes: [ServiceType.ELDER_CAREGIVER],
      availability: "Segunda a sexta, manhã e tarde.",
      state: "SP",
      city: "São Paulo",
      neighborhood: "Vila Mariana",
      hourlyRateMin: 35,
      hourlyRateMax: 55,
      verificationStatus: VerificationStatus.VERIFIED,
      verificationNotes: "Conta local de desenvolvimento verificada por seed.",
    },
    select: {
      id: true,
    },
  });

  await prisma.professionalAvailabilitySlot.deleteMany({
    where: { professionalProfileId: caregiverProfile.id },
  });

  await prisma.professionalAvailabilityException.deleteMany({
    where: { professionalProfileId: caregiverProfile.id },
  });

  await prisma.professionalAvailabilitySlot.createMany({
    data: [
      {
        professionalProfileId: caregiverProfile.id,
        weekday: Weekday.MONDAY,
        shift: Shift.MORNING,
        isAvailable: true,
      },
      {
        professionalProfileId: caregiverProfile.id,
        weekday: Weekday.TUESDAY,
        shift: Shift.AFTERNOON,
        isAvailable: true,
      },
      {
        professionalProfileId: caregiverProfile.id,
        weekday: Weekday.WEDNESDAY,
        shift: Shift.MORNING,
        isAvailable: true,
      },
      {
        professionalProfileId: caregiverProfile.id,
        weekday: Weekday.THURSDAY,
        shift: Shift.AFTERNOON,
        isAvailable: true,
      },
      {
        professionalProfileId: caregiverProfile.id,
        weekday: Weekday.FRIDAY,
        shift: Shift.MORNING,
        isAvailable: true,
      },
    ],
  });

  await prisma.professionalDocument.deleteMany({
    where: { professionalProfileId: caregiverProfile.id },
  });

  await prisma.professionalDocument.create({
    data: {
      professionalProfileId: caregiverProfile.id,
      documentType: DocumentType.IDENTITY,
      fileUrl: DEMO_WORDPRESS_FILE,
      status: VerificationStatus.VERIFIED,
    },
  });

  console.log("Seeded local dev users (admin, family, caregiver).");

  return {
    familyUserId: familyUser.id,
    caregiverUserId: caregiverUser.id,
  };
}

async function seedLocalDevJobs(familyUserId: string) {
  const localJobs: Array<{
    title: string;
    serviceType: ServiceType;
    description: string;
    hourlyRateMin: number;
    hourlyRateMax: number;
    scheduleSlots: Array<{
      weekday: Weekday;
      startTime: string;
      endTime: string;
    }>;
  }> = [
    {
      title: "Local Dev - Cuidadora para rotina semanal",
      serviceType: ServiceType.ELDER_CAREGIVER,
      description:
        "Vaga local para testes de fluxo. Precisamos de cuidadora para rotina de acompanhamento de idoso durante dias úteis.",
      hourlyRateMin: 35,
      hourlyRateMax: 55,
      scheduleSlots: [
        { weekday: Weekday.MONDAY, startTime: "08:00", endTime: "12:00" },
        { weekday: Weekday.WEDNESDAY, startTime: "08:00", endTime: "12:00" },
        { weekday: Weekday.FRIDAY, startTime: "08:00", endTime: "12:00" },
      ],
    },
    {
      title: "Local Dev - Babá para meio período",
      serviceType: ServiceType.BABYSITTER,
      description:
        "Vaga local para testes de fluxo. Apoio com criança em rotina escolar no período da tarde.",
      hourlyRateMin: 30,
      hourlyRateMax: 45,
      scheduleSlots: [
        { weekday: Weekday.TUESDAY, startTime: "13:30", endTime: "18:00" },
        { weekday: Weekday.THURSDAY, startTime: "13:30", endTime: "18:00" },
      ],
    },
  ];

  for (const localJob of localJobs) {
    const existing = await prisma.jobPost.findFirst({
      where: {
        familyId: familyUserId,
        title: localJob.title,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      await prisma.jobPost.update({
        where: { id: existing.id },
        data: {
          serviceType: localJob.serviceType,
          description: localJob.description,
          state: "SP",
          city: "São Paulo",
          neighborhood: "Pinheiros",
          hourlyRateMin: localJob.hourlyRateMin,
          hourlyRateMax: localJob.hourlyRateMax,
          scheduleDetails: "Cenário de teste local entre contas seedadas.",
          status: "OPEN",
          isVisible: true,
          scheduleSlots: {
            deleteMany: {},
            create: localJob.scheduleSlots,
          },
        },
      });
      continue;
    }

    await prisma.jobPost.create({
      data: {
        familyId: familyUserId,
        serviceType: localJob.serviceType,
        title: localJob.title,
        description: localJob.description,
        state: "SP",
        city: "São Paulo",
        neighborhood: "Pinheiros",
        hourlyRateMin: localJob.hourlyRateMin,
        hourlyRateMax: localJob.hourlyRateMax,
        scheduleDetails: "Cenário de teste local entre contas seedadas.",
        scheduleSlots: {
          create: localJob.scheduleSlots,
        },
        status: "OPEN",
        isVisible: true,
      },
    });
  }

  console.log("Seeded local dev jobs for family account.");
}

async function seedDemoFamilies() {
  const familyIdsBySlug = new Map<string, string>();
  const now = new Date();

  for (const family of DEMO_FAMILIES) {
    const email = demoEmail(family.slug, "family");

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: family.name,
        role: UserRole.FAMILY,
        status: UserStatus.ACTIVE,
        acceptedTermsAt: now,
        acceptedPrivacyAt: now,
      },
      create: {
        email,
        name: family.name,
        role: UserRole.FAMILY,
        status: UserStatus.ACTIVE,
        acceptedTermsAt: now,
        acceptedPrivacyAt: now,
      },
      select: {
        id: true,
      },
    });

    await prisma.familyProfile.upsert({
      where: { userId: user.id },
      update: {
        contactName: family.contactName,
        bio: family.bio,
        state: family.state,
        city: family.city,
        neighborhood: family.neighborhood,
      },
      create: {
        userId: user.id,
        contactName: family.contactName,
        bio: family.bio,
        state: family.state,
        city: family.city,
        neighborhood: family.neighborhood,
      },
    });

    familyIdsBySlug.set(family.slug, user.id);
  }

  console.log(`Seeded ${familyIdsBySlug.size} demo family accounts.`);
  return familyIdsBySlug;
}

async function seedDemoProfessionals() {
  const now = new Date();

  for (const professional of DEMO_PROFESSIONALS) {
    const email = demoEmail(professional.slug, "professional");

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: professional.name,
        role: UserRole.PROFESSIONAL,
        status: UserStatus.ACTIVE,
        acceptedTermsAt: now,
        acceptedPrivacyAt: now,
      },
      create: {
        email,
        name: professional.name,
        role: UserRole.PROFESSIONAL,
        status: UserStatus.ACTIVE,
        acceptedTermsAt: now,
        acceptedPrivacyAt: now,
      },
      select: {
        id: true,
      },
    });

    const profile = await prisma.professionalProfile.upsert({
      where: { userId: user.id },
      update: {
        bio: professional.bio,
        experienceYears: professional.experienceYears,
        serviceTypes: professional.serviceTypes,
        availability: professional.availability,
        state: professional.state,
        city: professional.city,
        neighborhood: professional.neighborhood,
        hourlyRateMin: professional.hourlyRateMin,
        hourlyRateMax: professional.hourlyRateMax,
        verificationStatus: professional.verificationStatus,
        verificationNotes:
          professional.verificationStatus === VerificationStatus.VERIFIED
            ? "Verificação concluída (demo seed)."
            : "Aguardando revisão (demo seed).",
      },
      create: {
        userId: user.id,
        bio: professional.bio,
        experienceYears: professional.experienceYears,
        serviceTypes: professional.serviceTypes,
        availability: professional.availability,
        state: professional.state,
        city: professional.city,
        neighborhood: professional.neighborhood,
        hourlyRateMin: professional.hourlyRateMin,
        hourlyRateMax: professional.hourlyRateMax,
        verificationStatus: professional.verificationStatus,
        verificationNotes:
          professional.verificationStatus === VerificationStatus.VERIFIED
            ? "Verificação concluída (demo seed)."
            : "Aguardando revisão (demo seed).",
      },
      select: {
        id: true,
      },
    });

    await prisma.professionalAvailabilitySlot.deleteMany({
      where: { professionalProfileId: profile.id },
    });

    await prisma.professionalAvailabilityException.deleteMany({
      where: { professionalProfileId: profile.id },
    });

    const slotRows = professional.slots.flatMap((slot) =>
      slot.shifts.map((shift) => ({
        professionalProfileId: profile.id,
        weekday: slot.weekday,
        shift,
        isAvailable: true,
      })),
    );

    if (slotRows.length > 0) {
      await prisma.professionalAvailabilitySlot.createMany({
        data: slotRows,
      });
    }

    await prisma.professionalDocument.deleteMany({
      where: { professionalProfileId: profile.id },
    });

    await prisma.professionalDocument.create({
      data: {
        professionalProfileId: profile.id,
        documentType: DocumentType.IDENTITY,
        fileUrl: DEMO_WORDPRESS_FILE,
        status:
          professional.verificationStatus === VerificationStatus.VERIFIED
            ? VerificationStatus.VERIFIED
            : VerificationStatus.UNDER_REVIEW,
      },
    });
  }

  console.log(`Seeded ${DEMO_PROFESSIONALS.length} demo professional accounts.`);
}

async function seedDemoJobs(familyIdsBySlug: Map<string, string>) {
  const familyIds = [...familyIdsBySlug.values()];

  if (familyIds.length > 0) {
    await prisma.jobPost.deleteMany({
      where: {
        familyId: {
          in: familyIds,
        },
      },
    });
  }

  for (const job of DEMO_JOBS) {
    const familyId = familyIdsBySlug.get(job.familySlug);
    if (!familyId) {
      continue;
    }

    await prisma.jobPost.create({
      data: {
        familyId,
        serviceType: job.serviceType,
        title: job.title,
        description: job.description,
        state: job.state,
        city: job.city,
        neighborhood: job.neighborhood,
        hourlyRateMin: job.hourlyRateMin,
        hourlyRateMax: job.hourlyRateMax,
        scheduleDetails: job.scheduleDetails,
        scheduleSlots: {
          create: job.scheduleSlots.map((slot) => ({
            weekday: slot.weekday,
            startTime: slot.startTime,
            endTime: slot.endTime,
          })),
        },
        status: "OPEN",
        isVisible: true,
      },
    });
  }

  console.log(`Seeded ${DEMO_JOBS.length} demo jobs.`);
}

async function deleteStaleDemoUsers() {
  const expectedEmails = new Set<string>([
    ...DEMO_FAMILIES.map((family) => demoEmail(family.slug, "family")),
    ...DEMO_PROFESSIONALS.map((professional) => demoEmail(professional.slug, "professional")),
  ]);

  const existingDemoUsers = await prisma.user.findMany({
    where: {
      email: {
        endsWith: `@${DEMO_EMAIL_DOMAIN}`,
      },
    },
    select: {
      id: true,
      email: true,
    },
  });

  const staleUserIds = existingDemoUsers
    .filter((user) => user.email && !expectedEmails.has(user.email))
    .map((user) => user.id);

  if (staleUserIds.length > 0) {
    await prisma.user.deleteMany({
      where: {
        id: {
          in: staleUserIds,
        },
      },
    });
  }
}

async function main() {
  await seedSuperAdmin();
  const localUsers = await seedLocalDevUsers();
  await seedLocalDevJobs(localUsers.familyUserId);
  await deleteStaleDemoUsers();
  const familyIdsBySlug = await seedDemoFamilies();
  await seedDemoProfessionals();
  await seedDemoJobs(familyIdsBySlug);

  console.log("Demo seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
