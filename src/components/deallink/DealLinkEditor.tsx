'use client'

import { useState } from 'react'
import styles from './DealLinkModal.module.css'

interface DealLinkEditorProps {
  deallink: any
  onPublish: () => Promise<void>
  onBack: () => void
  isPublishing: boolean
}

export function DealLinkEditor({
  deallink,
  onPublish,
  onBack,
  isPublishing,
}: DealLinkEditorProps) {
  const [primaryColor, setPrimaryColor] = useState(
    deallink.config?.colors?.primary || '#2F5446'
  )
  const [accentColor, setAccentColor] = useState(
    deallink.config?.colors?.accent || '#C8790A'
  )
  const [previewMode, setPreviewMode] = useState<'mobile' | 'tablet' | 'desktop'>(
    'desktop'
  )

  const getPreviewWidth = () => {
    if (previewMode === 'mobile') return '375px'
    if (previewMode === 'tablet') return '768px'
    return '100%'
  }

  const html = deallink.html_rendered || ''
  const css = deallink.css_rendered || ''

  const iframeContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${css}
</head>
<body>
${html}
</body>
</html>`

  return (
    <div className={styles.dealLinkEditorWrapper}>
      {/* Left: Color Controls */}
      <div className={styles.dealLinkEditorLeft}>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px', color: '#4B6358', fontFamily: 'Inter, sans-serif', margin: '0 0 4px 0' }}>
            {deallink.prospect_name}
          </p>
          <p style={{ fontSize: '13px', color: '#9BB5AA', margin: 0, fontFamily: 'Inter, sans-serif' }}>
            {deallink.company_name}
          </p>
        </div>

        <div className={styles.dealLinkColorGroup}>
          <label className={styles.dealLinkColorLabel}>Couleur Primaire</label>
          <div className={styles.dealLinkColorInputs}>
            <input
              type="color"
              className={styles.dealLinkColorPickerInput}
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              disabled={isPublishing}
            />
            <input
              type="text"
              className={styles.dealLinkColorHexInput}
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#000000"
              disabled={isPublishing}
            />
          </div>
        </div>

        <div className={styles.dealLinkColorGroup}>
          <label className={styles.dealLinkColorLabel}>Couleur Accent</label>
          <div className={styles.dealLinkColorInputs}>
            <input
              type="color"
              className={styles.dealLinkColorPickerInput}
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              disabled={isPublishing}
            />
            <input
              type="text"
              className={styles.dealLinkColorHexInput}
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              placeholder="#000000"
              disabled={isPublishing}
            />
          </div>
        </div>

        <button
          onClick={onPublish}
          className={`${styles.dealLinkButton} ${styles.dealLinkButtonPrimary}`}
          disabled={isPublishing}
        >
          {isPublishing ? 'Publication...' : 'Publier et Partager'}
        </button>

        <button
          onClick={onBack}
          className={`${styles.dealLinkButton} ${styles.dealLinkButtonSecondary}`}
          disabled={isPublishing}
        >
          Retour à la liste
        </button>
      </div>

      {/* Right: Preview */}
      <div className={styles.dealLinkEditorRight}>
        <div className={styles.dealLinkPreviewControls}>
          <button
            onClick={() => setPreviewMode('mobile')}
            className={`${styles.dealLinkPreviewControlButton} ${
              previewMode === 'mobile' ? styles.active : ''
            }`}
          >
            Mobile
          </button>
          <button
            onClick={() => setPreviewMode('tablet')}
            className={`${styles.dealLinkPreviewControlButton} ${
              previewMode === 'tablet' ? styles.active : ''
            }`}
          >
            Tablet
          </button>
          <button
            onClick={() => setPreviewMode('desktop')}
            className={`${styles.dealLinkPreviewControlButton} ${
              previewMode === 'desktop' ? styles.active : ''
            }`}
          >
            Bureau
          </button>
        </div>

        <iframe
          srcDoc={iframeContent}
          style={{
            border: '1px solid #E4EEEA',
            borderRadius: '8px',
            width: getPreviewWidth(),
            height: '100%',
            minHeight: '500px',
            maxHeight: '100%',
          }}
          title="Aperçu"
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  )
}
