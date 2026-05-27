'use client'

import { useState, useEffect } from 'react'
import { DealLinkEditor } from '@/components/deallink/DealLinkEditor'
import { DealLinkPreview } from '@/components/deallink/DealLinkPreview'

export default function DealLinkEditPage(props: any) {
  const { id } = (props.params as any)?.id ? props.params : { id: '' }
  const [deallink, setDeallink] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | ''>('')
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const res = await fetch(`/api/deallink/${id}`)

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Deallink not found')
          } else if (res.status === 401) {
            throw new Error('You are not authorized to edit this deallink')
          }
          throw new Error('Failed to load deallink')
        }

        const data = await res.json()

        if (mounted) {
          setDeallink(data)
          setLoadError(null)
        }
      } catch (err) {
        console.error('[DealLinkEditPage]', err)
        if (mounted) {
          setLoadError((err as Error).message)
        }
      }
    })()

    return () => {
      mounted = false
    }
  }, [id])

  const handleColorChange = async (colorKey: string, hexValue: string) => {
    const updated = {
      ...deallink,
      config: {
        ...deallink.config,
        colors: { ...deallink.config.colors, [colorKey]: hexValue },
      },
    }
    setDeallink(updated)

    setSaveStatus('saving')
    try {
      const res = await fetch(`/api/deallink/${id}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colors: updated.config.colors }),
      })

      if (res.ok) {
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus(''), 2000)
      } else {
        setSaveStatus('error')
      }
    } catch (err) {
      console.error('[handleColorChange]', err)
      setSaveStatus('error')
    }
  }

  const handlePublish = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/deallink/${id}/publish`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        console.error('Publish error:', data)
        setSaveStatus('error')
        setIsSaving(false)
        return
      }

      const { public_url } = await res.json()
      window.location.href = public_url
    } catch (err) {
      console.error('[handlePublish]', err)
      setSaveStatus('error')
      setIsSaving(false)
    }
  }

  if (loadError) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--surface)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--text)',
              marginBottom: '8px',
            }}
          >
            Error
          </h1>
          <p style={{ color: 'var(--text-2)' }}>{loadError}</p>
        </div>
      </div>
    )
  }

  if (!deallink) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--surface)',
        }}
      >
        <p style={{ color: 'var(--text-2)' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: '#000',
      }}
    >
      <DealLinkEditor
        deallink={deallink}
        onColorChange={handleColorChange}
        onPublish={handlePublish}
        isSaving={isSaving}
        saveStatus={saveStatus}
      />

      <DealLinkPreview
        deallink={deallink}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
    </div>
  )
}
