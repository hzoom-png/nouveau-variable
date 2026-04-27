export function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 2)  return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes} min`
  if (hours < 24)   return `Il y a ${hours}h`
  if (days === 1)   return 'Hier'
  if (days < 7)     return `Il y a ${days} j`
  if (days < 30)    return `Il y a ${Math.floor(days / 7)} sem`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
