'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDashboard } from '@/lib/dashboard-context'
import { LockedSection } from '@/components/LockedSection'

// ── Types ──────────────────────────────────────────────────────────
type Stage = 'idea' | 'validation' | 'build' | 'launch' | 'growth'

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
}

interface MemberProject { id: string; title: string; description?: string }

interface Props {
  userId: string
  initialProjects: SHProject[]
  memberProjects: MemberProject[]
}

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
  const [drawer,   setDrawer]     = useState<'bmc'|'forecast'|null>(null)
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
          <div className="tool-badge">🚀 Side Hustle</div>
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
            <div style={{ fontSize:32,marginBottom:12 }}>🚀</div>
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
                    <h3 style={{ fontFamily:'var(--font-jost)',fontWeight:700,fontSize:15,color:'var(--text)',flex:1,marginRight:8 }}>{proj.name}</h3>
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
          <h1 style={{ fontFamily:'var(--font-jost)',fontWeight:800,fontSize:22,color:'var(--text)' }}>
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
                fontFamily:'var(--font-jost)',fontWeight:700,fontSize:14,border:'none',
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

    return (
      <div>
        {/* Header */}
        <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:24,flexWrap:'wrap' }}>
          <button onClick={() => setView('list')} style={{ fontSize:13,color:'var(--text-3)',background:'none',border:'none',cursor:'pointer' }}>← Mes projets</button>
          <h1 style={{ fontFamily:'var(--font-jost)',fontWeight:800,fontSize:22,color:'var(--text)',flex:1 }}>{proj.name}</h1>
          <button onClick={() => { setForm({ ...proj }); setEditing(true); setView('form') }}
            style={{ fontSize:12,padding:'7px 16px',borderRadius:'var(--r-full)',border:'1.5px solid var(--border)',background:'var(--white)',color:'var(--text-2)',cursor:'pointer',fontWeight:600 }}>
            Modifier
          </button>
          <button onClick={() => setDrawer('bmc')}
            style={{ fontSize:12,padding:'7px 16px',borderRadius:'var(--r-full)',border:'1.5px solid var(--green)',background:'var(--green-3)',color:'var(--green)',cursor:'pointer',fontWeight:600 }}>
            Business Model Canvas
          </button>
          <button onClick={() => setDrawer('forecast')}
            style={{ fontSize:12,padding:'7px 16px',borderRadius:'var(--r-full)',border:'1.5px solid var(--green)',background:'var(--green-3)',color:'var(--green)',cursor:'pointer',fontWeight:600 }}>
            Prévisionnel
          </button>
        </div>

        <div style={{ display:'grid',gridTemplateColumns:'280px 1fr',gap:24,alignItems:'start' }}>

          {/* Left col */}
          <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
            <div style={{ background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:18 }}>
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
                <span style={{ fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:'var(--r-full)',
                  background:`${STAGE_COLORS[proj.stage]}18`,color:STAGE_COLORS[proj.stage] }}>
                  {STAGE_LABELS[proj.stage]}
                </span>
              </div>
              {proj.objective && (
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:10,fontWeight:600,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:4 }}>Objectif</div>
                  <div style={{ fontSize:13,color:'var(--text)',lineHeight:1.5 }}>{proj.objective}</div>
                </div>
              )}
              {proj.target_date && (
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:10,fontWeight:600,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:4 }}>Date cible</div>
                  <div style={{ fontSize:13,color:'var(--text)' }}>{new Date(proj.target_date).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</div>
                </div>
              )}
              <div>
                <div style={{ display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--text-3)',marginBottom:6 }}>
                  <span>Progression globale</span>
                  <span style={{ fontWeight:600,color:'var(--green)' }}>{progress}%</span>
                </div>
                <div style={{ height:6,background:'var(--surface)',borderRadius:99,overflow:'hidden' }}>
                  <div style={{ height:'100%',width:`${progress}%`,background:'var(--green)',borderRadius:99,transition:'width .4s' }}/>
                </div>
                <div style={{ fontSize:11,color:'var(--text-3)',marginTop:6 }}>
                  {allTasks.filter(t=>t.done).length} / {allTasks.length} tâches
                </div>
              </div>
            </div>

            {!proj.roadmap && (
              <button onClick={() => generate(proj)}
                style={{ width:'100%',padding:'12px',background:'var(--green)',color:'#fff',border:'none',
                  borderRadius:'var(--r-full)',fontFamily:'var(--font-jost)',fontWeight:700,fontSize:14,cursor:'pointer' }}>
                Générer la roadmap →
              </button>
            )}
          </div>

          {/* Right col - Roadmap */}
          <div>
            {!proj.roadmap ? (
              <div style={{ background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:'48px',textAlign:'center' }}>
                <p style={{ color:'var(--text-3)',fontSize:14 }}>Aucune roadmap générée. Clique sur &ldquo;Générer la roadmap&rdquo; pour démarrer.</p>
              </div>
            ) : (
              <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
                {proj.roadmap.map((phase, pi) => (
                  <div key={pi} style={{ background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden' }}>
                    <div style={{ padding:'14px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10 }}>
                      <span style={{ fontFamily:'var(--font-jost)',fontWeight:700,fontSize:14,color:'var(--text)',flex:1 }}>{phase.phase}</span>
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
          </div>
        </div>

        {/* BMC Drawer */}
        {drawer === 'bmc' && proj.bmc && (
          <Drawer title="Business Model Canvas" onClose={() => setDrawer(null)}>
            <p style={{ fontSize:12,color:'var(--text-3)',marginBottom:16 }}>Clique sur un champ pour le modifier — sauvegarde automatique.</p>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
              {(Object.entries(BMC_LABELS) as [keyof BmcKey, string][]).map(([key, label]) => (
                <BmcField key={key} label={label} value={proj.bmc![key]} onSave={v => saveBmc(proj.id, key, v)} />
              ))}
            </div>
          </Drawer>
        )}

        {/* Forecast Drawer */}
        {drawer === 'forecast' && proj.forecast && (
          <Drawer title="Prévisionnel 12 mois" onClose={() => setDrawer(null)}>
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
          </Drawer>
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
      <td style={{ padding:'6px 12px',fontFamily:'var(--font-jost)',fontWeight:600 }}>{month.month}</td>
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

function Drawer({ title, onClose, children }: { title:string; onClose:()=>void; children:React.ReactNode }) {
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.32)',zIndex:200 }}/>
      <div style={{ position:'fixed',top:0,right:0,width:640,maxWidth:'95vw',height:'100vh',
        background:'var(--white)',borderLeft:'1px solid var(--border)',zIndex:201,
        display:'flex',flexDirection:'column',overflow:'hidden' }}>
        <div style={{ padding:'18px 24px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
          <h2 style={{ fontFamily:'var(--font-jost)',fontWeight:800,fontSize:18,color:'var(--text)' }}>{title}</h2>
          <button onClick={onClose} style={{ width:30,height:30,borderRadius:'var(--r-sm)',background:'var(--surface)',border:'1px solid var(--border)',cursor:'pointer',fontSize:16,color:'var(--text-2)' }}>×</button>
        </div>
        <div style={{ flex:1,overflowY:'auto',padding:'20px 24px' }}>{children}</div>
      </div>
    </>
  )
}
