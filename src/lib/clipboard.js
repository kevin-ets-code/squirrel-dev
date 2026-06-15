// Copie de texte dans le presse-papier, avec repli si l'API Clipboard n'est pas
// disponible (http, vieux navigateur, permission refusée). Renvoie un booléen.
// Helper unique réutilisé partout (CopyButton, CopyEmail) — pas de copie par page.

function legacyCopy(text) {
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'absolute'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
    return legacyCopy(text)
  } catch {
    return legacyCopy(text)
  }
}
