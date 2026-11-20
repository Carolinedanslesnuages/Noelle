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
  <h1>Noëlle — Tirage au sort du Secret Santa</h1>
  <p class="intro-noel">Importez vos participants : chacun recevra en secret le nom de la personne à gâter.</p>

  <div role="status">
    <div v-if="resultat" class="message message-succes">
      <p><strong>Tirage terminé.</strong> {{ messageResultat }}</p>
    </div>
  </div>
  <div role="alert">
    <div v-if="erreurs.general" class="message message-erreur-general">
      <p><strong>Le tirage n'a pas pu être fait.</strong> {{ erreurs.general }}</p>
    </div>
  </div>

  <p>Tous les champs sont obligatoires.</p>

  <form novalidate @submit.prevent="lancer">
    <div class="champ" data-testid="fichier-participants">
      <label for="fichier-participants">Fichier CSV des participants (obligatoire)</label>
      <span id="fichier-participants-aide" class="aide">
        Colonnes « nom » et « email », puis une colonne par question du questionnaire. Au moins 3 participants.
      </span>
      <input
        id="fichier-participants"
        type="file"
        accept=".csv,text/csv"
        required
        :aria-invalid="erreurs.fichier ? 'true' : undefined"
        :aria-describedby="erreurs.fichier ? 'fichier-participants-aide fichier-participants-erreur' : 'fichier-participants-aide'"
        @change="choisirFichier(($event.target as HTMLInputElement).files!)"
      />
      <p v-if="erreurs.fichier" id="fichier-participants-erreur" class="message-erreur" role="alert">
        {{ erreurs.fichier }}
      </p>
    </div>
    <p v-if="nomFichier">Fichier choisi : {{ nomFichier }}</p>

    <div class="champ" data-testid="adresse-gmail">
      <label for="adresse-gmail">Votre adresse Gmail (obligatoire)</label>
      <span id="adresse-gmail-aide" class="aide">
        Les mails partiront de cette adresse. Ils resteront visibles dans son dossier « Envoyés ».
      </span>
      <input
        id="adresse-gmail"
        v-model="expediteur"
        type="email"
        autocomplete="email"
        required
        :aria-invalid="erreurs.expediteur ? 'true' : undefined"
        :aria-describedby="erreurs.expediteur ? 'adresse-gmail-aide adresse-gmail-erreur' : 'adresse-gmail-aide'"
      />
      <p v-if="erreurs.expediteur" id="adresse-gmail-erreur" class="message-erreur" role="alert">
        {{ erreurs.expediteur }}
      </p>
    </div>

    <div class="champ" data-testid="mot-de-passe-application">
      <label for="mot-de-passe-application">Mot de passe d'application Gmail (obligatoire)</label>
      <span id="mot-de-passe-application-aide" class="aide">
        Ce n'est pas votre mot de passe Gmail habituel. Il n'est jamais enregistré.
      </span>
      <input
        id="mot-de-passe-application"
        v-model="motDePasseApplication"
        type="password"
        autocomplete="off"
        required
        :aria-invalid="erreurs.motDePasse ? 'true' : undefined"
        :aria-describedby="
          erreurs.motDePasse ? 'mot-de-passe-application-aide mot-de-passe-application-erreur' : 'mot-de-passe-application-aide'
        "
      />
      <p v-if="erreurs.motDePasse" id="mot-de-passe-application-erreur" class="message-erreur" role="alert">
        {{ erreurs.motDePasse }}
      </p>
    </div>

    <details id="aide-mot-de-passe">
      <summary>Comment obtenir un mot de passe d'application ?</summary>
      <ol>
        <li>Activez la validation en deux étapes sur votre compte Google.</li>
        <li>Dans votre compte Google, cherchez « Mots de passe des applications ».</li>
        <li>Créez-en un, nommé par exemple « Secret Santa ».</li>
        <li>Copiez les 16 caractères obtenus dans le champ ci-dessus.</li>
      </ol>
    </details>

    <button type="submit" :disabled="enCours">Lancer le tirage et envoyer les mails</button>
    <p v-if="enCours" role="status">Envoi des mails en cours…</p>
  </form>
</template>
