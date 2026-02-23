export const DESIGN_MEDIA_KEYS = [
  "homeHero",
  "serviceBabysitter",
  "serviceElderCare",
  "serviceModeration",
  "serviceChat",
  "featuredPro1",
  "featuredPro2",
  "featuredPro3",
  "testimonialFamily",
  "testimonialProfessional",
  "loginHero",
  "onboardingHero",
  "jobsHero",
  "professionalsHero",
] as const;

export type DesignMediaKey = (typeof DESIGN_MEDIA_KEYS)[number];

export type DesignMediaCatalogItem = {
  key: DesignMediaKey;
  url: string;
  alt: string;
  width: number;
  height: number;
  mediaId: number | null;
};

export const designMediaCatalog: Record<DesignMediaKey, DesignMediaCatalogItem> = {
  homeHero: {
    key: "homeHero",
    url: "",
    alt: "Família com babá sorrindo na sala, estilo ilustração amigável",
    width: 1536,
    height: 1024,
    mediaId: null,
  },
  serviceBabysitter: {
    key: "serviceBabysitter",
    url: "",
    alt: "Babá cuidando de criança em atividade educativa",
    width: 1536,
    height: 1024,
    mediaId: null,
  },
  serviceElderCare: {
    key: "serviceElderCare",
    url: "",
    alt: "Cuidadora acompanhando idosa em caminhada segura",
    width: 1536,
    height: 1024,
    mediaId: null,
  },
  serviceModeration: {
    key: "serviceModeration",
    url: "",
    alt: "Interface de moderação com selos de verificação",
    width: 1536,
    height: 1024,
    mediaId: null,
  },
  serviceChat: {
    key: "serviceChat",
    url: "",
    alt: "Família e profissional conversando por chat protegido",
    width: 1536,
    height: 1024,
    mediaId: null,
  },
  featuredPro1: {
    key: "featuredPro1",
    url: "",
    alt: "Profissional de cuidado com postura acolhedora",
    width: 1024,
    height: 1024,
    mediaId: null,
  },
  featuredPro2: {
    key: "featuredPro2",
    url: "",
    alt: "Profissional de cuidado em atendimento residencial",
    width: 1024,
    height: 1024,
    mediaId: null,
  },
  featuredPro3: {
    key: "featuredPro3",
    url: "",
    alt: "Cuidadora experiente em ambiente doméstico",
    width: 1024,
    height: 1024,
    mediaId: null,
  },
  testimonialFamily: {
    key: "testimonialFamily",
    url: "",
    alt: "Família satisfeita com contratação de cuidadora",
    width: 1024,
    height: 1024,
    mediaId: null,
  },
  testimonialProfessional: {
    key: "testimonialProfessional",
    url: "",
    alt: "Profissional feliz após contratação bem-sucedida",
    width: 1024,
    height: 1024,
    mediaId: null,
  },
  loginHero: {
    key: "loginHero",
    url: "",
    alt: "Ilustração de confiança e acesso seguro na plataforma",
    width: 1536,
    height: 1024,
    mediaId: null,
  },
  onboardingHero: {
    key: "onboardingHero",
    url: "",
    alt: "Usuário escolhendo papel entre família e profissional",
    width: 1536,
    height: 1024,
    mediaId: null,
  },
  jobsHero: {
    key: "jobsHero",
    url: "",
    alt: "Mapa de oportunidades com vagas abertas",
    width: 1536,
    height: 1024,
    mediaId: null,
  },
  professionalsHero: {
    key: "professionalsHero",
    url: "",
    alt: "Galeria de profissionais com selo de verificação",
    width: 1536,
    height: 1024,
    mediaId: null,
  },
};
