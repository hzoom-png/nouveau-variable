'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

interface Section {
  id: string
  type: string
  title: string
  body: string
}

interface InitialData {
  prospectName: string
  prospectCompany?: string
  prospectRole?: string
  sellerName: string
  sellerEmail?: string
  sellerPhone?: string
  sections: Section[]
  tagline: string
  brand: {
    primaryColor?: string
    secondaryColor?: string
    backgroundColor?: string
    logoUrl?: string
    prospectLogoUrl?: string
    caseStudyUrl?: string
    fontFamily?: string
    calendlyUrl?: string
    calendlyCtaLabel?: string
    quoteUrl?: string
    quoteCtaLabel?: string
  }
}

interface Props {
  slug: string
  initialData: InitialData
}

const SECTION_LABELS: Record<string, string> = {
  context:    'Contexte',
  value_prop: 'Proposition de valeur',
  proof:      'Preuve',
  cta:        'Appel à l\'action',
}

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 13px', border: '1.5px solid var(--border)',
  borderRadius: 'var(--r-sm)', fontSize: '13px', color: 'var(--text)',
  background: 'var(--white)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
}
const lbl: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, color: 'var(--text-2)',
  letterSpacing: '.06em', textTransform: 'uppercase', display: 'block', marginBottom: '5px',
}
const card: React.CSSProperties = {
  background: 'var(--white)', border: '1px solid var(--border)',
  borderRadius: '16px', padding: '20px 24px', marginBottom: '16px',
}

