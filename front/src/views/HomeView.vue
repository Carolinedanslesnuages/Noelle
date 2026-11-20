<script setup lang="ts">
import { computed, ref } from 'vue'
import { lancerTirage, type ResultatTirage } from '@/services/tirage'

const expediteur = ref('')
const motDePasseApplication = ref('')
const contenuCsv = ref('')
const nomFichier = ref('')
const erreurs = ref<{ fichier?: string; expediteur?: string; motDePasse?: string; general?: string }>({})
const enCours = ref(false)
const resultat = ref<ResultatTirage | null>(null)

const messageResultat = computed(() => {
  if (!resultat.value) return ''
  const { mailsEnvoyes, mailsTotal } = resultat.value
  return mailsEnvoyes === mailsTotal
    ? `Tirage fait, ${mailsEnvoyes} mails envoyés.`
    : `Tirage fait, ${mailsEnvoyes} mails sur ${mailsTotal} envoyés.`
})

async function choisirFichier(fichiers: FileList) {
  const fichier = fichiers[0]
  contenuCsv.value = fichier ? await fichier.text() : ''
  nomFichier.value = fichier?.name ?? ''
  erreurs.value = { ...erreurs.value, fichier: undefined }
}

function verifierChamps() {
  erreurs.value = {
    fichier: contenuCsv.value === '' ? 'Importez le fichier CSV des participants.' : undefined,
    expediteur: /^[^\s@]+@(gmail|googlemail)\.com$/i.test(expediteur.value.trim())
      ? undefined
      : 'Saisissez une adresse Gmail valide, par exemple prenom@gmail.com.',
    motDePasse:
      motDePasseApplication.value.trim() === '' ? "Saisissez le mot de passe d'application Gmail." : undefined,
  }
  return !erreurs.value.fichier && !erreurs.value.expediteur && !erreurs.value.motDePasse
}

async function lancer() {
  resultat.value = null
  if (!verifierChamps()) return
  enCours.value = true
  try {
    resultat.value = await lancerTirage({
      expediteur: expediteur.value.trim(),
      motDePasseApplication: motDePasseApplication.value,
      contenuCsv: contenuCsv.value,
    })
    erreurs.value = {}
  } catch (erreur) {
    erreurs.value = { general: erreur instanceof Error ? erreur.message : 'Le tirage a échoué.' }
  } finally {
    motDePasseApplication.value = ''
    enCours.value = false
  }
}
</script>

<template>
  <h1>Tirage au sort du Secret Santa</h1>

  <div role="status">
    <DsfrAlert v-if="resultat" type="success" title="Tirage terminé" :description="messageResultat" />
  </div>
  <div role="alert">
    <DsfrAlert v-if="erreurs.general" type="error" title="Le tirage n'a pas pu être fait" :description="erreurs.general" />
  </div>

  <p>Tous les champs sont obligatoires.</p>

  <form novalidate @submit.prevent="lancer">
    <DsfrFileUpload
      id="fichier-participants"
      label="Fichier CSV des participants (obligatoire)"
      hint="Colonnes « nom » et « email », puis une colonne par question du questionnaire. Au moins 3 participants."
      accept=".csv,text/csv"
      :error="erreurs.fichier"
      @change="choisirFichier"
    />
    <p v-if="nomFichier">Fichier choisi : {{ nomFichier }}</p>

    <DsfrInputGroup
      v-model="expediteur"
      input-group-id="adresse-gmail"
      label="Votre adresse Gmail (obligatoire)"
      hint="Les mails partiront de cette adresse. Ils resteront visibles dans son dossier « Envoyés »."
      type="email"
      autocomplete="email"
      required
      :error-message="erreurs.expediteur"
      label-visible
    />

    <DsfrInputGroup
      v-model="motDePasseApplication"
      input-group-id="mot-de-passe-application"
      label="Mot de passe d'application Gmail (obligatoire)"
      hint="Ce n'est pas votre mot de passe Gmail habituel. Il n'est jamais enregistré."
      type="password"
      autocomplete="off"
      required
      :error-message="erreurs.motDePasse"
      label-visible
    />

    <DsfrAccordionsGroup>
      <DsfrAccordion id="aide-mot-de-passe" title="Comment obtenir un mot de passe d'application ?">
        <ol>
          <li>Activez la validation en deux étapes sur votre compte Google.</li>
          <li>Dans votre compte Google, cherchez « Mots de passe des applications ».</li>
          <li>Créez-en un, nommé par exemple « Secret Santa ».</li>
          <li>Copiez les 16 caractères obtenus dans le champ ci-dessus.</li>
        </ol>
      </DsfrAccordion>
    </DsfrAccordionsGroup>

    <DsfrButton
      type="submit"
      label="Lancer le tirage et envoyer les mails"
      :disabled="enCours"
      class="fr-mt-3w"
    />
    <p v-if="enCours" role="status">Envoi des mails en cours…</p>
  </form>
</template>
