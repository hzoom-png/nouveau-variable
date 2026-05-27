export function generatePublicSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 36; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
}

export function generateCssFromConfig(config: any): string {
  const { colors = {}, fonts = {} } = config

  return `
    :root {
      --primary: ${colors.primary || '#2F5446'};
      --accent: ${colors.accent || '#C8790A'};
      --text: #0F1C17;
      --text-2: #4B6358;
      --surface: #F7FAF8;
      --border: #E4EEEA;
      --white: #ffffff;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      font-family: '${fonts.body || 'Inter'}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background-color: var(--surface);
      color: var(--text);
      line-height: 1.6;
    }

    h1, h2, h3, h4, h5, h6 {
      font-family: '${fonts.display || 'Jost'}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-weight: 900;
      line-height: 1.2;
    }

    h1 {
      font-size: clamp(2rem, 5vw, 3.5rem);
      margin-bottom: 1rem;
    }
    h2 {
      font-size: clamp(1.5rem, 4vw, 2.5rem);
      margin-bottom: 1.5rem;
    }
    h3 {
      font-size: clamp(1.25rem, 3vw, 1.75rem);
      margin-bottom: 1rem;
    }

    p {
      margin-bottom: 1rem;
      font-size: clamp(0.9rem, 2vw, 1.125rem);
    }

    a {
      color: var(--primary);
      text-decoration: none;
      transition: opacity 0.2s ease;
    }

    a:hover {
      opacity: 0.8;
    }

    button, .button {
      display: inline-block;
      padding: clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem);
      background-color: var(--primary);
      color: var(--white);
      border: none;
      border-radius: 99px;
      font-family: '${fonts.display}', sans-serif;
      font-weight: 800;
      font-size: clamp(0.875rem, 2vw, 1rem);
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    button:hover, .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(47, 84, 70, 0.2);
    }

    button:active, .button:active {
      transform: translateY(0);
    }

    img {
      max-width: 100%;
      height: auto;
      display: block;
    }

    section {
      padding: clamp(2rem, 8vw, 6rem) clamp(1rem, 5vw, 4rem);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: clamp(1.5rem, 4vw, 3rem);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    @media (max-width: 768px) {
      h1 { font-size: 1.75rem; }
      h2 { font-size: 1.25rem; }
      h3 { font-size: 1rem; }
      section { padding: 2rem 1rem; }
      .grid { grid-template-columns: 1fr; gap: 1.5rem; }
    }

    @media (max-width: 480px) {
      h1 { font-size: 1.5rem; }
      h2 { font-size: 1.1rem; }
      h3 { font-size: 0.95rem; }
      section { padding: 1.5rem 1rem; }
      button, .button { padding: 0.75rem 1.5rem; font-size: 0.9rem; }
    }
  `
}

export function getDeviceType(userAgent?: string): string {
  if (!userAgent) return 'unknown'
  if (/mobile|android|iphone|ipod/i.test(userAgent)) return 'mobile'
  if (/tablet|ipad|android/i.test(userAgent)) return 'tablet'
  return 'desktop'
}
