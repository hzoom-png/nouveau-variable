'use client'

import { useState, useCallback } from 'react'

type Meta = Record<string, unknown>

interface Options {
  endpoint: string
  onComplete: (result: unknown, meta?: Meta) => void
  onError: (message: string) => void
}

export function useStreamingAI({ endpoint, onComplete, onError }: Options) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [rawBuffer,   setRawBuffer]   = useState('')
  const [progress,    setProgress]    = useState(0)

  const generate = useCallback(async (body: Record<string, unknown>) => {
    setIsStreaming(true)
    setRawBuffer('')
    setProgress(0)

    let buffer = ''

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error || 'Erreur ' + res.status)
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()

      outer: while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue

          let parsed: Record<string, unknown>
          try { parsed = JSON.parse(raw) } catch { continue }

          if (parsed.error) throw new Error(parsed.error as string)

          if (parsed.done) {
            const jsonMatch = buffer.match(/\{[\s\S]*\}/)
            if (!jsonMatch) throw new Error('Réponse invalide')
            const result = JSON.parse(jsonMatch[0])
            const meta: Meta = {}
            for (const k of Object.keys(parsed)) {
              if (k !== 'done') meta[k] = parsed[k]
            }
            onComplete(result, meta)
            break outer
          }

          if (typeof parsed.token === 'string') {
            buffer += parsed.token
            setRawBuffer(prev => prev + (parsed.token as string))
            setProgress(Math.min(88, Math.round(buffer.length / 25)))
          }
        }
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsStreaming(false)
      setProgress(100)
    }
  }, [endpoint, onComplete, onError])

  return { generate, isStreaming, rawBuffer, progress }
}
