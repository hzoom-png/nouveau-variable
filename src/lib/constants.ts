export const MEETING_TYPES = {
  dinner:    { label: 'Dîner business',     emoji: '🍷', points: 15, defaultTime: '20h00' },
  lunch:     { label: 'Déjeuner',           emoji: '☀️', points: 15, defaultTime: '12h30' },
  afterwork: { label: 'Afterwork',          emoji: '🥂', points: 10, defaultTime: '18h30' },
  coffee:    { label: 'Café stratégique',   emoji: '☕', points: 8,  defaultTime: '9h00'  },
  work:      { label: 'Session de travail', emoji: '🎯', points: 20, defaultTime: '10h00' },
  event:     { label: 'Événement NV',       emoji: '🌟', points: 30, defaultTime: '19h00' },
} as const

export const N2_TIERS = [
  { min: 0,  max: 9,   rate: 5.0,  label: 'Départ'    },
  { min: 10, max: 19,  rate: 5.5,  label: 'Palier 1'  },
  { min: 20, max: 29,  rate: 6.0,  label: 'Palier 2'  },
  { min: 30, max: 49,  rate: 7.0,  label: 'Palier 3'  },
  { min: 50, max: 999, rate: 10.0, label: 'Palier max' },
]

export function getN2Rate(n1Count: number): number {
  const tier = [...N2_TIERS].reverse().find(t => n1Count >= t.min)
  return tier ? tier.rate : 5.0
}

export const N1_RATE      = 0.40
export const SUBSCRIPTION = 97
export const MAX_MEMBERS  = 1000
export const MAX_CITIES   = 5
export const MAX_SECTORS  = 4

export const SECTORS = [
  'BtoB SaaS','Immobilier','Assurance','MLM / Réseau','Formation',
  'Événementiel','Recrutement','Conseil','E-commerce','Finance',
  'Tech / IT','Marketing','Retail','Santé','Juridique',
]

export const CITIES_FR = [
  'Lyon','Paris','Marseille','Bordeaux','Toulouse','Nice','Nantes',
  'Montpellier','Strasbourg','Lille','Rennes','Grenoble','Toulon',
  'Reims','Dijon','Angers','Nîmes','Aix-en-Provence','Brest','Tours',
  'Le Mans','Rouen','Caen','Nancy','Metz','Clermont-Ferrand',
]
