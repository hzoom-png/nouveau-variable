'use client'

import { useState } from 'react'
import styles from './DealLinkModal.module.css'

interface DealLinkFormProps {
  onSubmit: (data: any) => Promise<void>
  isLoading: boolean
  historicalDeallinks: any[]
  onSelectDeallink: (deallink: any) => void
}

export function DealLinkForm({
  onSubmit,
  isLoading,
  historicalDeallinks,
  onSelectDeallink,
}: DealLinkFormProps) {
  const [formData, setFormData] = useState({
    prospect_name: '',
    company_name: '',
    deal_type: 'closing',
    deal_context: '',
    deal_value: '',
  })

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const recentDeallinks = historicalDeallinks.slice(0, 5)

  return (
    <div className={styles.dealLinkFormSection}>
      <h3 className={styles.dealLinkFormTitle}>Créer un nouveau Deallink</h3>

      <form onSubmit={handleSubmit}>
        <div className={styles.dealLinkFormGroup}>
          <label htmlFor="prospect_name" className={styles.dealLinkFormLabel}>
            Prospect
          </label>
          <input
            id="prospect_name"
            type="text"
            name="prospect_name"
            className={styles.dealLinkFormInput}
            placeholder="Jean Dupont"
            value={formData.prospect_name}
            onChange={handleChange}
            disabled={isLoading}
            required
          />
        </div>

        <div className={styles.dealLinkFormGroup}>
          <label htmlFor="company_name" className={styles.dealLinkFormLabel}>
            Entreprise
          </label>
          <input
            id="company_name"
            type="text"
            name="company_name"
            className={styles.dealLinkFormInput}
            placeholder="TechFlow SAS"
            value={formData.company_name}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <div className={styles.dealLinkFormGroup}>
          <label htmlFor="deal_type" className={styles.dealLinkFormLabel}>
            Type
          </label>
          <select
            id="deal_type"
            name="deal_type"
            className={`${styles.dealLinkFormInput} ${styles.dealLinkFormSelect}`}
            value={formData.deal_type}
            onChange={handleChange}
            disabled={isLoading}
          >
            <option value="closing">Closing</option>
            <option value="prospection">Prospection</option>
            <option value="mission">Mission Freelance</option>
            <option value="partenariat">Partenariat</option>
          </select>
        </div>

        <div className={styles.dealLinkFormGroup}>
          <label htmlFor="deal_context" className={styles.dealLinkFormLabel}>
            Contexte
          </label>
          <textarea
            id="deal_context"
            name="deal_context"
            className={styles.dealLinkFormInput}
            placeholder="Décris le deal, le contexte, tes objectifs..."
            rows={4}
            value={formData.deal_context}
            onChange={handleChange}
            disabled={isLoading}
            required
            style={{ resize: 'vertical' }}
          />
        </div>

        <div className={styles.dealLinkFormGroup}>
          <label htmlFor="deal_value" className={styles.dealLinkFormLabel}>
            Montant (optionnel)
          </label>
          <input
            id="deal_value"
            type="text"
            name="deal_value"
            className={styles.dealLinkFormInput}
            placeholder="15 000"
            value={formData.deal_value}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          className={`${styles.dealLinkButton} ${styles.dealLinkButtonPrimary}`}
          disabled={isLoading || !formData.prospect_name.trim() || !formData.deal_context.trim()}
        >
          {isLoading ? 'Génération en cours...' : 'Générer'}
        </button>
      </form>

      {/* Divider */}
      <div className={styles.dealLinkDivider} />

      {/* Historique */}
      <div className={styles.dealLinkHistorySection}>
        <h4 className={styles.dealLinkHistoryTitle}>Historique</h4>

        {historicalDeallinks.length === 0 ? (
          <p style={{ color: '#9BB5AA', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>
            Aucun deallink créé pour l'instant.
          </p>
        ) : (
          <>
            {recentDeallinks.map((deallink) => (
              <div
                key={deallink.id}
                className={styles.dealLinkHistoryItem}
                onClick={() => onSelectDeallink(deallink)}
              >
                <div className={styles.dealLinkHistoryItemName}>
                  {deallink.prospect_name}
                </div>
                <div className={styles.dealLinkHistoryItemMeta}>
                  <span>{deallink.company_name}</span>
                  <span
                    className={`${styles.dealLinkHistoryItemStatus} ${
                      deallink.status === 'draft'
                        ? styles.dealbuttonStatusDraft
                        : styles.dealLinkHistoryItemStatusPublished
                    }`}
                  >
                    {deallink.status === 'draft' ? 'Brouillon' : 'Publié'}
                  </span>
                  <span>
                    {new Date(deallink.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            ))}

            {historicalDeallinks.length > 5 && (
              <p style={{ color: '#9BB5AA', fontSize: '14px', fontFamily: 'Inter, sans-serif', textAlign: 'center', marginTop: '16px' }}>
                +{historicalDeallinks.length - 5} autres deallinks
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
