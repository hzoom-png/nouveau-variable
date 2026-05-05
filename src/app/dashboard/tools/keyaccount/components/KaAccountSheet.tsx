'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useKa } from '@/contexts/KaContext'
import type { KaAccount, KaContact, ContactType, Stage } from '../types'
import { KA_STYLES } from '../meddicc'

interface Props {
  account: KaAccount
  onClose: () => void
  showToast: (msg: string) => void
}

const STAGES: Stage[] = ['Qualification', 'Démo', 'Proposition', 'Négociation', 'Closing']

const lbl: React.CSSProperties = {
  display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--text-2)',
  textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '5px',
}

const sectionTitle: React.CSSProperties = {
  fontSize: '10px', fontWeight: 700, color: 'var(--text-3)',
  textTransform: 'uppercase', letterSpacing: '.1em',
  borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '14px',
}

function mapTypeToReplique(type: ContactType): string {
  const map: Record<ContactType, string> = {
    champion: 'manager',
    decision: 'decision_maker',
    blocker:  'manager',
    neutral:  'manager',
  }
  return map[type]
}

function ContactRow({
  contact, accountId, account,
  onUpdate, onDelete,
}: {
  contact: KaContact
  accountId: string
  account: KaAccount
  onUpdate: (contactId: string, fields: Partial<KaContact>) => void
  onDelete: (contactId: string) => void
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [role,     setRole]     = useState(contact.role)
  const [email,    setEmail]    = useState(contact.email)
  const [phone,    setPhone]    = useState(contact.phone ?? '')
  const [linkedin, setLinkedin] = useState(contact.linkedin ?? '')
  const [notes,    setNotes]    = useState(contact.notes)

  const s = KA_STYLES[contact.type]
  const initials = contact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  function handleDeleteClick() {
    if (!deleteConfirm) {
      setDeleteConfirm(true)
      setTimeout(() => setDeleteConfirm(false), 3000)
    } else {
      onDelete(contact.id)
    }
  }

  function handleLaunchReplique() {
    const params = new URLSearchParams({
      contact_role:    contact.role,
      company_sector:  account.sector,
      context:         `Contact chez ${account.name}. ${contact.notes || ''}`.trim(),
      objective:       account.phone_standard ? 'barrage' : 'rdv',
      contact_type:    mapTypeToReplique(contact.type),
      account_name:    account.name,
    })
    router.push(`/dashboard/tools/replique?${params.toString()}`)
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden', marginBottom: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'var(--surface)', cursor: 'default' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: s.bg, border: `1.5px solid ${s.border}`, display: 'grid', placeItems: 'center', fontSize: '10px', fontWeight: 700, color: s.text, flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contact.name}</div>
          {contact.role && <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{contact.role}</div>}
        </div>
        <span style={{ padding: '2px 8px', borderRadius: 'var(--r-full)', background: s.bg, color: s.text, border: `1px solid ${s.border}`, fontSize: '10px', fontWeight: 600, flexShrink: 0 }}>{s.label}</span>
        <button
          onClick={() => setExpanded(e => !e)}
          style={{ padding: '4px', color: 'var(--text-3)', cursor: 'pointer', background: 'none', border: 'none', fontSize: '12px' }}
        >
          {expanded ? '▴' : '▾'}
        </button>
        <button
          onClick={handleDeleteClick}
          style={{ padding: '4px 8px', borderRadius: 'var(--r-sm)', background: deleteConfirm ? 'var(--red-2)' : 'transparent', border: `1px solid ${deleteConfirm ? '#FADBD8' : 'transparent'}`, color: deleteConfirm ? 'var(--red)' : 'var(--text-3)', cursor: 'pointer', fontSize: '11px', fontWeight: 600, transition: '.14s', whiteSpace: 'nowrap' }}
        >
          {deleteConfirm ? 'Confirmer ?' : '🗑'}
        </button>
      </div>

      {expanded && (
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border)', background: 'var(--white)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={lbl}>Rôle</label>
              <input className="finput" value={role} onChange={e => setRole(e.target.value)} onBlur={() => onUpdate(contact.id, { role })} placeholder="Directeur Commercial…" />
            </div>
            <div>
              <label style={lbl}>Email</label>
              <input className="finput" type="email" value={email} onChange={e => setEmail(e.target.value)} onBlur={() => onUpdate(contact.id, { email })} placeholder="email@…" />
            </div>
            <div>
              <label style={lbl}>Téléphone direct</label>
              <input className="finput" value={phone} onChange={e => setPhone(e.target.value)} onBlur={() => onUpdate(contact.id, { phone })} placeholder="+33 6 …" />
            </div>
            <div>
              <label style={lbl}>LinkedIn</label>
              <input className="finput" value={linkedin} onChange={e => setLinkedin(e.target.value)} onBlur={() => onUpdate(contact.id, { linkedin })} placeholder="linkedin.com/in/…" />
            </div>
          </div>
          <div>
            <label style={lbl}>Notes</label>
            <textarea className="finput" rows={2} value={notes} onChange={e => setNotes(e.target.value)} onBlur={() => onUpdate(contact.id, { notes })} style={{ resize: 'none', lineHeight: 1.5 }} placeholder="Points clés sur ce contact…" />
          </div>
          <button
            onClick={handleLaunchReplique}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 14px', borderRadius: 'var(--r-sm)', background: 'var(--green-3)', border: '1px solid var(--green-4)', color: 'var(--green)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: '.14s', width: 'fit-content' }}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--green)'; e.currentTarget.style.color = '#fff' }}
            onMouseOut={e => { e.currentTarget.style.background = 'var(--green-3)'; e.currentTarget.style.color = 'var(--green)' }}
          >
            🎯 Préparer un appel avec Réplique →
          </button>
        </div>
      )}
    </div>
  )
}

