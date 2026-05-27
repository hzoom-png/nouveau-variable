'use client'

import { useState, useEffect } from 'react'
import { DealLinkForm } from './DealLinkForm'
import { DealLinkEditor } from './DealLinkEditor'
import styles from './DealLinkModal.module.css'

type ViewState = 'form' | 'editor'

export function DealLinkModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [viewState, setViewState] = useState<ViewState>('form')
  const [currentDeallink, setCurrentDeallink] = useState<any>(null)
  const [historicalDeallinks, setHistoricalDeallinks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (isOpen && viewState === 'form' && historicalDeallinks.length === 0) {
      fetchHistorical()
    }
  }, [isOpen, viewState])

  async function fetchHistorical() {
    try {
      const res = await fetch('/api/deallink')
      if (res.ok) {
        const data = await res.json()
        setHistoricalDeallinks(data.deallinks || [])
      }
    } catch (err) {
      console.error('[fetchHistorical]', err)
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
      setViewState('editor')
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
        setCurrentDeallink(data)
      }
    } catch (err) {
      console.error('[fetchDeallink]', err)
    }
  }

  async function handlePublish() {
    if (!currentDeallink) return

    setIsLoading(true)

    try {
      const res = await fetch(`/api/deallink/${currentDeallink.id}/publish`, {
        method: 'POST',
      })

      if (res.ok) {
        const data = await res.json()
        setCurrentDeallink((prev: any) => ({ ...prev, status: 'published' }))
        showToast('Lien copié en clipboard', 'success')

        if (data.public_url) {
          navigator.clipboard.writeText(data.public_url)
        }

        await fetchHistorical()
        setTimeout(() => {
          setViewState('form')
          setCurrentDeallink(null)
        }, 1500)
      }
    } catch (err) {
      showToast('Erreur lors de la publication', 'error')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  function handleSelectDeallink(dl: any) {
    fetchDeallink(dl.id)
    setViewState('editor')
  }

  if (!isOpen) return null

  return (
    <div className={styles.dealLinkModal} onClick={onClose}>
      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${styles[`toast${toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}`]}`}>
          {toast.message}
        </div>
      )}

      {/* Modal Box */}
      <div className={styles.dealLinkModalBox} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.dealLinkModalHeader}>
          <h1 className={styles.dealLinkModalTitle}>Deallink</h1>
          <button
            className={styles.dealLinkModalClose}
            onClick={onClose}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className={styles.dealLinkModalContent}>
          {error && <div className={styles.errorBanner}>{error}</div>}

          {viewState === 'form' && (
            <DealLinkForm
              onSubmit={handleFormSubmit}
              isLoading={isLoading}
              historicalDeallinks={historicalDeallinks}
              onSelectDeallink={handleSelectDeallink}
            />
          )}

          {viewState === 'editor' && currentDeallink && (
            <DealLinkEditor
              deallink={currentDeallink}
              onPublish={handlePublish}
              onBack={() => {
                setViewState('form')
                setCurrentDeallink(null)
              }}
              isPublishing={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  )
}
