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
      pt: "Com mais de 5 anos de experiência em investigações de alta complexidade e operações de alto risco na Polícia Civil do Estado de São Paulo.\n\nE mais de 5 anos de experiência em transporte e proteção executiva, operando e coordenando operações, viagens, eventos exclusivos e protegendo instalações e patrimônios de alto valor. Sua trajetória inclui atendimento a executivos de grandes corporações e personalidades internacionais, com atuação em análise de ameaças, planejamento preventivo, logística de deslocamentos, transporte de padrão executivo e segurança pessoal.",
      en: "Over 5 years of experience in high-complexity investigations and high-risk operations with the São Paulo State Civil Police.\n\nAnd over 5 years of experience in executive transportation and protection, running and coordinating operations, travel and exclusive events, and protecting high-value facilities and assets. His track record includes serving executives of major corporations and international public figures, with work in threat analysis, preventive planning, movement logistics, executive-standard transportation and personal security.",
    },
    founderPhoto: "/images/gabriel.jpg",
    about: {
      pt: "A Dias Protection é especializada em segurança executiva e suporte logístico personalizado para empresários, executivos, hóspedes e clientes de alto padrão. Oferecemos proteção armada, escolta veicular, transporte executivo, segurança de eventos e de patrimônio, atuando com discrição, agilidade e planejamento em cada operação, em todo o território nacional.",
      en: "Dias Protection specializes in executive protection and tailored logistics support for business owners, executives, hotel guests and high-profile clients. We provide armed protection, vehicle escort, executive transportation, event and asset security, operating with discretion, agility and planning in every operation, anywhere in Brazil.",
    },
    whatsapp: "5511970717926", // ⚠️ número do Linktree; o currículo tem outro (11 97610-0121)
    email: "gsdias94@gmail.com",
    instagram: "diasprotection",
    linkedin: "gabrielsabinodias",
    city: "São Paulo · Brasil",
    // Logos em public/images/logos/clients; sem `logo` aparece como texto
    trustedBy: [
      { name: "Globo Esporte", logo: "/images/logos/clients/ge-globo.svg", scale: 1.4 },
      { name: "Bradesco", logo: "/images/logos/clients/bradesco.svg" },
      { name: "SP Open" },
      { name: "Fórmula 1", logo: "/images/logos/f1.svg" },
      { name: "Fórmula E", logo: "/images/logos/clients/formula-e.svg", scale: 0.8 },
      { name: "Richemont", logo: "/images/logos/clients/richemont.svg", scale: 0.55 },
      { name: "IWC Schaffhausen", logo: "/images/logos/clients/iwc.svg", scale: 1.6 },
      { name: "Zoetis", logo: "/images/logos/clients/zoetis.svg" },
      { name: "BeOne", logo: "/images/logos/clients/beone.svg" },
      { name: "Nokia", logo: "/images/logos/clients/nokia.svg" },
      { name: "Global Payments", logo: "/images/logos/clients/global-payments.svg" },
      { name: "Worldpay", logo: "/images/logos/clients/worldpay.svg" },
      { name: "Eaton", logo: "/images/logos/clients/eaton.svg", scale: 0.85 },
      { name: "Wärtsilä", logo: "/images/logos/clients/wartsila.svg", scale: 1.6 },
      { name: "Aptiv", logo: "/images/logos/clients/aptiv.svg", scale: 0.7 },
      { name: "Keystone Investors" },
      { name: "CrowdStrike", logo: "/images/logos/clients/crowdstrike.svg" },
      { name: "Experian", logo: "/images/logos/clients/experian.svg", scale: 1.2 },
      { name: "ASICS", logo: "/images/logos/clients/asics.svg" },
      { name: "Amazon", logo: "/images/logos/clients/amazon.svg" },
    ],
  },

  founder: {
    stats: [
      {
        value: "5+",
        label: {
          pt: "anos de experiência em investigações de alta complexidade e coordenação de operações em áreas de risco",
          en: "years of experience in high-complexity investigations and coordinating operations in high-risk areas",
        },
      },
      { value: "0", label: { pt: "incidentes em serviço em todo o histórico", en: "incidents on duty across his entire record" } },
    ],
    timeline: [
      {
        period: { pt: "Desde 2021", en: "Since 2021" },
        title: { pt: "Segurança Pública", en: "Law Enforcement" },
        text: {
          pt: "Investigação, gerenciamento de crises e conflitos e coordenação de operações sob stress.",
          en: "Investigation, crisis and conflict management, and coordination of operations under stress.",
        },
      },
      {
        period: { pt: "Desde 2021", en: "Since 2021" },
        title: { pt: "Segurança executiva", en: "Executive protection" },
        text: {
          pt: "Histórico de operações de empresas globais de segurança.",
          en: "A track record in operations for global security firms.",
        },
        logos: true,
        more: {
          pt: "Coordenação completa de operações (condução de \"avançado\", análise de risco e logística de operações, transporte e proteção pessoal) em atendimento a C-levels de empresas globais, além de pessoas públicas e indivíduos de alto patrimônio.\n\nCoordenação da segurança de eventos e experiências VIP.",
          en: "End-to-end coordination of operations (advance work, risk assessment and operational logistics, transportation and close protection) for C-level executives of global companies, as well as public figures and high-net-worth individuals.\n\nSecurity coordination for VIP events and experiences.",
        },
      },
      {
        period: { pt: "Hoje", en: "Today" },
        title: { pt: "Dias Protection", en: "Dias Protection" },
        text: {
          pt: "Toda essa experiência reunida em uma operação própria. Contamos com um time de elite, do qual selecionamos de forma personalizada os melhores operadores para cada missão.",
          en: "All of that experience brought together in our own operation. We rely on an elite team, from which we hand-pick the best operators for each mission.",
        },
      },
    ],
    certifications: [
      {
        pt: "Atleta e árbitro (DSO) pela Confederação Internacional de Tiro Defensivo (IDSC)",
        en: "Defensive Shooting Officer (DSO) · International Defensive Shooting Confederation (IDSC)",
      },
      { pt: "Stop The Bleed · American College of Surgeons", en: "Stop The Bleed · American College of Surgeons" },
      {
        pt: "Primeiros Socorros com RCP e DEA (Salva Corações) · Hospital Albert Einstein e American Heart Association",
        en: "Heartsaver First Aid / CPR / AED · Albert Einstein Hospital and American Heart Association",
      },
      { pt: "TECC · Tactical Emergency Casualty Care", en: "TECC · Tactical Emergency Casualty Care" },
      {
        pt: "Instituto de Treinamento para Operações de Paz da ONU (POTI) · An Introduction to the UN System and Its Role in International Peace and Security",
        en: "UN Peace Operations Training Institute (POTI) · An Introduction to the UN System and Its Role in International Peace and Security",
      },
      {
        pt: "Secretaria Nacional de Segurança Pública (SENASP) · Investigação e análise patrimonial",
        en: "National Public Security Secretariat (SENASP) · Investigation and Asset Analysis",
      },
      { pt: "Direção defensiva", en: "Defensive Driving" },
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
    // Logos baixadas dos sites oficiais; sem `logo` aparece como texto
    experienceWith: [
      { name: "Pinkerton", logo: "/images/logos/pinkerton.png" },
      { name: "Global Guardian", logo: "/images/logos/global-guardian.png" },
      { name: "SCS" }, // o logo oficial é só o símbolo, ilegível sem o nome
      { name: "Royal American Group", logo: "/images/logos/royal-american.png", scale: 1.7 },
      { name: "Crisol Group" },
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
          "Advance e análise de risco inclusos",
          "Agentes armados ou desarmados",
          "Escolta veicular opcional",
          "Comunicação por rádio entre a equipe",
          "Atendimento em qualquer idioma",
        ],
        en: [
          "Advance work and risk assessment included",
          "Armed or unarmed agents",
          "Optional vehicle escort",
          "Radio communication across the team",
          "Service in any language",
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
          "Sedan, SUV, blindados, minivan ou Jet Van",
          "Diária ou transfer avulso",
          "Pontualidade e rota planejada",
        ],
        en: [
          "Bilingual driver (PT/EN)",
          "Airport meet & greet",
          "Sedan, SUV, armored, minivan or Jet Van",
          "Day rate or single transfer",
          "Punctuality and planned route",
        ],
      },
      idealFor: {
        pt: "Hóspedes de hotéis de alto padrão e executivos em viagem.",
        en: "Guests of high-end hotels and travelling executives.",
      },
      image: "/images/driver.jpg",
      sortOrder: 2,
    },
    {
      id: "eventos",
      name: { pt: "Segurança em eventos privados", en: "Private event security" },
      summary: {
        pt: "Segurança e logística para eventos, recepções e experiências VIP.",
        en: "Security and logistics for events, receptions and VIP experiences.",
      },
      description: {
        pt: "Planejamento e coordenação da segurança de eventos privados, corporativos e experiências VIP, com experiência em grandes eventos internacionais. Controle de acesso, proteção de convidados e logística de chegada e saída, com a discrição que o evento pede.",
        en: "Security planning and coordination for private and corporate events and VIP experiences, with experience at major international events. Access control, guest protection and arrival and departure logistics, with the discretion the occasion demands.",
      },
      includes: {
        pt: [
          "Advance e análise de risco inclusos",
          "Planejamento de segurança do evento",
          "Controle de acesso e proteção de convidados VIP",
          "Logística de chegada e saída",
          "Equipe dimensionada ao evento",
        ],
        en: [
          "Advance work and risk assessment included",
          "Event security planning",
          "Access control and VIP guest protection",
          "Arrival and departure logistics",
          "Team sized to the event",
        ],
      },
      idealFor: {
        pt: "Recepções privadas, eventos corporativos, lançamentos e experiências VIP.",
        en: "Private receptions, corporate events, launches and VIP experiences.",
      },
      image: "/images/event.jpg",
      sortOrder: 3,
    },
    {
      id: "patrimonio",
      name: { pt: "Segurança de patrimônio de alto valor", en: "High-value asset protection" },
      summary: {
        pt: "Proteção de residências, instalações e bens de alto valor.",
        en: "Protection for residences, facilities and high-value assets.",
      },
      description: {
        pt: "Proteção de residências, instalações e patrimônios de alto valor, como obras de arte, joias e acervos, inclusive durante o transporte. A operação começa pela análise de vulnerabilidades e segue com agentes dedicados, rotina de controle e plano de resposta definido.",
        en: "Protection for residences, facilities and high-value assets such as artwork, jewelry and collections, including while in transit. The operation starts with a vulnerability assessment and continues with dedicated agents, control routines and a defined response plan.",
      },
      includes: {
        pt: [
          "Advance e análise de risco inclusos",
          "Análise de vulnerabilidades do local",
          "Agentes armados ou desarmados",
          "Escolta veicular opcional no transporte de bens",
          "Plano de resposta e contingência",
        ],
        en: [
          "Advance work and risk assessment included",
          "Site vulnerability assessment",
          "Armed or unarmed agents",
          "Optional vehicle escort for asset transport",
          "Response and contingency plan",
        ],
      },
      idealFor: {
        pt: "Residências de alto padrão, galerias, joalherias, acervos e bens em trânsito.",
        en: "High-end residences, galleries, jewelers, collections and assets in transit.",
      },
      image: "/images/asset.jpg",
      sortOrder: 4,
    },
  ],

  // Todas as ilustrações em preto, como a frota real
  vehicleCategories: [
    {
      id: "sedan",
      name: { pt: "Sedan convencional", en: "Conventional sedan" },
      description: { pt: "Discreto, para agendas urbanas.", en: "Discreet, for city schedules." },
      capacity: 3,
      armored: false,
      image: "/images/fleet/sedan.webp",
      sortOrder: 1,
    },
    {
      id: "sedan-blindado",
      name: { pt: "Sedan blindado", en: "Armored sedan" },
      description: { pt: "Discrição com blindagem para a cidade.", en: "Armored discretion for city schedules." },
      capacity: 3,
      armored: true,
      image: "/images/fleet/sedan-blindado.webp",
      sortOrder: 2,
    },
    {
      id: "suv",
      name: { pt: "SUV de luxo", en: "Luxury SUV" },
      description: { pt: "Mais espaço, conforto e bagagem.", en: "More room, comfort and luggage space." },
      capacity: 4,
      armored: false,
      image: "/images/fleet/suv.webp",
      sortOrder: 3,
    },
    {
      id: "suv-blindado",
      name: { pt: "SUV blindado", en: "Armored SUV" },
      description: { pt: "Blindagem para deslocamentos sensíveis.", en: "Armored for sensitive journeys." },
      capacity: 4,
      armored: true,
      image: "/images/fleet/suv-blindado.webp",
      sortOrder: 4,
    },
    {
      id: "minivan",
      name: { pt: "Minivan", en: "Minivan" },
      description: { pt: "Pequenos grupos e famílias.", en: "Small groups and families." },
      capacity: 6,
      armored: false,
      image: "/images/fleet/van.webp",
      sortOrder: 5,
    },
    {
      id: "jet-van",
      name: { pt: "Jet Van", en: "Jet Van" },
      description: { pt: "Comitivas com conforto de primeira classe.", en: "Delegations with first-class comfort." },
      capacity: 10,
      armored: false,
      image: "/images/fleet/jet-van.webp",
      sortOrder: 6,
    },
  ],

  // Agentes e veículos entram pelo painel ("Publicar no site"). Vazio = página mostra só o fundador e as categorias.
  agents: [],
  vehicles: [],
};