export function DealLinkEditor({ slug, initialData }: Props) {
  const [data,          setData]          = useState(initialData)
  const [saving,        setSaving]        = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState<'seller' | 'prospect' | null>(null)
  const sellerLogoRef   = useRef<HTMLInputElement>(null)
  const prospectLogoRef = useRef<HTMLInputElement>(null)

  async function uploadLogo(file: File, type: 'seller' | 'prospect') {
    if (!['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Format accepté : SVG, PNG, JPG, WebP')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Fichier trop lourd (max 2 Mo)')
      return
    }
    setUploadingLogo(type)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('slug', slug)
      fd.append('logoType', type)
      const res = await fetch('/api/deallink/upload-logo', { method: 'POST', body: fd })
      if (!res.ok) {
        const j = await res.json() as { error?: string }
        throw new Error(j.error ?? 'Erreur upload')
      }
      const { url } = await res.json() as { url: string }
      setData(p => ({
        ...p,
        brand: {
          ...p.brand,
          [type === 'seller' ? 'logoUrl' : 'prospectLogoUrl']: url,
        },
      }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur upload')
    } finally {
      setUploadingLogo(null)
    }
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/deallink/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          sections: data.sections,
          tagline:  data.tagline,
          brand:    data.brand,
        }),
      })
      if (!res.ok) {
        const j = await res.json() as { error?: string }
        throw new Error(j.error ?? 'Erreur enregistrement')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  function updateSection(id: string, field: 'title' | 'body', value: string) {
    setData(p => ({
      ...p,
      sections: p.sections.map(s => s.id === id ? { ...s, [field]: value } : s),
    }))
  }

  const editableSections = data.sections.filter(s => s.type !== 'hero')

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingBottom: '60px' }}>

      {/* Header sticky */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '12px 0', marginBottom: '24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/dashboard/tools/deallink" style={{ fontSize: '13px', color: 'var(--text-2)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ← Retour
          </Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
            {data.prospectName}{data.prospectCompany ? ` · ${data.prospectCompany}` : ''}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link
            href={`/dl/${slug}`}
            target="_blank"
            style={{ fontSize: '12px', color: 'var(--green)', textDecoration: 'none', fontWeight: 600 }}
          >
            Voir la page ↗
          </Link>
          <button
            onClick={save}
            disabled={saving}
            style={{
              background: saved ? 'var(--green-3)' : 'var(--green)',
              color: saved ? 'var(--green)' : '#fff',
              border: 'none', borderRadius: '99px',
              padding: '8px 18px', fontSize: '13px', fontWeight: 700,
              cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit',
              transition: 'all .2s',
            }}
          >
            {saving ? 'Enregistrement...' : saved ? '✓ Enregistré' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--red-2)', color: 'var(--red)', fontSize: '13px', padding: '10px 14px', borderRadius: 'var(--r-sm)', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Card — Accroche principale */}
      <div style={card}>
        <h3 style={{ fontFamily: 'var(--font-jost)', fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '12px' }}>Accroche principale</h3>
        <textarea
          rows={2}
          style={{ ...inp, resize: 'none', lineHeight: 1.55 }}
          value={data.tagline}
          onChange={e => setData(p => ({ ...p, tagline: e.target.value }))}
          placeholder="L'accroche principale de ta page..."
        />
      </div>

      {/* Card — Logos */}
      <div style={card}>
        <h3 style={{ fontFamily: 'var(--font-jost)', fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>Logos</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Seller logo */}
          <div>
            <label style={lbl}>Votre logo</label>
            <p style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '10px' }}>SVG, PNG, JPG — max 2 Mo</p>
            <input
              ref={sellerLogoRef}
              type="file"
              accept=".svg,.png,.jpg,.jpeg,.webp"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f, 'seller') }}
            />
            {data.brand.logoUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.brand.logoUrl} alt="" style={{ height: '40px', objectFit: 'contain', objectPosition: 'left' }} />
                <button onClick={() => setData(p => ({ ...p, brand: { ...p.brand, logoUrl: undefined } }))} style={{ fontSize: '11px', color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                  Supprimer
                </button>
              </div>
            ) : (
              <button
                onClick={() => sellerLogoRef.current?.click()}
                disabled={uploadingLogo === 'seller'}
                style={{
                  width: '100%', padding: '20px', border: '2px dashed var(--border)',
                  borderRadius: '10px', background: 'var(--surface)', cursor: 'pointer',
                  fontSize: '12px', color: 'var(--text-3)', fontFamily: 'inherit',
                }}
              >
                {uploadingLogo === 'seller' ? 'Envoi…' : '↑ Ajouter un logo'}
              </button>
            )}
          </div>

          {/* Prospect logo */}
          <div>
            <label style={lbl}>Logo du prospect</label>
            <p style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '10px' }}>Uniquement si tu le possèdes</p>
            <input
              ref={prospectLogoRef}
              type="file"
              accept=".svg,.png,.jpg,.jpeg,.webp"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f, 'prospect') }}
            />
            {data.brand.prospectLogoUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.brand.prospectLogoUrl} alt="" style={{ height: '40px', objectFit: 'contain', objectPosition: 'left' }} />
                <button onClick={() => setData(p => ({ ...p, brand: { ...p.brand, prospectLogoUrl: undefined } }))} style={{ fontSize: '11px', color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                  Supprimer
                </button>
              </div>
            ) : (
              <button
                onClick={() => prospectLogoRef.current?.click()}
                disabled={uploadingLogo === 'prospect'}
                style={{
                  width: '100%', padding: '20px', border: '2px dashed var(--border)',
                  borderRadius: '10px', background: 'var(--surface)', cursor: 'pointer',
                  fontSize: '12px', color: 'var(--text-3)', fontFamily: 'inherit',
                }}
              >
                {uploadingLogo === 'prospect' ? 'Envoi…' : '↑ Ajouter un logo'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Card — Actions */}
      <div style={card}>
        <h3 style={{ fontFamily: 'var(--font-jost)', fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>Actions</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '16px' }}>Boutons d&apos;action affichés sur la page publique</p>

        <div style={{ marginBottom: '16px' }}>
          <label style={lbl}>Lien Calendly</label>
          <input
            style={inp}
            type="url"
            value={data.brand.calendlyUrl ?? ''}
            onChange={e => setData(p => ({ ...p, brand: { ...p.brand, calendlyUrl: e.target.value } }))}
            placeholder="https://calendly.com/..."
          />
          {data.brand.calendlyUrl && (
            <div style={{ marginTop: '8px' }}>
              <label style={lbl}>
                Libellé bouton Calendly{' '}
                <span style={{ color: 'var(--text-3)', textTransform: 'none', fontWeight: 400 }}>
                  ({(data.brand.calendlyCtaLabel ?? '').length}/50)
                </span>
              </label>
              <input
                style={inp}
                maxLength={50}
                value={data.brand.calendlyCtaLabel ?? ''}
                onChange={e => setData(p => ({ ...p, brand: { ...p.brand, calendlyCtaLabel: e.target.value } }))}
                placeholder="Réserver un créneau"
              />
            </div>
          )}
        </div>

        <div>
          <label style={lbl}>Lien devis</label>
          <input
            style={inp}
            type="url"
            value={data.brand.quoteUrl ?? ''}
            onChange={e => setData(p => ({ ...p, brand: { ...p.brand, quoteUrl: e.target.value } }))}
            placeholder="https://..."
          />
          {data.brand.quoteUrl && (
            <div style={{ marginTop: '8px' }}>
              <label style={lbl}>
                Libellé bouton devis{' '}
                <span style={{ color: 'var(--text-3)', textTransform: 'none', fontWeight: 400 }}>
                  ({(data.brand.quoteCtaLabel ?? '').length}/50)
                </span>
              </label>
              <input
                style={inp}
                maxLength={50}
                value={data.brand.quoteCtaLabel ?? ''}
                onChange={e => setData(p => ({ ...p, brand: { ...p.brand, quoteCtaLabel: e.target.value } }))}
                placeholder="Obtenir un devis"
              />
            </div>
          )}
        </div>
      </div>

      {/* Card — Lien cas client */}
      <div style={card}>
        <h3 style={{ fontFamily: 'var(--font-jost)', fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>Lien cas client</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '12px' }}>Lien vers une étude de cas réelle. Aucun faux témoignage ne sera généré.</p>
        <input
          style={inp}
          type="url"
          value={data.brand.caseStudyUrl ?? ''}
          onChange={e => setData(p => ({ ...p, brand: { ...p.brand, caseStudyUrl: e.target.value } }))}
          placeholder="https://exemple.fr/cas-client"
        />
      </div>

      {/* Card — Contenu des sections */}
      {editableSections.length > 0 && (
        <div style={card}>
          <h3 style={{ fontFamily: 'var(--font-jost)', fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>Contenu des sections</h3>
          {editableSections.map((section, i) => (
            <div
              key={section.id}
              style={{
                paddingBottom: i < editableSections.length - 1 ? '20px' : 0,
                marginBottom: i < editableSections.length - 1 ? '20px' : 0,
                borderBottom: i < editableSections.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '10px' }}>
                {SECTION_LABELS[section.type] ?? section.type}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={lbl}>Titre</label>
                <input
                  style={inp}
                  value={section.title}
                  onChange={e => updateSection(section.id, 'title', e.target.value)}
                  placeholder="Titre de la section"
                />
              </div>
              <div>
                <label style={lbl}>Corps</label>
                <textarea
                  rows={3}
                  style={{ ...inp, resize: 'none', lineHeight: 1.55 }}
                  value={section.body}
                  onChange={e => updateSection(section.id, 'body', e.target.value)}
                  placeholder="Contenu de la section..."
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {editableSections.length === 0 && (
        <div style={{ ...card, textAlign: 'center', color: 'var(--text-3)', fontSize: '13px' }}>
          <p>Ce DealLink a été généré avec l&apos;ancien format.</p>
          <p style={{ marginTop: '6px' }}>Crée un nouveau DealLink pour accéder à l&apos;éditeur de sections.</p>
        </div>
      )}
    </div>
  )
}
