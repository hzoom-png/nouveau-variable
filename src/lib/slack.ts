type SlackField = { title: string; value: string; short?: boolean }

type SlackMessage = {
  title: string
  description?: string
  fields?: SlackField[]
  color?: string
  channel?: 'admin' | 'support'
}

export async function notifySlack(msg: SlackMessage): Promise<void> {
  const webhook =
    msg.channel === 'support'
      ? process.env.SLACK_WEBHOOK_SUPPORT
      : process.env.SLACK_WEBHOOK_ADMIN

  if (!webhook) return

  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [{
          color:  msg.color ?? '#36a64f',
          title:  msg.title,
          text:   msg.description,
          fields: (msg.fields ?? []).map(f => ({ title: f.title, value: f.value, short: f.short ?? true })),
          ts:     Math.floor(Date.now() / 1000),
          footer: 'Nouveau Variable',
        }],
      }),
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) console.error(`[slack] HTTP ${res.status}`)
  } catch (err) {
    console.error('[slack]', err instanceof Error ? err.message : err)
  }
}
