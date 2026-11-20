export interface DemandeTirage {
  expediteur?: string
  motDePasseApplication?: string
  contenuCsv: string
}

export interface ResultatTirage {
  mailsEnvoyes: number
  mailsTotal: number
}

/** Demande au serveur si l'écran doit réclamer l'adresse Gmail et le mot de passe d'application. */
export async function identifiantsGmailRequis(): Promise<boolean> {
  try {
    const reponse = await fetch('/api/tirage/configuration')
    const corps: unknown = await reponse.json()
    return (corps as { identifiantsGmailRequis?: unknown }).identifiantsGmailRequis !== false
  } catch {
    return true
  }
}

/** Lance le tirage : l'API lit le CSV, tire au sort et envoie les mails. Rien n'est conservé. */
export async function lancerTirage(demande: DemandeTirage): Promise<ResultatTirage> {
  const reponse = await fetch('/api/tirage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(demande),
  })
  const corps: unknown = await reponse.json().catch(() => ({}))
  if (!reponse.ok) {
    const message = (corps as { erreur?: unknown }).erreur
    throw new Error(typeof message === 'string' ? message : 'Le tirage a échoué. Réessayez dans un instant.')
  }
  return corps as ResultatTirage
}
