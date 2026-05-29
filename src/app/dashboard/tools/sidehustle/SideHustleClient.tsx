'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDashboard } from '@/lib/dashboard-context'
import { LockedSection } from '@/components/LockedSection'
import SideHustleHypothesesModal from './SideHustleHypothesesModal'
import { SlidersHorizontal, Map, LayoutGrid, TrendingUp, Calendar, CheckCircle2, Download, Share2, type LucideIcon } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────
type Stage = 'idea' | 'validation' | 'build' | 'launch' | 'growth'
type HelpTagType = 'client_pilote' | 'apporteur' | 'partenaire' | 'revendeur' | 'associe' | 'investisseur' | 'mentor' | 'autre'

interface HelpTag { type: HelpTagType; description?: string }
interface Task   { id: string; text: string; done: boolean }
interface Phase  { phase: string; duration: string; tasks: Task[] }
interface BmcKey { value_proposition:string;customer_segments:string;channels:string;customer_relationships:string;revenue_streams:string;key_resources:string;key_activities:string;key_partnerships:string;cost_structure:string }
interface Month  { month:string;revenue:number;costs:number;margin:number }
interface Forecast{ months:Month[];assumptions:string }

interface SHProject {
  id: string; user_id: string; project_id?: string
  created_at: string; updated_at: string
  name: string; description?: string; objective?: string
  target_date?: string; concept?: string; stage: Stage
  roadmap?: Phase[]; bmc?: BmcKey; forecast?: Forecast
  help_needed?: HelpTag[]
}

interface MemberProject { id: string; title: string; description?: string }

interface Props {
  userId: string
  initialProjects: SHProject[]
  memberProjects: MemberProject[]
}

const HELP_TAG_CONFIG: Record<HelpTagType, { label: string; emoji: string; hint: string }> = {
  client_pilote: { label: 'Clients pilotes',      emoji: '🎯', hint: 'Tester le produit, premiers retours…' },
  apporteur:     { label: 'Apporteur d\'affaires', emoji: '🔗', hint: 'Ouvrir des portes, commissionné…' },
  partenaire:    { label: 'Partenaire commercial', emoji: '🤝', hint: 'Co-vente, offre combinée, go-to-market…' },
  revendeur:     { label: 'Revendeur / Distributeur', emoji: '📦', hint: 'Revente, canal indirect, réseau…' },
  associe:       { label: 'Associé·e',             emoji: '🚀', hint: 'Co-fondateur, equity, long terme…' },
  investisseur:  { label: 'Investisseur',           emoji: '💰', hint: 'Business angel, levée de fonds…' },
  mentor:        { label: 'Mentor / Advisor',       emoji: '🧠', hint: 'Expérience sectorielle, conseil stratégique…' },
  autre:         { label: 'Autre',                  emoji: '✨', hint: 'Précise ci-dessous…' },
}

const SECTORS = [
  'SaaS B2B', 'Marketplace', 'Fintech', 'Healthtech', 'Edtech',
  'Retail / E-commerce', 'RH / Recrutement', 'PropTech', 'LegalTech',
  'Marketing / Growth', 'Data / IA', 'Cybersécurité', 'Logistique', 'Industrie',
  'Consulting / Services', 'Media / Contenu', 'Dev web / Agence', 'Autre',
]

const STAGE_LABELS: Record<Stage, string> = {
  idea:       'Idée',
  validation: 'Validation',
  build:      'Construction',
  launch:     'Lancement',
  growth:     'Croissance',
}
const STAGE_COLORS: Record<Stage, string> = {
  idea:       '#6B7280',
  validation: '#3B82F6',
  build:      '#F59E0B',
  launch:     '#10B981',
  growth:     '#8B5CF6',
}

const BMC_LABELS: Record<keyof BmcKey, string> = {
  value_proposition:    'Proposition de valeur',
  customer_segments:    'Segments clients',
  channels:             'Canaux',
  customer_relationships:'Relations clients',
  revenue_streams:      'Sources de revenus',
  key_resources:        'Ressources clés',
  key_activities:       'Activités clés',
  key_partnerships:     'Partenaires clés',
  cost_structure:       'Structure de coûts',
}

type View = 'list' | 'form' | 'project'

// ── Helpers ────────────────────────────────────────────────────────
function pct(proj: SHProject): number {
  if (!proj.roadmap) return 0
  const allTasks = proj.roadmap.flatMap(p => p.tasks)
  if (!allTasks.length) return 0
  return Math.round(allTasks.filter(t => t.done).length / allTasks.length * 100)
}

function uuid() { return crypto.randomUUID() }

