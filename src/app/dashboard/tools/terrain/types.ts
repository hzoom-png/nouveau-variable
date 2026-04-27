export type Priority = 'hot' | 'warm' | 'cold'

export interface TerrainProspect {
  id: string
  company: string
  contact: string
  role: string
  sector: string
  signal: string
  score: number
  priority: Priority
  action: string
}

export interface TerrainResponse {
  prospects: TerrainProspect[]
  summary: string
}
