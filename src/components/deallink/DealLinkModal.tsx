'use client'

import { useState, useEffect } from 'react'
import { DealLinkForm } from './DealLinkForm'
import { DealLinkEditorLeft } from './DealLinkEditorLeft'
import { DealLinkEditorRight } from './DealLinkEditorRight'

type View = 'form' | 'editor' | 'history-full'

export function DealLinkModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [view, setView] = useState<View>('form')
  const [deallink, setDeallink] = useState<any>(null)
  const [deallinks, setDeallinks] = useState<any[]>([])
  const [historicalLoading, setHistoricalLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | ''>('')
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (isOpen && view === 'form') {
      fetchDeallinks()
    }
  }, [isOpen, view])

  async function fetchDeallinks() {
    setHistoricalLoading(true)
    try {
      const res = await fetch('/api/deallink')
      if (res.ok) {
        const data = await res.json()
        setDeallinks(data.deallinks || [])
      }
    } catch (err) {
      console.error('Failed to fetch deallinks:', err)
    } finally {
      setHistoricalLoading(false)
    }
  }

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleFormSubmit(formData: any) {
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/deallink/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const err = (await res.json()) as { error?: string }
        const errorMsg = err.error || 'Erreur lors de la génération'
        setError(errorMsg)
        showToast(errorMsg, 'error')
        return
      }

      const data = await res.json()
      await fetchDeallink(data.deallink_id)
      setView('editor')
    } catch (err) {
      const errorMsg = 'Erreur réseau — réessaie.'
      setError(errorMsg)
      showToast(errorMsg, 'error')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchDeallink(id: string) {
    try {
      const res = await fetch(`/api/deallink/${id}`)
      if (res.ok) {
        const data = await res.json()
        setDeallink(data)
      }
    } catch (err) {
      console.error('Failed to fetch deallink:', err)
    }
  }

  async function handleColorChange(key: string, value: string) {
    if (!deallink) return

    setSaveStatus('saving')
    setIsSaving(true)

    try {
      const updatedConfig = {
        ...deallink.config,
        colors: {
          ...deallink.config.colors,
          [key]: value,
        },
      }

      const res = await fetch(`/api/deallink/${deallink.id}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: updatedConfig }),
      })

      if (!res.ok) {
        setSaveStatus('error')
        return
      }

      setDeallink((prev: any) => ({
        ...prev,
        config: updatedConfig,
      }))

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(''), 2000)
    } catch (err) {
      setSaveStatus('error')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePublish() {
    if (!deallink) return

    setIsSaving(true)

    try {
      const res = await fetch(`/api/deallink/${deallink.id}/publish`, {
        method: 'POST',
      })

      if (res.ok) {
        const data = await res.json()
        setDeallink((prev: any) => ({ ...prev, status: 'published' }))
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus(''), 2000)

        showToast('Lien publié et copié en clipboard', 'success')

        if (data.public_url) {
          navigator.clipboard.writeText(data.public_url)
        }
      }
    } catch (err) {
      setSaveStatus('error')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  function handleSelectDeallink(dl: any) {
    fetchDeallink(dl.id)
    setView('editor')
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 40,
        overflow: 'hidden',
      }}
      onClick={onClose}
    >
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            padding: '12px 24px',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            zIndex: 50,
            background: toast.type === 'success' ? 'var(--green)' : '#dc2626',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Modal Box */}
      <div
        style={{
          background: 'var(--white)',
          borderRadius: '8px',
          width: '95vw',
          height: '90vh',
          maxWidth: '1280px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (sticky) */}
        {view !== 'editor' && (
          <div
            style={{
              padding: '24px 32px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 500,
                color: 'var(--text)',
                margin: 0,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Deallink
            </h1>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: 'var(--text-2)',
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Content (scrollable) */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
          }}
        >
          {view === 'form' && (
            <div
              style={{
                flex: 1,
                padding: '32px',
                maxWidth: '500px',
                margin: '0 auto',
                width: '100%',
              }}
            >
              {error && (
                <div
                  style={{
                    padding: '12px',
                    background: '#fee2e2',
                    color: '#991b1b',
                    borderRadius: '6px',
                    fontSize: '13px',
                    marginBottom: '24px',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {error}
                </div>
              )}
              <DealLinkForm
                onSubmit={handleFormSubmit}
                isLoading={isLoading}
                error={error}
                deallinks={deallinks}
                historicalLoading={historicalLoading}
                onSelectDeallink={handleSelectDeallink}
                onShowAllDeallinks={() => setView('history-full')}
              />
            </div>
          )}

          {view === 'editor' && deallink && (
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', width: '100%' }}>
              <DealLinkEditorLeft
                deallink={deallink}
                onColorChange={handleColorChange}
                onPublish={handlePublish}
                isSaving={isSaving}
                saveStatus={saveStatus}
                onBack={() => setView('form')}
              />
              <DealLinkEditorRight deallink={deallink} />
            </div>
          )}

          {view === 'history-full' && (
            <div
              style={{
                flex: 1,
                padding: '32px',
                maxWidth: '500px',
                margin: '0 auto',
                width: '100%',
              }}
            >
              <button
                onClick={() => setView('form')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-2)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  padding: 0,
                  marginBottom: '24px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                }}
              >
                Retour
              </button>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 500,
                  color: 'var(--text)',
                  margin: '0 0 24px 0',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Historique
              </h2>
              <div style={{ display: 'grid', gap: '12px' }}>
                {deallinks.length === 0 ? (
                  <p
                    style={{
                      color: 'var(--text-2)',
                      textAlign: 'center',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    Aucun deallink pour le moment
                  </p>
                ) : (
                  deallinks.map((dl) => (
                    <button
                      key={dl.id}
                      onClick={() => handleSelectDeallink(dl)}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '16px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: '.2s',
                        fontFamily: 'Inter, sans-serif',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background =
                          'var(--white)'
                        ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                          'var(--text)'
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background =
                          'var(--surface)'
                        ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                          'var(--border)'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '8px',
                        }}
                      >
                        <div>
                          <p
                            style={{
                              fontSize: '14px',
                              fontWeight: 500,
                              color: 'var(--text)',
                              margin: 0,
                              marginBottom: '4px',
                              fontFamily: 'Inter, sans-serif',
                            }}
                          >
                            {dl.prospect_name}
                          </p>
                          <p
                            style={{
                              fontSize: '13px',
                              color: 'var(--text-2)',
                              margin: 0,
                              fontFamily: 'Inter, sans-serif',
                            }}
                          >
                            {dl.company_name}
                          </p>
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            color:
                              dl.status === 'published' ? '#fff' : 'var(--text-2)',
                            textTransform: 'uppercase',
                            background:
                              dl.status === 'published'
                                ? 'var(--green)'
                                : 'var(--surface)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontWeight: 500,
                            fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          {dl.status}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
