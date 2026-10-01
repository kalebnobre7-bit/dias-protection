import type { SiteContent } from "@/lib/types";

// Conteúdo local da Fase A. Vira seed do Supabase na Fase B.
// Fonte: currículo e perfil do Gabriel (docs/referencias). ⚠️ = confirmar com ele.

export const localContent: SiteContent = {
  company: {
    legalName: "Dias Consultoria e Logística",
    brandName: "Dias Protection",
    tagline: "Protection is our business",
    founderName: "Gabriel Sabino Dias",
    founderShortName: "Gabriel Dias",
    founderRole: {
      pt: "Fundador · Close Protection Officer",
      en: "Founder · Close Protection Officer",
    },
    founderBio: {
      pt: "Ex-detetive da Polícia Civil de São Paulo e Close Protection Officer em operações de empresas globais de segurança. Gabriel planeja pessoalmente cada missão: análise de risco, rota, equipe e veículo. O atendimento começa e termina com ele.",
      en: "Former São Paulo Civil Police detective and Close Protection Officer for global security firms. Gabriel personally plans every mission: risk assessment, route, team and vehicle. Service starts and ends with him.",
    },
    founderPhoto: "/images/gabriel.jpg",
    about: {
      pt: "A Dias Protection é especializada em segurança executiva e suporte logístico personalizado para empresários, executivos, hóspedes e clientes de alto padrão. Oferecemos proteção armada, escolta veicular, transporte executivo e motoristas bilíngues, atuando com discrição, agilidade e planejamento em cada operação.",
      en: "Dias Protection specializes in executive protection and tailored logistics support for business owners, executives, hotel guests and high-profile clients. We provide armed protection, vehicle escort, executive transportation and bilingual drivers, operating with discretion, agility and planning in every operation.",
    },
    whatsapp: "5511970717926", // ⚠️ número do Linktree; o currículo tem outro (11 97610-0121)
    email: "gsdias94@gmail.com",
    instagram: "diasprotection",
    linkedin: "gabrielsabinodias",
    city: "São Paulo · Brasil",
  },

  founder: {
    stats: [
      { value: "5+", label: { pt: "anos em proteção e investigação", en: "years in protection & investigation" } },
      { value: "0", label: { pt: "incidentes em operação", en: "incidents on duty" } },
      { value: "3", label: { pt: "idiomas no atendimento", en: "service languages" } },
      { value: "24/7", label: { pt: "atendimento", en: "availability" } },
    ],
    timeline: [
      {
        period: { pt: "2021–2024", en: "2021–2024" },
        title: { pt: "Detetive · Polícia Civil de SP", en: "Detective · São Paulo Civil Police" },
        text: {
          pt: "Investigação, inteligência, vigilância e entrevistas. Promoção por mérito, dois elogios oficiais e atuação em investigação de repercussão nacional.",
          en: "Investigation, intelligence, surveillance and interviews. Merit promotion, two official commendations and work on a nationally reported case.",
        },
      },
      {
        period: { pt: "2022–hoje", en: "2022–present" },
        title: { pt: "Close Protection Officer", en: "Close Protection Officer" },
        text: {
          pt: "Proteção executiva em operações de empresas globais de segurança: advance, análise de risco, movimentação segura, segurança de locais e interpretação.",
          en: "Executive protection for global security firms: advance work, risk assessment, secure movement, venue security and interpreting.",
        },
      },
      {
        period: { pt: "2025–hoje", en: "2025–present" },
        title: { pt: "Motorista executivo bilíngue", en: "Bilingual executive driver" },
        text: {
          pt: "Transporte seguro de executivos e VIPs, incluindo veículos blindados. Planejamento de rota, inspeção de veículo e direção defensiva, sem acidentes.",
          en: "Secure transport for executives and VIPs, including armored vehicles. Route planning, vehicle inspection and defensive driving, accident-free.",
        },
      },
      {
        period: { pt: "Hoje", en: "Today" },
        title: { pt: "Dias Protection", en: "Dias Protection" },
        text: {
          pt: "Toda essa experiência reunida em uma operação própria, com equipe selecionada para cada missão.",
          en: "All of that experience brought together in his own operation, with a team selected for each mission.",
        },
      },
    ],
    certifications: [
      "DSO · Defensive Shooting Officer (IDSC)",
      "Stop The Bleed · American College of Surgeons",
      "Heartsaver First Aid / CPR / AED · American Heart Association",
      "TECC · Tactical Emergency Casualty Care",
      "UNITAR · Introduction to the UN System",
      "SENASP · Investigação e análise patrimonial",
      "Direção defensiva",
      "EF SET English C2",
    ],
    recognitions: [
      {
        pt: "Elogio da Secretaria da Segurança Pública de SP (2025)",
        en: "Commendation, São Paulo Public Security Department (2025)",
      },
      { pt: "Elogio da Polícia Civil por caso complexo (2024)", en: "Civil Police commendation for a complex case (2024)" },
      { pt: "Promoção por mérito na Polícia Civil", en: "Merit promotion, Civil Police" },
    ],
    education: [
      {
        pt: "Especialização em Investigação de Cibercrimes · Academia da Polícia Civil de SP",
        en: "Cybercrime Investigation specialization · São Paulo Civil Police Academy",
      },
      { pt: "Tecnólogo em Tecnologia da Informação · Anhembi Morumbi", en: "Associate degree in IT · Anhembi Morumbi" },
    ],
    languages: { pt: "Português · Inglês fluente · Espanhol", en: "Portuguese · Fluent English · Spanish" },
    // ⚠️ confirmar com o Gabriel se pode exibir
    // Logos baixadas dos sites oficiais; sem `logo` aparece como texto
    experienceWith: [
      { name: "Pinkerton", logo: "/images/logos/pinkerton.png" },
      { name: "Global Guardian", logo: "/images/logos/global-guardian.png" },
      { name: "SCS" }, // o logo oficial é só o símbolo, ilegível sem o nome
      { name: "Crisol Group" },
      { name: "Royal American Group", logo: "/images/logos/royal-american.png", scale: 1.7 },
      { name: "Fórmula 1", logo: "/images/logos/f1.svg" },
    ],
    notableClients: [
      { name: "Mario Isola", context: "Pirelli · Fórmula 1" },
      { name: "Earl Bamber", context: "Fórmula E" },
      { name: "Maria Sharapova", context: "SP Open" },
      { name: "Kristin Peck", context: "Zoetis" },
      { name: "Raghav Sahgal", context: "Nokia" },
      { name: "Jeferson Propheta", context: "CrowdStrike LATAM" },
    ],
    showNotableClients: false,
  },

  serviceTypes: [
    {
      id: "protecao-executiva",
      name: { pt: "Proteção executiva", en: "Executive protection" },
      summary: {
        pt: "Agentes ao lado do protegido em agenda, reuniões, eventos e deslocamentos.",
        en: "Agents alongside the principal at meetings, events and on the move.",
      },
      description: {
        pt: "Close protection no padrão das empresas globais de segurança. Agentes treinados acompanham o protegido durante toda a agenda, com presença discreta, leitura constante do ambiente e plano de contingência definido antes da operação começar.",
        en: "Close protection to the standard of global security firms. Trained agents accompany the principal throughout the schedule, with a discreet presence, constant situational awareness and a contingency plan set before the operation begins.",
      },
      includes: {
        pt: [
          "Agentes armados ou desarmados",
          "Análise de risco da agenda",
          "Advance em locais e rotas",
          "Comunicação por rádio entre a equipe",
          "Atendimento em inglês",
        ],
        en: [
          "Armed or unarmed agents",
          "Schedule risk assessment",
          "Advance work on venues and routes",
          "Radio communication across the team",
          "Service in English",
        ],
      },
      idealFor: {
        pt: "Executivos C-level, celebridades, atletas e visitantes estrangeiros.",
        en: "C-level executives, celebrities, athletes and foreign visitors.",
      },
      image: "/images/agent.jpg",
      sortOrder: 1,
    },
    {
      id: "escolta-veicular",
      name: { pt: "Escolta veicular", en: "Vehicle escort" },
      summary: {
        pt: "Veículo de apoio com agentes acompanhando cada deslocamento.",
        en: "Support vehicle with agents shadowing every journey.",
      },
      description: {
        pt: "Um veículo de apoio segue o veículo principal com agentes preparados para reagir. A rota é estudada antes, com alternativas e pontos seguros mapeados, para que o deslocamento aconteça sem surpresas.",
        en: "A support vehicle follows the principal vehicle with agents ready to respond. The route is studied in advance, with alternatives and safe points mapped, so the journey happens without surprises.",
      },
      includes: {
        pt: [
          "Veículo de apoio com agentes",
          "Planejamento de rota e rotas alternativas",
          "Opção de veículo principal blindado",
          "Coordenação entre motoristas e equipe",
        ],
        en: [
          "Support vehicle with agents",
          "Route and alternative-route planning",
          "Armored principal vehicle option",
          "Coordination between drivers and team",
        ],
      },
      idealFor: {
        pt: "Deslocamentos de alto valor, comitivas e trajetos sensíveis.",
        en: "High-value movements, delegations and sensitive routes.",
      },
      image: "/images/convoy.jpg",
      sortOrder: 2,
    },
    {
      id: "transporte-executivo",
      name: { pt: "Transporte executivo bilíngue", en: "Bilingual executive transport" },
      summary: {
        pt: "Aeroporto, hotel e reuniões com motorista que fala inglês.",
        en: "Airport, hotel and meetings with an English-speaking driver.",
      },
      description: {
        pt: "Motoristas executivos treinados em direção defensiva, que falam inglês e conhecem a rotina de quem viaja a trabalho. Recepção no aeroporto, transfers entre hotel e compromissos e diárias à disposição.",
        en: "Executive drivers trained in defensive driving who speak English and understand business travel. Airport meet & greet, hotel-to-meeting transfers and full days on call.",
      },
      includes: {
        pt: [
          "Motorista bilíngue (PT/EN)",
          "Recepção no aeroporto",
          "Sedan, SUV, blindado ou van",
          "Diária ou transfer avulso",
          "Pontualidade e rota planejada",
        ],
        en: [
          "Bilingual driver (PT/EN)",
          "Airport meet & greet",
          "Sedan, SUV, armored or van",
          "Day rate or single transfer",
          "Punctuality and planned route",
        ],
      },
      idealFor: {
        pt: "Hóspedes de hotéis de alto padrão e executivos em viagem.",
        en: "Guests of high-end hotels and travelling executives.",
      },
      image: "/images/driver.jpg",
      sortOrder: 3,
    },
    {
      id: "eventos",
      name: { pt: "Segurança para eventos", en: "Event security" },
      summary: {
        pt: "Cobertura de segurança e logística para eventos e comitivas.",
        en: "Security and logistics coverage for events and delegations.",
      },
      description: {
        pt: "Planejamento e execução de segurança para eventos corporativos, esportivos e privados, com experiência em grandes eventos internacionais. Controle de acesso, proteção de convidados VIP e logística de chegada e saída.",
        en: "Security planning and execution for corporate, sporting and private events, with experience at major international events. Access control, VIP guest protection and arrival and departure logistics.",
      },
      includes: {
        pt: [
          "Planejamento de segurança do evento",
          "Proteção de convidados VIP",
          "Logística de chegada e saída",
          "Equipe dimensionada ao evento",
        ],
        en: [
          "Event security planning",
          "VIP guest protection",
          "Arrival and departure logistics",
          "Team sized to the event",
        ],
      },
      idealFor: {
        pt: "Eventos corporativos, esportivos, lançamentos e recepções privadas.",
        en: "Corporate and sporting events, launches and private receptions.",
      },
      image: "/images/event.jpg",
      sortOrder: 4,
    },
    {
      id: "analise-de-risco",
      name: { pt: "Advance e análise de risco", en: "Advance & risk assessment" },
      summary: {
        pt: "Reconhecimento prévio de locais, rotas e cenários antes da agenda.",
        en: "Prior reconnaissance of venues, routes and scenarios before the schedule.",
      },
      description: {
        pt: "Antes de qualquer operação, o local é visitado, as rotas são testadas e os riscos são mapeados. O resultado é um plano claro, com contingências, que orienta a equipe e dá tranquilidade ao cliente.",
        en: "Before any operation, venues are visited, routes are tested and risks are mapped. The result is a clear plan with contingencies that guides the team and reassures the client.",
      },
      includes: {
        pt: [
          "Visita prévia a locais",
          "Mapeamento de rotas e pontos seguros",
          "Hospitais e apoio de emergência mapeados",
          "Relatório com plano de contingência",
        ],
        en: [
          "Prior venue visits",
          "Route and safe-point mapping",
          "Hospitals and emergency support mapped",
          "Report with contingency plan",
        ],
      },
      idealFor: {
        pt: "Agendas de visitantes estrangeiros, viagens corporativas e eventos.",
        en: "Foreign visitor schedules, corporate trips and events.",
      },
      image: "/images/planning.jpg",
      sortOrder: 5,
    },
  ],

  // ⚠️ confirmar frota real com o Gabriel
  vehicleCategories: [
    {
      id: "sedan",
      name: { pt: "Sedan executivo", en: "Executive sedan" },
      description: { pt: "Discreto, para agendas urbanas.", en: "Discreet, for city schedules." },
      capacity: 3,
      armored: false,
      image: "/images/fleet/sedan.webp",
      sortOrder: 1,
    },
    {
      id: "suv",
      name: { pt: "SUV executivo", en: "Executive SUV" },
      description: { pt: "Mais espaço e bagagem.", en: "More room and luggage space." },
      capacity: 4,
      armored: false,
      image: "/images/fleet/suv.webp",
      sortOrder: 2,
    },
    {
      id: "suv-blindado",
      name: { pt: "SUV blindado", en: "Armored SUV" },
      description: { pt: "Blindagem para deslocamentos sensíveis.", en: "Armored for sensitive journeys." },
      capacity: 4,
      armored: true,
      image: "/images/fleet/suv-blindado.webp",
      sortOrder: 3,
    },
    {
      id: "van",
      name: { pt: "Van executiva", en: "Executive van" },
      description: { pt: "Comitivas e grupos.", en: "Delegations and groups." },
      capacity: 10,
      armored: false,
      image: "/images/fleet/van.webp",
      sortOrder: 4,
    },
  ],

  // Agentes entram pelo painel (Fase B). Vazio = página mostra só o fundador e os critérios.
  agents: [],
};
