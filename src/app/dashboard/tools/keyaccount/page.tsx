'use client'

import { useState } from 'react'

type Contact = { id: number; name: string; role: string; type: 'champion' | 'decision' | 'blocker' | 'neutral'; avatar: string; meddic: Record<string, boolean> }
type Deal = { id: number; name: string; company: string; value: string; stage: string; progress: number; contacts: Contact[] }

const MEDDIC = {
  metrics: ['ROI quantifié', 'Métriques de succès définies', 'Baseline établie'],
  economic_buyer: ['Identifié', 'Rencontré', 'Aligné sur le budget'],
  decision_criteria: ['Critères listés', 'Pondération connue', 'Notre position claire'],
  decision_process: ['Étapes du processus', 'Timeline connue', 'Comité d\'achat mappé'],
  identify_pain: ['Problème confirmé', 'Impact mesuré', 'Urgence établie'],
  champion: ['Champion identifié', 'Champion actif', 'Champion préparé'],
}

const ROLE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  champion: { bg: 'var(--green-3)', color: 'var(--green)', label: 'Champion' },
  decision: { bg: '#EEF4FF', color: '#4B7BF5', label: 'Décideur' },
  blocker: { bg: 'var(--red-2)', color: 'var(--red)', label: 'Bloqueur' },
  neutral: { bg: 'var(--surface-2)', color: 'var(--text-3)', label: 'Neutre' },
}

const INITIAL_DEALS: Deal[] = [
  {
    id: 1, name: 'Deal Acme Corp', company: 'Acme Corp', value: '48 000 €', stage: 'Proposition', progress: 65,
    contacts: [
      { id: 1, name: 'Thomas R.', role: 'Directeur Commercial', type: 'champion', avatar: 'TR', meddic: { 'ROI quantifié': true, 'Métriques de succès définies': false, 'Baseline établie': false, 'Identifié': true, 'Rencontré': true, 'Aligné sur le budget': false, 'Critères listés': true, 'Pondération connue': false, 'Notre position claire': false, 'Étapes du processus': true, 'Timeline connue': true, "Comité d'achat mappé": false, 'Problème confirmé': true, 'Impact mesuré': true, 'Urgence établie': false, 'Champion identifié': true, 'Champion actif': true, 'Champion préparé': false } },
      { id: 2, name: 'Sophie M.', role: 'DSI', type: 'decision', avatar: 'SM', meddic: {} },
      { id: 3, name: 'Marc D.', role: 'CFO', type: 'blocker', avatar: 'MD', meddic: {} },
    ],
  },
  {
    id: 2, name: 'Projet BetaMax', company: 'BetaMax SAS', value: '22 000 €', stage: 'Découverte', progress: 30,
    contacts: [
      { id: 4, name: 'Clara A.', role: 'CEO', type: 'champion', avatar: 'CA', meddic: {} },
    ],
  },
]