// ── Main component ─────────────────────────────────────────────────
export default function SideHustleClient({ userId, initialProjects, memberProjects }: Props) {
  const { isInactive, userEmail } = useDashboard()
  const supabase = createClient()

  const [projects, setProjects]   = useState<SHProject[]>(initialProjects)
  const [view,     setView]       = useState<View>('list')
  const [active,   setActive]     = useState<SHProject | null>(null)
  const [drawer,   setDrawer]     = useState<'bmc'|'forecast'|'ai'|'roadmap'|null>(null)
  const [pushing,  setPushing]    = useState(false)
  const [pushModal, setPushModal] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genError,   setGenError]   = useState('')
  const [genStep,    setGenStep]    = useState('')

  // form state
  const [form, setForm] = useState<Partial<SHProject>>({ stage: 'idea' })
  const [editing, setEditing] = useState(false)

  // ── DB helpers ───────────────────────────────────────────────────
  async function saveBmc(projId: string, field: keyof BmcKey, value: string) {
    const proj = projects.find(p => p.id === projId)
    if (!proj?.bmc) return
    const bmc = { ...proj.bmc, [field]: value }
    setProjects(ps => ps.map(p => p.id === projId ? { ...p, bmc } : p))
    setActive(prev => prev?.id === projId ? { ...prev, bmc } : prev)
    await supabase.from('sidehustle_projects').update({ bmc, updated_at: new Date().toISOString() }).eq('id', projId)
  }

  async function saveForecastMonth(projId: string, monthIdx: number, field: 'revenue' | 'costs', value: number) {
    const proj = projects.find(p => p.id === projId)
    if (!proj?.forecast) return
    const months = proj.forecast.months.map((m, i) => {
      if (i !== monthIdx) return m
      const updated = { ...m, [field]: value }
      updated.margin = updated.revenue - updated.costs
      return updated
    })
    const forecast = { ...proj.forecast, months }
    setProjects(ps => ps.map(p => p.id === projId ? { ...p, forecast } : p))
    setActive(prev => prev?.id === projId ? { ...prev, forecast } : prev)
    await supabase.from('sidehustle_projects').update({ forecast, updated_at: new Date().toISOString() }).eq('id', projId)
  }

  async function saveForecastAssumptions(projId: string, value: string) {
    const proj = projects.find(p => p.id === projId)
    if (!proj?.forecast) return
    const forecast = { ...proj.forecast, assumptions: value }
    setProjects(ps => ps.map(p => p.id === projId ? { ...p, forecast } : p))
    setActive(prev => prev?.id === projId ? { ...prev, forecast } : prev)
    await supabase.from('sidehustle_projects').update({ forecast, updated_at: new Date().toISOString() }).eq('id', projId)
  }

  const refresh = useCallback(async () => {
    const { data } = await supabase.from('sidehustle_projects').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    if (data) setProjects(data as SHProject[])
  }, [supabase, userId])

  async function saveProject(data: Partial<SHProject>): Promise<SHProject | null> {
    if (data.id) {
      const { data: updated, error } = await supabase
        .from('sidehustle_projects')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', data.id)
        .select()
        .single()
      if (error) {
        console.error('[SideHustle] saveProject update échoué:', error)
        setGenError(
          error.code === '42P01'
            ? 'Configuration en cours. Réessaie dans quelques minutes.'
            : error.message ?? 'Impossible de sauvegarder le projet. Réessaie.'
        )
        return null
      }
      await refresh()
      return updated as SHProject
    } else {
      const { data: created, error } = await supabase
        .from('sidehustle_projects')
        .insert({ ...data, user_id: userId })
        .select()
        .single()
      if (error) {
        console.error('[SideHustle] saveProject insert échoué:', error)
        setGenError(
          error.code === '42P01'
            ? 'Configuration en cours. Réessaie dans quelques minutes.'
            : error.message ?? 'Impossible de sauvegarder le projet. Réessaie.'
        )
        return null
      }
      await refresh()
      return created as SHProject
    }
  }

  async function updateTaskDone(projId: string, phaseIdx: number, taskIdx: number, done: boolean) {
    const proj = projects.find(p => p.id === projId)
    if (!proj?.roadmap) return
    const roadmap = proj.roadmap.map((ph, pi) =>
      pi !== phaseIdx ? ph : { ...ph, tasks: ph.tasks.map((t, ti) => ti !== taskIdx ? t : { ...t, done }) }
    )
    await supabase.from('sidehustle_projects').update({ roadmap, updated_at: new Date().toISOString() }).eq('id', projId)
    setProjects(ps => ps.map(p => p.id === projId ? { ...p, roadmap } : p))
    if (active?.id === projId) setActive(prev => prev ? { ...prev, roadmap } : null)
  }

  async function updateTaskText(projId: string, phaseIdx: number, taskIdx: number, text: string) {
    const proj = projects.find(p => p.id === projId)
    if (!proj?.roadmap) return
    const roadmap = proj.roadmap.map((ph, pi) =>
      pi !== phaseIdx ? ph : { ...ph, tasks: ph.tasks.map((t, ti) => ti !== taskIdx ? t : { ...t, text }) }
    )
    await supabase.from('sidehustle_projects').update({ roadmap, updated_at: new Date().toISOString() }).eq('id', projId)
    setProjects(ps => ps.map(p => p.id === projId ? { ...p, roadmap } : p))
    if (active?.id === projId) setActive(prev => prev ? { ...prev, roadmap } : null)
  }

  async function addTask(projId: string, phaseIdx: number) {
    const proj = projects.find(p => p.id === projId)
    if (!proj?.roadmap) return
    const newTask: Task = { id: uuid(), text: 'Nouvelle tâche', done: false }
    const roadmap = proj.roadmap.map((ph, pi) =>
      pi !== phaseIdx ? ph : { ...ph, tasks: [...ph.tasks, newTask] }
    )
    await supabase.from('sidehustle_projects').update({ roadmap, updated_at: new Date().toISOString() }).eq('id', projId)
    setProjects(ps => ps.map(p => p.id === projId ? { ...p, roadmap } : p))
    if (active?.id === projId) setActive(prev => prev ? { ...prev, roadmap } : null)
  }

  async function addPhase(projId: string) {
    const proj = projects.find(p => p.id === projId)
    if (!proj) return
    const newPhase: Phase = {
      phase: `Phase ${(proj.roadmap?.length ?? 0) + 1}`,
      duration: '2 semaines',
      tasks: [{ id: uuid(), text: 'Première tâche', done: false }],
    }
    const roadmap = [...(proj.roadmap ?? []), newPhase]
    await supabase.from('sidehustle_projects').update({ roadmap, updated_at: new Date().toISOString() }).eq('id', projId)
    setProjects(ps => ps.map(p => p.id === projId ? { ...p, roadmap } : p))
    if (active?.id === projId) setActive(prev => prev ? { ...prev, roadmap } : null)
  }

  // ── Generation ───────────────────────────────────────────────────
  async function generate(proj: SHProject) {
    setGenerating(true)
    setGenError('')
    setGenStep('Analyse du concept…')

    let accumulated = ''

    try {
      const res = await fetch('/api/ai/sidehustle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId:   proj.id,
          name:        proj.name,
          description: proj.description,
          objective:   proj.objective,
          target_date: proj.target_date,
          concept:     proj.concept,
          stage:       proj.stage,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        setGenError(d.error || 'Erreur génération')
        setGenerating(false)
        return
      }

      const reader  = res.body!.getReader()
      const decoder = new TextDecoder()
      let sseBuffer = ''
      let finished  = false

      const steps = ['Analyse du concept…','Construction de la roadmap…','Business Model Canvas…','Prévisionnel 12 mois…','Finalisation…']
      let stepIdx = 0

      while (true) {
        if (finished) break
        const { done, value } = await reader.read()
        if (done) break
        sseBuffer += decoder.decode(value, { stream: true })
        const lines = sseBuffer.split('\n')
        sseBuffer   = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const d = JSON.parse(line.slice(6))
            if (d.token) {
              accumulated += d.token
              const newStep = Math.min(steps.length - 1, Math.floor(accumulated.length / 400))
              if (newStep > stepIdx) { stepIdx = newStep; setGenStep(steps[newStep]) }
            }
            if (d.error) { setGenError(d.error); setGenerating(false); finished = true; return }
            if (d.done) {
              finished = true
              try {
                const result = d.result ?? JSON.parse(accumulated.trim().replace(/^```json\s*/i,'').replace(/```\s*$/,''))
                const updated = { ...proj, roadmap: result.roadmap, bmc: result.bmc, forecast: result.forecast }
                setActive(updated)
                setProjects(ps => ps.map(p => p.id === proj.id ? updated : p))
                setView('project')
              } catch {
                setGenError('La génération a échoué. Réessaie.')
              } finally {
                setGenerating(false)
              }
              return
            }
          } catch {}
        }
      }
      if (!finished) {
        setGenError('Génération interrompue. Réessaie.')
        setGenerating(false)
      }
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Erreur réseau')
      setGenerating(false)
    }
  }

  async function pushToProjects(projId: string, sector: string, helpNeeded: HelpTag[]) {
    setPushing(true); setGenError(''); setPushModal(false)
    try {
      const res = await fetch(`/api/side-hustle/${projId}/push-to-projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sector, help_needed: helpNeeded }),
      })
      const data = await res.json()
      if (!res.ok) { setGenError(data.error || 'Erreur'); return }
      if (data.project_id) {
        setProjects(ps => ps.map(p => p.id === projId ? { ...p, project_id: data.project_id } : p))
        setActive(prev => prev?.id === projId ? { ...prev, project_id: data.project_id } : prev)
      }
    } catch {
      setGenError('Erreur réseau')
    } finally { setPushing(false) }
  }

  async function saveHelpNeeded(projId: string, helpNeeded: HelpTag[]) {
    setProjects(ps => ps.map(p => p.id === projId ? { ...p, help_needed: helpNeeded } : p))
    setActive(prev => prev?.id === projId ? { ...prev, help_needed: helpNeeded } : prev)
    await supabase.from('sidehustle_projects').update({ help_needed: helpNeeded, updated_at: new Date().toISOString() }).eq('id', projId)
  }

  async function unlinkFromProject(projId: string) {
    const res = await fetch(`/api/side-hustle/${projId}/unlink`, { method: 'POST' })
    if (res.ok) {
      setProjects(ps => ps.map(p => p.id === projId ? { ...p, project_id: undefined } : p))
      setActive(prev => prev?.id === projId ? { ...prev, project_id: undefined } : prev)
    }
  }

  async function handleFormSubmit() {
    const saved = await saveProject({ ...form, id: editing && active ? active.id : undefined })
    if (!saved) {
      setView('form')
      return
    }
    setActive(saved)
    await generate(saved)
  }

  function importFromMemberProject(mp: MemberProject) {
    setForm({ name: mp.title, description: mp.description ?? '', project_id: mp.id, stage: 'idea' })
    setView('form')
    setEditing(false)
  }

  if (isInactive) return <LockedSection feature="Side Hustle est réservé aux membres actifs" email={userEmail} />

  // ── Loading overlay ───────────────────────────────────────────────
  if (generating) {
    return (
      <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'400px',gap:20 }}>
        <div style={{ width:48,height:48,borderRadius:'50%',border:'3px solid var(--green-3)',borderTopColor:'var(--green)',animation:'spin 0.8s linear infinite' }} />
        <p style={{ color:'var(--text-2)',fontSize:14 }}>{genStep}</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        {genError && (
          <div style={{ color:'var(--red)',fontSize:13 }}>{genError}</div>
        )}
      </div>
    )
  }

  // ── VIEW: LIST ────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div>
        <div className="tool-header">
          <div className="tool-badge">Side Hustle</div>
          <h1 className="tool-h1">Pilote ton projet perso.</h1>
          <p className="tool-desc">Roadmap, Business Model Canvas, prévisionnel — tout en un.</p>
          <div className="tool-actions">
            <button className="tbtn-primary" onClick={() => { setForm({ stage: 'idea' }); setEditing(false); setView('form') }}>
              Nouveau projet +
            </button>
          </div>
        </div>

        {genError && (
          <div style={{ background:'var(--red-2)',border:'1px solid #FADBD8',borderRadius:'var(--r-md)',padding:'12px 16px',marginBottom:16,fontSize:13,color:'var(--red)' }}>
            {genError}
            <button onClick={() => setGenError('')} style={{ marginLeft:12,fontSize:12,color:'var(--red)',textDecoration:'underline',cursor:'pointer',background:'none',border:'none' }}>Fermer</button>
          </div>
        )}

        {memberProjects.length > 0 && (
          <div style={{ background:'var(--green-3)',border:'1px solid var(--green-4)',borderRadius:'var(--r-md)',padding:'14px 18px',marginBottom:20 }}>
            <p style={{ fontSize:13,fontWeight:600,color:'var(--green)',marginBottom:10 }}>Importer depuis tes Projets du club :</p>
            <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
              {memberProjects.map(mp => (
                <button key={mp.id} onClick={() => importFromMemberProject(mp)}
                  style={{ fontSize:12,padding:'6px 14px',borderRadius:'var(--r-full)',border:'1px solid var(--green)',
                    background:'var(--white)',color:'var(--green)',cursor:'pointer',fontWeight:600 }}>
                  {mp.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {projects.length === 0 ? (
          <div style={{ background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:'56px',textAlign:'center' }}>
            <div style={{ width:48,height:48,borderRadius:'var(--r-md)',background:'var(--green-3)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px' }}>
              <Map size={22} color="var(--green)" />
            </div>
            <p style={{ fontWeight:600,color:'var(--text)',marginBottom:6 }}>Aucun projet Side Hustle</p>
            <p style={{ fontSize:13,color:'var(--text-3)',marginBottom:20 }}>Crée ton premier projet et obtiens une roadmap complète en quelques secondes.</p>
            <button className="tbtn-primary" onClick={() => { setForm({ stage: 'idea' }); setEditing(false); setView('form') }}>
              Commencer →
            </button>
          </div>
        ) : (
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14 }}>
            {projects.map(proj => {
              const p = pct(proj)
              return (
                <div key={proj.id} onClick={() => { setActive(proj); setView('project') }}
                  style={{ background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',
                    padding:'20px',cursor:'pointer',transition:'box-shadow .15s,transform .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.06)'; e.currentTarget.style.transform='translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='none' }}
                >
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8 }}>
                    <h3 style={{ fontFamily:'var(--font-inter)',fontWeight:700,fontSize:15,color:'var(--text)',flex:1,marginRight:8 }}>{proj.name}</h3>
                    <span style={{ fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:'var(--r-full)',
                      background:`${STAGE_COLORS[proj.stage]}18`,color:STAGE_COLORS[proj.stage],whiteSpace:'nowrap' }}>
                      {STAGE_LABELS[proj.stage]}
                    </span>
                  </div>
                  {proj.objective && (
                    <p style={{ fontSize:12,color:'var(--text-3)',marginBottom:12,lineHeight:1.5,
                      overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' }}>
                      {proj.objective}
                    </p>
                  )}
                  {proj.roadmap && (
                    <div>
                      <div style={{ display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--text-3)',marginBottom:4 }}>
                        <span>Progression</span><span>{p}%</span>
                      </div>
                      <div style={{ height:4,background:'var(--surface)',borderRadius:99,overflow:'hidden' }}>
                        <div style={{ height:'100%',width:`${p}%`,background:'var(--green)',borderRadius:99,transition:'width .4s' }}/>
                      </div>
                    </div>
                  )}
                  {!proj.roadmap && (
                    <p style={{ fontSize:12,color:'var(--text-3)',fontStyle:'italic' }}>Roadmap non générée</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── VIEW: FORM ────────────────────────────────────────────────────
  if (view === 'form') {
    const fieldStyle: React.CSSProperties = {
      width:'100%',padding:'10px 13px',border:'1.5px solid var(--border)',
      borderRadius:'var(--r-sm)',fontSize:14,color:'var(--text)',
      background:'var(--white)',outline:'none',fontFamily:'inherit',
    }
    const labelStyle: React.CSSProperties = {
      fontSize:11,fontWeight:600,color:'var(--text-2)',textTransform:'uppercase',
      letterSpacing:'.07em',display:'block',marginBottom:6,
    }
    return (
      <div>
        <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:24 }}>
          <button onClick={() => setView('list')} style={{ fontSize:13,color:'var(--text-3)',background:'none',border:'none',cursor:'pointer' }}>← Retour</button>
          <h1 style={{ fontFamily:'var(--font-inter)',fontWeight:800,fontSize:22,color:'var(--text)' }}>
            {editing ? 'Modifier le projet' : 'Nouveau projet Side Hustle'}
          </h1>
        </div>

        <div style={{ maxWidth:640,display:'flex',flexDirection:'column',gap:18 }}>
          <div>
            <label style={labelStyle}>Nom du projet *</label>
            <input value={form.name ?? ''} onChange={e => setForm(f => ({...f,name:e.target.value}))}
              placeholder="Mon SaaS, Mon podcast, Mon agence…" style={fieldStyle}/>
          </div>
          <div>
            <label style={labelStyle}>Description courte</label>
            <textarea value={form.description ?? ''} onChange={e => setForm(f => ({...f,description:e.target.value}))}
              placeholder="En une phrase, de quoi s'agit-il ?" rows={2} maxLength={300}
              style={{...fieldStyle,resize:'vertical'}}/>
          </div>
          <div>
            <label style={labelStyle}>Objectif principal</label>
            <input value={form.objective ?? ''} onChange={e => setForm(f => ({...f,objective:e.target.value}))}
              placeholder="Ex: Atteindre 10 000€ MRR" style={fieldStyle}/>
          </div>
          <div style={{ display:'flex',gap:14 }}>
            <div style={{ flex:1 }}>
              <label style={labelStyle}>Date cible</label>
              <input type="date" value={form.target_date ?? ''} onChange={e => setForm(f => ({...f,target_date:e.target.value}))} style={fieldStyle}/>
            </div>
            <div style={{ flex:1 }}>
              <label style={labelStyle}>Stade actuel</label>
              <select value={form.stage ?? 'idea'} onChange={e => setForm(f => ({...f,stage:e.target.value as Stage}))} style={fieldStyle}>
                {(Object.entries(STAGE_LABELS) as [Stage,string][]).map(([k,v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Concept détaillé <span style={{ color:'var(--text-3)',fontWeight:400,textTransform:'none' }}>— plus c&apos;est précis, meilleure est la roadmap</span></label>
            <textarea value={form.concept ?? ''} onChange={e => setForm(f => ({...f,concept:e.target.value}))}
              placeholder="Décris ton idée en détail : le problème résolu, ta cible, ton modèle économique envisagé, tes forces pour exécuter…"
              rows={6} maxLength={2000} style={{...fieldStyle,resize:'vertical'}}/>
          </div>

          {genError && (
            <div style={{ background:'var(--red-2)',borderRadius:'var(--r-sm)',padding:'10px 14px',fontSize:13,color:'var(--red)' }}>{genError}</div>
          )}

          <div style={{ display:'flex',gap:10 }}>
            <button onClick={() => setView('list')} style={{ padding:'11px 20px',borderRadius:'var(--r-full)',border:'1.5px solid var(--border)',background:'var(--white)',fontSize:13,fontWeight:600,color:'var(--text-2)',cursor:'pointer' }}>
              Annuler
            </button>
            <button onClick={handleFormSubmit} disabled={!form.name?.trim()}
              style={{ flex:1,padding:'12px',borderRadius:'var(--r-full)',background:'var(--green)',color:'#fff',
                fontFamily:'var(--font-inter)',fontWeight:700,fontSize:14,border:'none',
                cursor:form.name?.trim()?'pointer':'not-allowed',opacity:form.name?.trim()?1:.5 }}>
              Générer ma roadmap →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── VIEW: PROJECT ─────────────────────────────────────────────────
  if (view === 'project' && active) {
    const proj = projects.find(p => p.id === active.id) ?? active
    const progress = pct(proj)
    const allTasks = proj.roadmap?.flatMap(p => p.tasks) ?? []
    const doneTasks = allTasks.filter(t => t.done).length

    // Basic forecast summary from generated forecast (12-month simple)
    const forecastMonths = proj.forecast?.months ?? []
    const totalRevenue = forecastMonths.reduce((s, m) => s + (m.revenue ?? 0), 0)
    const breakevenMonth = forecastMonths.findIndex(m => m.margin >= 0)

    return (
      <div>
        {/* Header */}
        <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:32,flexWrap:'wrap' }}>
          <button onClick={() => setView('list')} style={{ fontSize:13,color:'var(--text-3)',background:'none',border:'none',cursor:'pointer' }}>← Mes projets</button>
          <h1 style={{ fontFamily:'Inter, sans-serif',fontWeight:800,fontSize:22,color:'var(--text)',flex:1 }}>{proj.name}</h1>
          <button onClick={() => { setForm({ ...proj }); setEditing(true); setView('form') }}
            style={{ fontSize:12,padding:'7px 16px',borderRadius:'var(--r-full)',border:'1.5px solid var(--border)',background:'var(--white)',color:'var(--text-2)',cursor:'pointer',fontWeight:600 }}>
            Modifier
          </button>
          <button onClick={() => window.open(`/api/side-hustle/${proj.id}/export`, '_blank')}
            style={{ fontSize:12,padding:'7px 14px',borderRadius:'var(--r-full)',border:'1.5px solid var(--border)',background:'var(--white)',color:'var(--text-2)',cursor:'pointer',fontWeight:600,display:'flex',alignItems:'center',gap:6 }}>
            <Download size={13} /> Exporter
          </button>
        </div>

        {genError && (
          <div style={{ background:'var(--red-2)',border:'1px solid #FADBD8',borderRadius:'var(--r-md)',padding:'12px 16px',marginBottom:20,fontSize:13,color:'var(--red)' }}>
            {genError}
            <button onClick={() => setGenError('')} style={{ marginLeft:12,fontSize:12,color:'var(--red)',textDecoration:'underline',cursor:'pointer',background:'none',border:'none' }}>Fermer</button>
          </div>
        )}

        {/* ── 3 cartes ── */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:16,marginBottom:20 }}>

          <SHCard
            title="Roadmap"
            description={proj.roadmap ? `${proj.roadmap.length} phase${proj.roadmap.length > 1 ? 's' : ''} · ${allTasks.length} tâches` : 'Roadmap non générée'}
            icon={Map}
            onClick={() => setDrawer('roadmap')}
            badge={proj.roadmap ? `${progress}%` : undefined}
          />

          <SHCard
            title="Hypothèses & Prévisionnel"
            description="Ajuste tes hypothèses avec des sliders — prévisionnel mis à jour en temps réel"
            icon={SlidersHorizontal}
            onClick={() => setDrawer('ai')}
          />

          <SHCard
            title="Business Model Canvas"
            description={proj.bmc ? '9 cases — canvas rempli' : '9 cases pour structurer ton modèle'}
            icon={LayoutGrid}
            onClick={() => setDrawer('bmc')}
            badge={proj.bmc ? 'Rempli' : undefined}
          />
        </div>

        {/* ── Synthèse & Avancement ── */}
        <div style={{ background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:'24px 28px' }}>
          <h2 style={{ fontFamily:'Inter, sans-serif',fontWeight:700,fontSize:16,color:'var(--text)',marginBottom:20 }}>
            Synthèse & Avancement
          </h2>

          {/* Key stats */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:12,marginBottom:20 }}>
            <div style={{ background:'var(--surface)',borderRadius:'var(--r-md)',padding:'14px 16px' }}>
              <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:6 }}>
                <TrendingUp size={13} color="var(--text-3)" />
                <span style={{ fontSize:11,color:'var(--text-3)',fontWeight:500 }}>Stade</span>
              </div>
              <span style={{ fontSize:13,fontWeight:700,padding:'2px 8px',borderRadius:'var(--r-full)',
                background:`${STAGE_COLORS[proj.stage]}18`,color:STAGE_COLORS[proj.stage] }}>
                {STAGE_LABELS[proj.stage]}
              </span>
            </div>

            {proj.target_date && (
              <div style={{ background:'var(--surface)',borderRadius:'var(--r-md)',padding:'14px 16px' }}>
                <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:6 }}>
                  <Calendar size={13} color="var(--text-3)" />
                  <span style={{ fontSize:11,color:'var(--text-3)',fontWeight:500 }}>Date cible</span>
                </div>
                <div style={{ fontSize:13,fontWeight:600,color:'var(--text)' }}>
                  {new Date(proj.target_date).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}
                </div>
              </div>
            )}

            {totalRevenue > 0 && (
              <div style={{ background:'var(--surface)',borderRadius:'var(--r-md)',padding:'14px 16px' }}>
                <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:6 }}>
                  <TrendingUp size={13} color="var(--text-3)" />
                  <span style={{ fontSize:11,color:'var(--text-3)',fontWeight:500 }}>CA prévisionnel</span>
                </div>
                <div style={{ fontSize:13,fontWeight:700,color:'var(--green)' }}>
                  {totalRevenue >= 1000 ? `${(totalRevenue/1000).toFixed(0)} k€` : `${totalRevenue} €`}
                </div>
              </div>
            )}

            {breakevenMonth >= 0 && (
              <div style={{ background:'var(--surface)',borderRadius:'var(--r-md)',padding:'14px 16px' }}>
                <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:6 }}>
                  <CheckCircle2 size={13} color="var(--text-3)" />
                  <span style={{ fontSize:11,color:'var(--text-3)',fontWeight:500 }}>Breakeven</span>
                </div>
                <div style={{ fontSize:13,fontWeight:700,color:'var(--text)' }}>Mois {breakevenMonth + 1}</div>
              </div>
            )}
          </div>

          {/* Roadmap progress */}
          {proj.roadmap && (
            <div style={{ marginBottom:20 }}>
              <div style={{ display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--text-2)',marginBottom:8 }}>
                <span style={{ fontWeight:500 }}>Roadmap complétée</span>
                <span style={{ fontWeight:700,color:'var(--green)' }}>{progress}% · {doneTasks}/{allTasks.length} tâches</span>
              </div>
              <div style={{ height:6,background:'var(--surface)',borderRadius:99,overflow:'hidden' }}>
                <div style={{ height:'100%',width:`${progress}%`,background:'var(--green)',borderRadius:99,transition:'width .4s' }}/>
              </div>
            </div>
          )}

          {proj.objective && (
            <div style={{ marginBottom:20,padding:'12px 16px',background:'var(--surface)',borderRadius:'var(--r-md)' }}>
              <div style={{ fontSize:10,fontWeight:600,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:4 }}>Objectif</div>
              <div style={{ fontSize:13,color:'var(--text)',lineHeight:1.5 }}>{proj.objective}</div>
            </div>
          )}

          {/* Help Wanted */}
          <HelpWantedSection
            tags={proj.help_needed ?? []}
            onChange={tags => saveHelpNeeded(proj.id, tags)}
          />

          {/* CTAs */}
          <div style={{ display:'flex',gap:10,flexWrap:'wrap',marginTop:20 }}>
            {!proj.project_id ? (
              <button onClick={() => setPushModal(true)} disabled={pushing}
                style={{ padding:'10px 20px',borderRadius:'var(--r-sm)',background:'var(--green)',color:'#fff',border:'none',
                  fontFamily:'Inter, sans-serif',fontWeight:600,fontSize:13,cursor:pushing?'not-allowed':'pointer',
                  opacity:pushing?.7:1,display:'flex',alignItems:'center',gap:8 }}>
                <Share2 size={14} /> {pushing ? 'Création…' : 'Push to Projets'}
              </button>
            ) : (
              <div style={{ display:'flex',alignItems:'center',gap:8,padding:'10px 16px',borderRadius:'var(--r-sm)',
                background:'var(--green-3)',border:'1px solid var(--green)',fontSize:12,fontWeight:700,color:'var(--green)' }}>
                <CheckCircle2 size={14} /> Projet lié
                <button onClick={() => unlinkFromProject(proj.id)}
                  style={{ marginLeft:4,fontSize:11,color:'var(--text-3)',background:'none',border:'none',cursor:'pointer',textDecoration:'underline' }}>
                  Délier
                </button>
              </div>
            )}
            <button onClick={() => window.open(`/api/side-hustle/${proj.id}/export`, '_blank')}
              style={{ padding:'10px 20px',borderRadius:'var(--r-sm)',background:'var(--white)',color:'var(--text-2)',
                border:'1.5px solid var(--border)',fontFamily:'Inter, sans-serif',fontWeight:600,fontSize:13,cursor:'pointer',
                display:'flex',alignItems:'center',gap:8 }}>
              <Download size={14} /> Export PDF
            </button>
            {!proj.roadmap && (
              <button onClick={() => generate(proj)}
                style={{ padding:'10px 20px',borderRadius:'var(--r-sm)',background:'var(--green-3)',color:'var(--green)',
                  border:'1.5px solid var(--green)',fontFamily:'Inter, sans-serif',fontWeight:700,fontSize:13,cursor:'pointer' }}>
                Générer la roadmap →
              </button>
            )}
          </div>
        </div>

        {/* ── Modals ── */}

        {/* Roadmap modal */}
        {drawer === 'roadmap' && (
          <Modal title="Roadmap" onClose={() => setDrawer(null)} wide>
            {!proj.roadmap ? (
              <div style={{ textAlign:'center',padding:'40px 0' }}>
                <p style={{ color:'var(--text-3)',fontSize:14,marginBottom:20 }}>Aucune roadmap générée pour l&rsquo;instant.</p>
                <button onClick={() => { setDrawer(null); generate(proj) }}
                  style={{ padding:'11px 24px',borderRadius:'var(--r-full)',background:'var(--green)',color:'#fff',
                    border:'none',fontFamily:'Inter, sans-serif',fontWeight:700,fontSize:14,cursor:'pointer' }}>
                  Générer la roadmap →
                </button>
              </div>
            ) : (
              <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
                {proj.roadmap.map((phase, pi) => (
                  <div key={pi} style={{ background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden' }}>
                    <div style={{ padding:'13px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10 }}>
                      <span style={{ fontFamily:'Inter, sans-serif',fontWeight:700,fontSize:14,color:'var(--text)',flex:1 }}>{phase.phase}</span>
                      <span style={{ fontSize:11,color:'var(--text-3)',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-full)',padding:'2px 10px' }}>{phase.duration}</span>
                    </div>
                    <div style={{ padding:'8px 0' }}>
                      {phase.tasks.map((task, ti) => (
                        <TaskRow key={task.id} task={task}
                          onDone={done => updateTaskDone(proj.id, pi, ti, done)}
                          onText={text => updateTaskText(proj.id, pi, ti, text)}
                        />
                      ))}
                      <button onClick={() => addTask(proj.id, pi)}
                        style={{ display:'block',width:'100%',textAlign:'left',padding:'8px 16px',
                          fontSize:12,color:'var(--text-3)',background:'none',border:'none',
                          cursor:'pointer',borderTop:'1px solid var(--border)' }}
                        onMouseEnter={e=>(e.currentTarget.style.color='var(--green)')}
                        onMouseLeave={e=>(e.currentTarget.style.color='var(--text-3)')}>
                        + Ajouter une tâche
                      </button>
                    </div>
                  </div>
                ))}
                <button onClick={() => addPhase(proj.id)}
                  style={{ padding:'11px',border:'1.5px dashed var(--border)',borderRadius:'var(--r-md)',
                    background:'none',fontSize:13,color:'var(--text-3)',cursor:'pointer',transition:'.15s' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--green)';e.currentTarget.style.color='var(--green)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-3)'}}>
                  + Ajouter une phase
                </button>
              </div>
            )}
          </Modal>
        )}

        {/* BMC modal */}
        {drawer === 'bmc' && (
          <Modal title="Business Model Canvas" onClose={() => setDrawer(null)} wide>
            {!proj.bmc ? (
              <div style={{ textAlign:'center',padding:'40px 0' }}>
                <p style={{ color:'var(--text-3)',fontSize:14,marginBottom:20 }}>BMC non encore généré — génère la roadmap complète d&rsquo;abord.</p>
              </div>
            ) : (
              <>
                <p style={{ fontSize:12,color:'var(--text-3)',marginBottom:16 }}>Clique sur un champ pour le modifier — sauvegarde automatique.</p>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                  {(Object.entries(BMC_LABELS) as [keyof BmcKey, string][]).map(([key, label]) => (
                    <BmcField key={key} label={label} value={proj.bmc![key]} onSave={v => saveBmc(proj.id, key, v)} />
                  ))}
                </div>
              </>
            )}
          </Modal>
        )}

        {/* Hypothèses & Prévisionnel */}
        {drawer === 'ai' && (
          <SideHustleHypothesesModal onClose={() => setDrawer(null)} />
        )}

        {/* Push confirm modal */}
        {pushModal && (
          <PushConfirmModal
            proj={proj}
            pushing={pushing}
            onClose={() => setPushModal(false)}
            onConfirm={(sector, helpNeeded) => pushToProjects(proj.id, sector, helpNeeded)}
          />
        )}

        {/* Prévisionnel simple (accessible via forecast) */}
        {drawer === 'forecast' && proj.forecast && (
          <Modal title="Prévisionnel 12 mois" onClose={() => setDrawer(null)} wide>
            <p style={{ fontSize:12,color:'var(--text-3)',marginBottom:16 }}>Modifie le CA et les charges — la marge se recalcule automatiquement.</p>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
                <thead>
                  <tr style={{ background:'var(--surface)' }}>
                    {['Mois','CA (€)','Charges (€)','Marge'].map(h => (
                      <th key={h} style={{ padding:'8px 12px',textAlign:'left',fontWeight:600,color:'var(--text-2)',borderBottom:'1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {proj.forecast.months.map((m, i) => (
                    <ForecastRow key={i} month={m} onSave={(field, val) => saveForecastMonth(proj.id, i, field, val)} />
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop:16 }}>
              <div style={{ fontSize:11,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:6 }}>Hypothèses</div>
              <AssumptionsField value={proj.forecast.assumptions ?? ''} onSave={v => saveForecastAssumptions(proj.id, v)} />
            </div>
          </Modal>
        )}
      </div>
    )
  }

  return null
}

// ── Sub-components ─────────────────────────────────────────────────
function TaskRow({ task, onDone, onText }: { task: Task; onDone: (d:boolean)=>void; onText: (t:string)=>void }) {
  const [editing, setEditing] = useState(false)
  const [val,     setVal]     = useState(task.text)

  return (
    <div style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 16px',
      borderBottom:'1px solid var(--border)',transition:'background .1s' }}
      onMouseEnter={e=>(e.currentTarget.style.background='var(--surface)')}
      onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
      <input type="checkbox" checked={task.done} onChange={e=>onDone(e.target.checked)}
        style={{ width:15,height:15,accentColor:'var(--green)',flexShrink:0,cursor:'pointer' }}/>
      {editing ? (
        <input autoFocus value={val}
          onChange={e=>setVal(e.target.value)}
          onBlur={() => { setEditing(false); onText(val) }}
          onKeyDown={e => { if (e.key==='Enter') { setEditing(false); onText(val) } }}
          style={{ flex:1,fontSize:13,padding:'2px 6px',border:'1.5px solid var(--green)',borderRadius:4,outline:'none',fontFamily:'inherit',color:'var(--text)' }}/>
      ) : (
        <span onClick={() => setEditing(true)} style={{ flex:1,fontSize:13,
          color:task.done?'var(--text-3)':'var(--text)',
          textDecoration:task.done?'line-through':'none',cursor:'text',lineHeight:1.5 }}>
          {task.text}
        </span>
      )}
    </div>
  )
}

function BmcField({ label, value, onSave }: { label: string; value: string; onSave: (v: string) => void }) {
  const [val, setVal] = useState(value)
  const [focused, setFocused] = useState(false)
  useEffect(() => { setVal(value) }, [value])
  return (
    <div style={{ background:'var(--surface)',borderRadius:'var(--r-sm)',padding:'14px',
      border:`1.5px solid ${focused ? 'var(--green)' : 'transparent'}`,transition:'border-color .15s' }}>
      <div style={{ fontSize:10,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:6 }}>{label}</div>
      <textarea value={val} rows={4}
        onChange={e => setVal(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); onSave(val) }}
        style={{ width:'100%',fontSize:13,color:'var(--text)',lineHeight:1.65,background:'transparent',
          border:'none',outline:'none',resize:'vertical',fontFamily:'inherit',padding:0 }}
      />
    </div>
  )
}

function ForecastRow({ month, onSave }: { month: Month; onSave: (field: 'revenue' | 'costs', val: number) => void }) {
  const [revenue, setRevenue] = useState(String(month.revenue))
  const [costs,   setCosts]   = useState(String(month.costs))
  useEffect(() => { setRevenue(String(month.revenue)); setCosts(String(month.costs)) }, [month.revenue, month.costs])
  const margin = (Number(revenue) || 0) - (Number(costs) || 0)
  const numStyle: React.CSSProperties = {
    width:'100%',fontSize:13,background:'transparent',border:'none',outline:'none',
    fontFamily:'inherit',padding:'0 2px',textAlign:'left' as const,
  }
  return (
    <tr style={{ borderBottom:'1px solid var(--border)' }}>
      <td style={{ padding:'6px 12px',fontFamily:'var(--font-inter)',fontWeight:600 }}>{month.month}</td>
      <td style={{ padding:'4px 8px' }}>
        <input type="number" value={revenue}
          onChange={e => setRevenue(e.target.value)}
          onBlur={() => onSave('revenue', Number(revenue) || 0)}
          style={{ ...numStyle, color:'var(--green)' }}/>
      </td>
      <td style={{ padding:'4px 8px' }}>
        <input type="number" value={costs}
          onChange={e => setCosts(e.target.value)}
          onBlur={() => onSave('costs', Number(costs) || 0)}
          style={{ ...numStyle, color:'var(--red)' }}/>
      </td>
      <td style={{ padding:'6px 12px',fontWeight:600,color:margin>=0?'var(--green)':'var(--red)' }}>
        {margin>=0?'+':''}{margin.toLocaleString('fr-FR')} €
      </td>
    </tr>
  )
}

function AssumptionsField({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [val, setVal] = useState(value)
  const [focused, setFocused] = useState(false)
  useEffect(() => { setVal(value) }, [value])
  return (
    <textarea value={val} rows={4}
      onChange={e => setVal(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => { setFocused(false); onSave(val) }}
      style={{ width:'100%',fontSize:13,color:'var(--text-2)',lineHeight:1.7,
        background:'var(--surface)',borderRadius:'var(--r-sm)',
        border:`1.5px solid ${focused ? 'var(--green)' : 'var(--border)'}`,
        outline:'none',resize:'vertical',fontFamily:'inherit',padding:'12px 14px',
        transition:'border-color .15s' }}
    />
  )
}

function Modal({ title, onClose, children, wide }: { title:string; onClose:()=>void; children:React.ReactNode; wide?:boolean }) {
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(1,39,34,.5)',zIndex:200 }}/>
      <div style={{
        position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
        width: wide ? 'min(720px, 94vw)' : 'min(520px, 94vw)',
        maxHeight:'86vh',background:'var(--white)',borderRadius:'var(--r-lg)',
        boxShadow:'0 20px 60px rgba(0,0,0,.14)',zIndex:201,
        display:'flex',flexDirection:'column',overflow:'hidden',
      }}>
        <div style={{ padding:'20px 24px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
          <h2 style={{ fontFamily:'Inter, sans-serif',fontWeight:700,fontSize:17,color:'var(--text)' }}>{title}</h2>
          <button onClick={onClose} style={{ width:30,height:30,borderRadius:'var(--r-sm)',background:'var(--surface)',border:'1px solid var(--border)',cursor:'pointer',fontSize:18,color:'var(--text-2)',lineHeight:1 }}>×</button>
        </div>
        <div style={{ flex:1,overflowY:'auto',padding:'20px 24px' }}>{children}</div>
      </div>
    </>
  )
}

function HelpWantedSection({ tags, onChange }: { tags: HelpTag[]; onChange: (tags: HelpTag[]) => void }) {
  const [expandedType, setExpandedType] = useState<HelpTagType | null>(null)

  function toggle(type: HelpTagType) {
    const exists = tags.find(t => t.type === type)
    if (exists) {
      setExpandedType(null)
      onChange(tags.filter(t => t.type !== type))
    } else {
      setExpandedType(type)
      onChange([...tags, { type }])
    }
  }

  function setDesc(type: HelpTagType, description: string) {
    onChange(tags.map(t => t.type === type ? { ...t, description: description.slice(0, 100) } : t))
  }

  return (
    <div style={{ marginTop:20, marginBottom:4 }}>
      <div style={{ fontSize:11,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:10 }}>
        Cherche de l&apos;aide pour…
      </div>
      <div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>
        {(Object.keys(HELP_TAG_CONFIG) as HelpTagType[]).map(type => {
          const cfg = HELP_TAG_CONFIG[type]
          const active = tags.some(t => t.type === type)
          return (
            <div key={type}>
              <button
                onClick={() => toggle(type)}
                title={cfg.hint}
                style={{
                  padding:'6px 14px',borderRadius:'var(--r-full)',border:'1.5px solid',
                  borderColor: active ? 'var(--green)' : 'var(--border)',
                  background: active ? 'var(--green-3)' : 'var(--white)',
                  color: active ? 'var(--green)' : 'var(--text-2)',
                  fontSize:12,fontWeight:active?700:500,cursor:'pointer',
                  transition:'all .15s',display:'flex',alignItems:'center',gap:5,
                }}
              >
                <span>{cfg.emoji}</span> {cfg.label}
              </button>
              {active && expandedType === type && (
                <input
                  autoFocus
                  placeholder={cfg.hint}
                  value={tags.find(t => t.type === type)?.description ?? ''}
                  onChange={e => setDesc(type, e.target.value)}
                  onBlur={() => setExpandedType(null)}
                  maxLength={100}
                  style={{
                    marginTop:6,width:'100%',padding:'6px 10px',fontSize:12,
                    border:'1.5px solid var(--green)',borderRadius:'var(--r-sm)',
                    outline:'none',fontFamily:'inherit',color:'var(--text)',
                    background:'var(--white)',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
      {tags.length > 0 && (
        <p style={{ fontSize:11,color:'var(--text-3)',marginTop:8 }}>
          {tags.length} profil{tags.length > 1 ? 's' : ''} recherché{tags.length > 1 ? 's' : ''} · Clique sur un tag pour ajouter une précision
        </p>
      )}
    </div>
  )
}

function PushConfirmModal({
  proj, pushing, onClose, onConfirm,
}: {
  proj: SHProject
  pushing: boolean
  onClose: () => void
  onConfirm: (sector: string, helpNeeded: HelpTag[]) => void
}) {
  const [sector, setSector] = useState('Autre')
  const [tags, setTags] = useState<HelpTag[]>(proj.help_needed ?? [])

  const fieldStyle: React.CSSProperties = {
    width:'100%',padding:'10px 13px',border:'1.5px solid var(--border)',
    borderRadius:'var(--r-sm)',fontSize:13,color:'var(--text)',
    background:'var(--white)',outline:'none',fontFamily:'inherit',
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(1,39,34,.5)',zIndex:200 }}/>
      <div style={{
        position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
        width:'min(540px,94vw)',maxHeight:'90vh',background:'var(--white)',
        borderRadius:'var(--r-lg)',boxShadow:'0 20px 60px rgba(0,0,0,.14)',
        zIndex:201,display:'flex',flexDirection:'column',overflow:'hidden',
      }}>
        <div style={{ padding:'20px 24px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
          <div>
            <h2 style={{ fontFamily:'Inter,sans-serif',fontWeight:700,fontSize:17,color:'var(--text)',margin:0 }}>Publier dans les Projets</h2>
            <p style={{ fontSize:12,color:'var(--text-3)',margin:'4px 0 0' }}>Ce projet sera visible par tous les membres du club.</p>
          </div>
          <button onClick={onClose} style={{ width:30,height:30,borderRadius:'var(--r-sm)',background:'var(--surface)',border:'1px solid var(--border)',cursor:'pointer',fontSize:18,color:'var(--text-2)',lineHeight:1 }}>×</button>
        </div>
        <div style={{ flex:1,overflowY:'auto',padding:'20px 24px',display:'flex',flexDirection:'column',gap:20 }}>

          {/* Preview */}
          <div style={{ background:'var(--surface)',borderRadius:'var(--r-md)',padding:'14px 16px' }}>
            <div style={{ fontSize:10,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:4 }}>Projet</div>
            <div style={{ fontWeight:600,fontSize:15,color:'var(--text)' }}>{proj.name}</div>
            {proj.description && <div style={{ fontSize:12,color:'var(--text-3)',marginTop:3,lineHeight:1.5 }}>{proj.description.slice(0, 120)}{proj.description.length > 120 ? '…' : ''}</div>}
          </div>

          {/* Sector */}
          <div>
            <label style={{ fontSize:11,fontWeight:600,color:'var(--text-2)',textTransform:'uppercase',letterSpacing:'.07em',display:'block',marginBottom:6 }}>
              Secteur
            </label>
            <select value={sector} onChange={e => setSector(e.target.value)} style={fieldStyle}>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Help needed */}
          <div>
            <label style={{ fontSize:11,fontWeight:600,color:'var(--text-2)',textTransform:'uppercase',letterSpacing:'.07em',display:'block',marginBottom:8 }}>
              Profils recherchés <span style={{ fontWeight:400,textTransform:'none',color:'var(--text-3)' }}>— optionnel</span>
            </label>
            <div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>
              {(Object.keys(HELP_TAG_CONFIG) as HelpTagType[]).map(type => {
                const cfg = HELP_TAG_CONFIG[type]
                const active = tags.some(t => t.type === type)
                return (
                  <button key={type}
                    onClick={() => {
                      if (active) setTags(tags.filter(t => t.type !== type))
                      else setTags([...tags, { type }])
                    }}
                    style={{
                      padding:'6px 14px',borderRadius:'var(--r-full)',border:'1.5px solid',
                      borderColor: active ? 'var(--green)' : 'var(--border)',
                      background: active ? 'var(--green-3)' : 'var(--white)',
                      color: active ? 'var(--green)' : 'var(--text-2)',
                      fontSize:12,fontWeight:active?700:500,cursor:'pointer',transition:'all .15s',
                    }}
                  >
                    {cfg.emoji} {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        <div style={{ padding:'16px 24px',borderTop:'1px solid var(--border)',display:'flex',gap:10,flexShrink:0 }}>
          <button onClick={onClose} style={{ padding:'10px 20px',borderRadius:'var(--r-full)',border:'1.5px solid var(--border)',background:'var(--white)',fontSize:13,fontWeight:600,color:'var(--text-2)',cursor:'pointer' }}>
            Annuler
          </button>
          <button onClick={() => onConfirm(sector, tags)} disabled={pushing}
            style={{ flex:1,padding:'11px',borderRadius:'var(--r-full)',background:'var(--green)',color:'#fff',border:'none',
              fontFamily:'Inter,sans-serif',fontWeight:700,fontSize:14,cursor:pushing?'not-allowed':'pointer',
              opacity:pushing?.7:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
            <Share2 size={14} /> {pushing ? 'Publication…' : 'Publier le projet →'}
          </button>
        </div>
      </div>
    </>
  )
}

function SHCard({ title, description, icon: Icon, onClick, badge }: { title:string; description:string; icon:LucideIcon; onClick:()=>void; badge?:string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:'var(--white)',
        border:`1.5px solid ${hovered ? 'var(--green)' : 'var(--border)'}`,
        borderRadius:'var(--r-lg)',padding:'24px',cursor:'pointer',
        transition:'border-color .15s, box-shadow .15s',
        boxShadow: hovered ? '0 4px 14px rgba(2,79,65,.08)' : 'none',
        minHeight:160,display:'flex',flexDirection:'column',
        alignItems:'center',justifyContent:'center',textAlign:'center',gap:12,
        position:'relative',width:'100%',
      }}
    >
      {badge && (
        <span style={{
          position:'absolute',top:12,right:12,fontSize:10,fontWeight:700,
          padding:'2px 8px',borderRadius:'var(--r-full)',
          background:'var(--green-3)',color:'var(--green)',
        }}>{badge}</span>
      )}
      <div style={{ width:44,height:44,borderRadius:'var(--r-md)',background:'var(--green-3)',display:'flex',alignItems:'center',justifyContent:'center' }}>
        <Icon size={20} color="var(--green)" />
      </div>
      <div>
        <h3 style={{ fontFamily:'Inter, sans-serif',fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:5 }}>{title}</h3>
        <p style={{ fontFamily:'Inter, sans-serif',fontSize:12,color:'var(--text-3)',lineHeight:1.45 }}>{description}</p>
      </div>
    </button>
  )
}
