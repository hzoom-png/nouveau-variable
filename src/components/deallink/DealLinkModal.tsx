'use client'

import { useState, useEffect } from 'react'
import { DealLinkForm } from './DealLinkForm'
import { DealLinkEditor } from './DealLinkEditor'
import { DealLinkEditorLeft } from './DealLinkEditorLeft'
import { DealLinkEditorRight } from './DealLinkEditorRight'
import { DealLinkHistoryFull } from './DealLinkHistoryFull'

type View = 'form' | 'editor' | 'history-full'

export function DealLinkModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [view, setView] = useState<View>('form')
  const [deallink, setDeallink] = useState<any>(null)
  const [deallinks, setDeallinks] = useState<any[]>([])
  const [historicalLoading, setHistoricalLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [saveStatus, setSaveStatus] = useState<
    'saved' | 'saving' | 'error' | ''
  >('')
  const [isSaving, setIsSaving] = useState(false)

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
        setError(err.error || 'Generation failed')
        return
      }

      const data = await res.json()
      await fetchDeallink(data.deallink_id)
      setView('editor')
    } catch (err) {
      setError('Network error — try again')
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

        // Open the public URL in a new tab
        if (data.public_url) {
          window.open(data.public_url, '_blank')
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
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--white)',
          borderRadius: 'var(--r-lg)',
          width: '95vw',
          height: '90vh',
          maxWidth: '1400px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {view !== 'editor' && (
          <div
            style={{
              padding: '24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--text)',
                margin: 0,
              }}
            >
              ✨ Create Deallink
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

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
          }}
        >
          {view === 'form' && (
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '32px',
                maxWidth: '500px',
                margin: '0 auto',
              }}
            >
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
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
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
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '32px',
                }}
              >
                <div
                  style={{
                    maxWidth: '500px',
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    ← Back
                  </button>
                  <h2
                    style={{
                      fontSize: '18px',
                      fontWeight: 600,
                      color: 'var(--text)',
                      margin: '0 0 24px 0',
                    }}
                  >
                    📋 All Deallinks
                  </h2>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {deallinks.length === 0 ? (
                      <p style={{ color: 'var(--text-2)', textAlign: 'center' }}>
                        No deallinks yet
                      </p>
                    ) : (
                      deallinks.map((dl) => (
                        <button
                          key={dl.id}
                          onClick={() => handleSelectDeallink(dl)}
                          style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--r-sm)',
                            padding: '16px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: '.2s',
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
                                  fontWeight: 600,
                                  color: 'var(--text)',
                                  margin: 0,
                                  marginBottom: '4px',
                                }}
                              >
                                {dl.prospect_name}
                              </p>
                              <p
                                style={{
                                  fontSize: '13px',
                                  color: 'var(--text-2)',
                                  margin: 0,
                                }}
                              >
                                {dl.company_name}
                              </p>
                            </div>
                            <span
                              style={{
                                fontSize: '11px',
                                color:
                                  dl.status === 'published'
                                    ? '#fff'
                                    : 'var(--text-2)',
                                textTransform: 'uppercase',
                                background:
                                  dl.status === 'published'
                                    ? 'var(--green)'
                                    : 'var(--surface)',
                                padding: '4px 8px',
                                borderRadius: 'var(--r-sm)',
                                fontWeight: 600,
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
