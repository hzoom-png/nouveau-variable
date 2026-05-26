'use client'

import { useState } from 'react'

interface Interaction {
  id: string
  type: 'like' | 'suggestion' | 'collaboration'
  suggestion_content?: string
  suggestion_type?: string
  collab_domain?: string
  collab_message?: string
  collab_status?: string
  created_at: string
}

interface ProjectInteractionsPanelProps {
  projectId: string
  currentUserId: string
  projectOwnerId: string
  likeCount: number
  interactions: Interaction[]
  onLike: (projectId: string) => Promise<void>
  onSuggest: (projectId: string, content: string, type: string) => Promise<void>
  onCollaborate: (projectId: string, data: { message: string; domain: string; availability: string }) => Promise<void>
}

export default function ProjectInteractionsPanel({
  projectId,
  currentUserId,
  projectOwnerId,
  likeCount,
  interactions,
  onLike,
  onSuggest,
  onCollaborate,
}: ProjectInteractionsPanelProps) {
  const [liking, setLiking] = useState(false)
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [suggestionContent, setSuggestionContent] = useState('')
  const [suggestionType, setSuggestionType] = useState<'improvement' | 'question' | 'issue' | 'resource'>('improvement')
  const [suggestingLoading, setSuggestingLoading] = useState(false)

  const [showCollab, setShowCollab] = useState(false)
  const [collabData, setCollabData] = useState({ message: '', domain: '', availability: 'flexible' as const })
  const [collabLoading, setCollabLoading] = useState(false)

  const isOwner = currentUserId === projectOwnerId
  const alreadyLiked = interactions.some(i => i.type === 'like')
  const userSuggestion = interactions.find(i => i.type === 'suggestion')
  const userCollab = interactions.find(i => i.type === 'collaboration')

  const handleLike = async () => {
    setLiking(true)
    try {
      await onLike(projectId)
    } catch (err) {
      console.error('Like error:', err)
    } finally {
      setLiking(false)
    }
  }

  const handleSuggest = async () => {
    if (!suggestionContent.trim()) return
    setSuggestingLoading(true)
    try {
      await onSuggest(projectId, suggestionContent, suggestionType)
      setSuggestionContent('')
      setShowSuggestion(false)
    } catch (err) {
      console.error('Suggest error:', err)
    } finally {
      setSuggestingLoading(false)
    }
  }

  const handleCollaborate = async () => {
    if (!collabData.message.trim() || !collabData.domain.trim()) return
    setCollabLoading(true)
    try {
      await onCollaborate(projectId, collabData)
      setCollabData({ message: '', domain: '', availability: 'flexible' })
      setShowCollab(false)
    } catch (err) {
      console.error('Collaborate error:', err)
    } finally {
      setCollabLoading(false)
    }
  }

  if (isOwner) return null

  return (
    <div
      style={{
        border: 'var(--border)',
        borderRadius: '8px',
        padding: '16px',
        backgroundColor: 'var(--card-bg, #fafbfc)',
      }}
    >
      <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600' }}>
        Interactions
      </h4>

      {/* Like button */}
      <button
        onClick={handleLike}
        disabled={liking || alreadyLiked}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          marginRight: '8px',
          marginBottom: '12px',
          border: `1px solid ${alreadyLiked ? 'var(--green)' : 'var(--border)'}`,
          borderRadius: '6px',
          backgroundColor: alreadyLiked ? 'var(--green)' : 'transparent',
          color: alreadyLiked ? 'white' : 'var(--text-primary)',
          cursor: liking || alreadyLiked ? 'default' : 'pointer',
          fontSize: '12px',
          fontWeight: '600',
          transition: 'all 0.2s ease',
          opacity: liking ? 0.7 : 1,
        }}
      >
        ❤️ {likeCount > 0 ? likeCount : 'Aimer'}
      </button>

      {/* Suggestion button */}
      <button
        onClick={() => setShowSuggestion(!showSuggestion)}
        disabled={userSuggestion !== undefined}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          marginRight: '8px',
          marginBottom: '12px',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          backgroundColor: 'transparent',
          color: 'var(--text-primary)',
          cursor: userSuggestion ? 'default' : 'pointer',
          fontSize: '12px',
          fontWeight: '600',
          transition: 'all 0.2s ease',
          opacity: userSuggestion ? 0.5 : 1,
        }}
      >
        💡 Suggestion
      </button>

      {/* Collaboration button */}
      <button
        onClick={() => setShowCollab(!showCollab)}
        disabled={userCollab !== undefined}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          backgroundColor: 'transparent',
          color: 'var(--text-primary)',
          cursor: userCollab ? 'default' : 'pointer',
          fontSize: '12px',
          fontWeight: '600',
          transition: 'all 0.2s ease',
          opacity: userCollab ? 0.5 : 1,
        }}
      >
        🤝 Collaborer
      </button>

      {/* Suggestion form */}
      {showSuggestion && !userSuggestion && (
        <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'white', borderRadius: '6px', border: 'var(--border)' }}>
          <textarea
            value={suggestionContent}
            onChange={e => setSuggestionContent(e.target.value)}
            placeholder="Votre suggestion..."
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '8px',
              border: 'var(--border)',
              borderRadius: '4px',
              fontFamily: 'inherit',
              fontSize: '12px',
              marginBottom: '8px',
            }}
          />
          <select
            value={suggestionType}
            onChange={e => setSuggestionType(e.target.value as any)}
            style={{
              width: '100%',
              padding: '6px',
              border: 'var(--border)',
              borderRadius: '4px',
              fontSize: '12px',
              marginBottom: '8px',
            }}
          >
            <option value="improvement">Amélioration</option>
            <option value="question">Question</option>
            <option value="issue">Problème</option>
            <option value="resource">Ressource</option>
          </select>
          <button
            onClick={handleSuggest}
            disabled={suggestingLoading || !suggestionContent.trim()}
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--green)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
            }}
          >
            {suggestingLoading ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      )}

      {/* Collaboration form */}
      {showCollab && !userCollab && (
        <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'white', borderRadius: '6px', border: 'var(--border)' }}>
          <input
            type="text"
            placeholder="Domaine de collaboration"
            value={collabData.domain}
            onChange={e => setCollabData({ ...collabData, domain: e.target.value })}
            style={{
              width: '100%',
              padding: '8px',
              border: 'var(--border)',
              borderRadius: '4px',
              fontSize: '12px',
              marginBottom: '8px',
            }}
          />
          <textarea
            value={collabData.message}
            onChange={e => setCollabData({ ...collabData, message: e.target.value })}
            placeholder="Message de collaboration..."
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '8px',
              border: 'var(--border)',
              borderRadius: '4px',
              fontFamily: 'inherit',
              fontSize: '12px',
              marginBottom: '8px',
            }}
          />
          <select
            value={collabData.availability}
            onChange={e => setCollabData({ ...collabData, availability: e.target.value as any })}
            style={{
              width: '100%',
              padding: '6px',
              border: 'var(--border)',
              borderRadius: '4px',
              fontSize: '12px',
              marginBottom: '8px',
            }}
          >
            <option value="immediate">Immédiatement</option>
            <option value="2-4weeks">2-4 semaines</option>
            <option value="flexible">Flexible</option>
          </select>
          <button
            onClick={handleCollaborate}
            disabled={collabLoading || !collabData.message.trim() || !collabData.domain.trim()}
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--green)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
            }}
          >
            {collabLoading ? 'Envoi...' : 'Proposer'}
          </button>
        </div>
      )}
    </div>
  )
}
