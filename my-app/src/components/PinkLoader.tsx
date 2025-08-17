

/**
 * PinkLoader: a sexy, satisfying loader overlay.
 * - Uses CSS variables and a custom class for the animation.
 * - API: showPinkLoader(text?), hidePinkLoader()
 */
declare global { interface Window { __pinkLoaderCount?: number } }

export function showPinkLoader(text?: string) {
  const id = 'pink-loader-overlay'
  const count = (window.__pinkLoaderCount ?? 0) + 1
  window.__pinkLoaderCount = count
  const existing = document.getElementById(id)
  if (existing) {
    const txt = existing.querySelector('.pink-loader-text')
    if (txt && text) txt.textContent = text
    return
  }
  const el = document.createElement('div')
  el.id = id
  el.className = 'pink-loader-overlay'
  el.innerHTML = `
    <div class="pink-loader-card" role="status" aria-live="polite">
      <div class="pink-spinner">
        <span class="blob a"></span>
        <span class="blob b"></span>
        <span class="blob c"></span>
        <span class="ring"></span>
      </div>
      <div class="pink-loader-text">${text || 'Working…'}</div>
    </div>
  `
  document.body.appendChild(el)
}

export function hidePinkLoader() {
  const id = 'pink-loader-overlay'
  const count = Math.max(0, (window.__pinkLoaderCount ?? 0) - 1)
  window.__pinkLoaderCount = count
  if (count > 0) return
  const el = document.getElementById(id)
  if (el) el.remove()
}

export default function PinkLoader() { return null }