export default function KaAccountSheet({ account, onClose, showToast }: Props) {
  const { updateAccount, deleteAccount, updateContact, deleteContact } = useKa()

  const [name,           setName]          = useState(account.name)
  const [sector,         setSector]        = useState(account.sector)
  const [val,            setVal]           = useState(account.val)
  const [stage,          setStage]         = useState<Stage>(account.stage)
  const [website,        setWebsite]       = useState(account.website ?? '')
  const [phoneStandard,  setPhoneStandard] = useState(account.phone_standard ?? '')
  const [address,        setAddress]       = useState(account.address ?? '')
  const [notesContext,   setNotesContext]  = useState(account.notes_context ?? '')
  const [nextAction,     setNextAction]    = useState(account.next_action ?? '')
  const [nextActionDate, setNextActionDate]= useState(account.next_action_date ?? '')
  const [deleteConfirm,  setDeleteConfirm] = useState(false)
  const [saving,         setSaving]        = useState(false)

  async function handleSave() {
    setSaving(true)
    await updateAccount(account.id, {
      name:             name.trim() || account.name,
      sector:           sector.trim(),
      val:              val.trim(),
      stage,
      website:          website.trim(),
      phone_standard:   phoneStandard.trim(),
      address:          address.trim(),
      notes_context:    notesContext.trim(),
      next_action:      nextAction.trim(),
      next_action_date: nextActionDate || undefined,
    })
    setSaving(false)
    showToast('Compte mis à jour ✓')
    onClose()
  }

  function handleDeleteClick() {
    if (!deleteConfirm) {
      setDeleteConfirm(true)
      setTimeout(() => setDeleteConfirm(false), 4000)
    } else {
      deleteAccount(account.id)
      onClose()
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,28,23,.45)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 20px', overflowY: 'auto' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--white)', borderRadius: 'var(--r-xl)', width: '100%', maxWidth: '560px', maxHeight: '85vh', overflowY: 'auto', margin: 'auto', boxShadow: 'var(--shadow-lg)', animation: 'kaModalIn .22s cubic-bezier(.16,1,.3,1)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', position: 'sticky', top: 0, background: 'var(--white)', zIndex: 1 }}>
          <div>
            <div style={{ fontFamily: "'Jost', sans-serif", fontSize: '17px', fontWeight: 800, color: 'var(--text)', marginBottom: '6px' }}>{account.name}</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ padding: '2px 10px', borderRadius: 'var(--r-full)', background: 'var(--green-3)', color: 'var(--green)', border: '1px solid var(--green-4)', fontSize: '11px', fontWeight: 600 }}>{account.stage}</span>
              {account.sector && <span style={{ padding: '2px 10px', borderRadius: 'var(--r-full)', background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)', fontSize: '11px', fontWeight: 500 }}>{account.sector}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ width: '28px', height: '28px', borderRadius: 'var(--r-sm)', background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '16px', color: 'var(--text-2)', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}>×</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* INFORMATIONS */}
          <div>
            <div style={sectionTitle}>Informations</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '11px' }}>
                <div>
                  <label style={lbl}>Nom du compte</label>
                  <input className="finput" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Secteur</label>
                  <input className="finput" value={sector} onChange={e => setSector(e.target.value)} placeholder="SaaS, BTP, RH…" />
                </div>
              </div>
              <div>
                <label style={lbl}>
                  Standard / Barrage
                  {phoneStandard && (
                    <span style={{ marginLeft: '8px', padding: '1px 8px', borderRadius: 'var(--r-full)', background: 'var(--amber-2)', color: 'var(--amber)', border: '1px solid rgba(200,121,10,.2)', fontSize: '10px', fontWeight: 600 }}>
                      🎯 Script barrage dispo
                    </span>
                  )}
                </label>
                <input className="finput" value={phoneStandard} onChange={e => setPhoneStandard(e.target.value)} placeholder="+33 1 …" />
              </div>
              <div>
                <label style={lbl}>Site web</label>
                <input className="finput" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://…" />
              </div>
              <div>
                <label style={lbl}>Adresse</label>
                <input className="finput" value={address} onChange={e => setAddress(e.target.value)} placeholder="Ville, région…" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '11px' }}>
                <div>
                  <label style={lbl}>Valeur estimée</label>
                  <input className="finput" value={val} onChange={e => setVal(e.target.value)} placeholder="5 000 €" />
                </div>
                <div>
                  <label style={lbl}>Stade</label>
                  <select className="finput" value={stage} onChange={e => setStage(e.target.value as Stage)} style={{ cursor: 'pointer' }}>
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* CONTEXTE */}
          <div>
            <div style={sectionTitle}>Contexte</div>
            <div>
              <label style={lbl}>Notes générales</label>
              <textarea className="finput" rows={3} value={notesContext} onChange={e => setNotesContext(e.target.value)} style={{ resize: 'none', lineHeight: 1.6 }} placeholder="Historique de la relation, enjeux, contexte concurrentiel…" />
            </div>
          </div>

          {/* PROCHAINE ACTION */}
          <div>
            <div style={sectionTitle}>Prochaine action</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '11px', alignItems: 'end' }}>
              <div>
                <label style={lbl}>Action</label>
                <input className="finput" value={nextAction} onChange={e => setNextAction(e.target.value)} placeholder="Envoyer la proposition, relancer…" />
              </div>
              <div>
                <label style={lbl}>Date</label>
                <input className="finput" type="date" value={nextActionDate} onChange={e => setNextActionDate(e.target.value)} style={{ width: '150px' }} />
              </div>
            </div>
          </div>

          {/* CONTACTS */}
          <div>
            <div style={sectionTitle}>Contacts ({account.contacts.length})</div>
            {account.contacts.length === 0 && (
              <div style={{ fontSize: '13px', color: 'var(--text-3)', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
                Aucun contact sur ce compte.
              </div>
            )}
            {account.contacts.map(c => (
              <ContactRow
                key={c.id}
                contact={c}
                accountId={account.id}
                account={account}
                onUpdate={(contactId, fields) => updateContact(account.id, contactId, fields)}
                onDelete={contactId => deleteContact(account.id, contactId)}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', position: 'sticky', bottom: 0, background: 'var(--white)' }}>
          <button
            onClick={handleDeleteClick}
            style={{ padding: '9px 16px', borderRadius: 'var(--r-sm)', background: deleteConfirm ? 'var(--red-2)' : 'var(--surface)', border: `1px solid ${deleteConfirm ? '#FADBD8' : 'var(--border)'}`, color: deleteConfirm ? 'var(--red)' : 'var(--text-3)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: '.14s', whiteSpace: 'nowrap' }}
          >
            {deleteConfirm ? 'Confirmer la suppression ?' : 'Supprimer le compte'}
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 'var(--r-sm)', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '9px 20px', borderRadius: 'var(--r-sm)', background: saving ? 'var(--green-4)' : 'var(--green)', border: 'none', color: '#fff', fontFamily: "'Jost', sans-serif", fontSize: '13px', fontWeight: 700, cursor: saving ? 'default' : 'pointer', transition: '.14s' }}
          >
            {saving ? 'Enregistrement…' : 'Sauvegarder →'}
          </button>
        </div>
      </div>
    </div>
  )
}