export default function KeyAccountPage() {
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS)
  const [selectedDeal, setSelectedDeal] = useState<Deal>(INITIAL_DEALS[0])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [addingContact, setAddingContact] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', role: '', type: 'neutral' as Contact['type'] })

  const AVATAR_COLORS = ['var(--green)', '#4B7BF5', 'var(--amber)', '#7C5CBF', '#E91E63']

  function getMeddicScore(contact: Contact) {
    const allItems = Object.values(MEDDIC).flat()
    const checked = allItems.filter(item => contact.meddic[item]).length
    return Math.round((checked / allItems.length) * 100)
  }

  function toggleMeddicItem(item: string) {
    if (!selectedContact) return
    const updated = { ...selectedContact, meddic: { ...selectedContact.meddic, [item]: !selectedContact.meddic[item] } }
    setSelectedContact(updated)
    setDeals(ds => ds.map(d => d.id === selectedDeal.id ? {
      ...d,
      contacts: d.contacts.map(c => c.id === updated.id ? updated : c)
    } : d))
    setSelectedDeal(sd => ({ ...sd, contacts: sd.contacts.map(c => c.id === updated.id ? updated : c) }))
  }

  function addContact() {
    if (!newContact.name) return
    const contact: Contact = { id: Date.now(), name: newContact.name, role: newContact.role, type: newContact.type, avatar: newContact.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2), meddic: {} }
    const updated = { ...selectedDeal, contacts: [...selectedDeal.contacts, contact] }
    setSelectedDeal(updated)
    setDeals(ds => ds.map(d => d.id === updated.id ? updated : d))
    setNewContact({ name: '', role: '', type: 'neutral' })
    setAddingContact(false)
  }

  const inputStyle: React.CSSProperties = { padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: '13px', color: 'var(--text)', background: 'var(--white)', outline: 'none', fontFamily: 'inherit', width: '100%' }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '4px 12px', borderRadius: 'var(--r-full)', background: '#EEF4FF', border: '1px solid #BFDBFE', fontSize: '11px', fontWeight: 700, color: '#4B7BF5', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
          War Room · MEDDIC
        </div>
        <div style={{ fontFamily: 'var(--font-jost)', fontSize: '28px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-.02em', marginBottom: '8px' }}>Keyaccount</div>
        <div style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.7 }}>
          Cartographie visuelle de tes comptes clés. Score MEDDIC par contact, identification des champions et des bloqueurs.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedContact ? '1fr 1fr' : '1fr', gap: '20px' }}>
        <div>
          {/* Deal selector */}
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '20px' }}>
            {deals.map(deal => (
              <button key={deal.id} onClick={() => { setSelectedDeal(deal); setSelectedContact(null) }} style={{ flexShrink: 0, padding: '10px 16px', borderRadius: 'var(--r-md)', background: selectedDeal.id === deal.id ? 'var(--green)' : 'var(--white)', border: `1px solid ${selectedDeal.id === deal.id ? 'var(--green)' : 'var(--border)'}`, color: selectedDeal.id === deal.id ? '#fff' : 'var(--text)', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ fontFamily: 'var(--font-jost)', fontSize: '13px', fontWeight: 700 }}>{deal.company}</div>
                <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>{deal.value} · {deal.stage}</div>
              </button>
            ))}
          </div>

          {/* Deal progress */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '18px 20px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-jost)', fontSize: '16px', fontWeight: 800, color: 'var(--text)' }}>{selectedDeal.company}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '2px' }}>{selectedDeal.value} · {selectedDeal.stage}</div>
              </div>
              <div style={{ fontFamily: 'var(--font-jost)', fontSize: '24px', fontWeight: 800, color: 'var(--green)' }}>{selectedDeal.progress}%</div>
            </div>
            <div style={{ height: '6px', background: 'var(--surface-2)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
              <div style={{ height: '6px', background: 'var(--green)', borderRadius: 'var(--r-full)', width: `${selectedDeal.progress}%` }} />
            </div>
          </div>

          {/* Contacts */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-jost)', fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Contacts ({selectedDeal.contacts.length})</span>
              <button onClick={() => setAddingContact(true)} style={{ fontSize: '12px', fontWeight: 600, color: 'var(--green)', background: 'var(--green-3)', border: '1px solid var(--green-4)', padding: '5px 12px', borderRadius: 'var(--r-sm)', cursor: 'pointer' }}>+ Ajouter</button>
            </div>

            {addingContact && (
              <div style={{ padding: '14px 18px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}><input style={inputStyle} placeholder="Nom" value={newContact.name} onChange={e => setNewContact(n => ({ ...n, name: e.target.value }))} /></div>
                <div style={{ flex: 1 }}><input style={inputStyle} placeholder="Rôle" value={newContact.role} onChange={e => setNewContact(n => ({ ...n, role: e.target.value }))} /></div>
                <select style={{ ...inputStyle, width: 'auto' }} value={newContact.type} onChange={e => setNewContact(n => ({ ...n, type: e.target.value as Contact['type'] }))}>
                  <option value="champion">Champion</option>
                  <option value="decision">Décideur</option>
                  <option value="blocker">Bloqueur</option>
                  <option value="neutral">Neutre</option>
                </select>
                <button onClick={addContact} style={{ background: 'var(--green)', color: '#fff', padding: '8px 14px', borderRadius: 'var(--r-sm)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Ajouter</button>
                <button onClick={() => setAddingContact(false)} style={{ color: 'var(--text-3)', fontSize: '13px', background: 'none', cursor: 'pointer' }}>✕</button>
              </div>
            )}

            {selectedDeal.contacts.map((contact, idx) => {
              const rs = ROLE_STYLES[contact.type]
              const score = getMeddicScore(contact)
              return (
                <div key={contact.id} onClick={() => setSelectedContact(selectedContact?.id === contact.id ? null : contact)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', borderBottom: '1px solid var(--border)', transition: '.14s', cursor: 'pointer', background: selectedContact?.id === contact.id ? 'var(--green-3)' : 'transparent' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: 'var(--r-sm)', background: AVATAR_COLORS[idx % AVATAR_COLORS.length], display: 'grid', placeItems: 'center', fontFamily: 'var(--font-jost)', fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{contact.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{contact.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '1px' }}>{contact.role}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ height: '4px', width: '60px', background: 'var(--surface-2)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
                      <div style={{ height: '4px', background: score > 60 ? 'var(--green)' : score > 30 ? 'var(--amber)' : 'var(--red)', width: `${score}%` }} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-2)', width: '28px', textAlign: 'right' }}>{score}%</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--r-full)', background: rs.bg, color: rs.color }}>{rs.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* MEDDIC Panel */}
        {selectedContact && (
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', position: 'sticky', top: '80px', height: 'fit-content' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-jost)', fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>{selectedContact.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '2px' }}>Score MEDDIC : <strong style={{ color: 'var(--green)' }}>{getMeddicScore(selectedContact)}%</strong></div>
              </div>
              <button onClick={() => setSelectedContact(null)} style={{ color: 'var(--text-3)', fontSize: '18px', background: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '16px 20px', maxHeight: '60vh', overflowY: 'auto' }}>
              {Object.entries(MEDDIC).map(([key, items]) => (
                <div key={key} style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: '8px' }}>
                    {key.replace(/_/g, ' ')}
                  </div>
                  {items.map(item => (
                    <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', cursor: 'pointer' }}>
                      <div onClick={() => toggleMeddicItem(item)} style={{ width: '16px', height: '16px', borderRadius: '4px', border: `1.5px solid ${selectedContact.meddic[item] ? 'var(--green)' : 'var(--border)'}`, background: selectedContact.meddic[item] ? 'var(--green)' : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0, cursor: 'pointer', transition: '.14s' }}>
                        {selectedContact.meddic[item] && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                      </div>
                      <span style={{ fontSize: '13px', color: selectedContact.meddic[item] ? 'var(--text)' : 'var(--text-2)', fontWeight: selectedContact.meddic[item] ? 500 : 400 }}>{item}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
