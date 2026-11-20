<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import BulleNoelle from '@/components/BulleNoelle.vue'
import { identifiantsGmailRequis, lancerTirage, type ResultatTirage } from '@/services/tirage'

const demanderIdentifiantsGmail = ref(true)
onMounted(async () => {
  demanderIdentifiantsGmail.value = await identifiantsGmailRequis()
})

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
    expediteur:
      !demanderIdentifiantsGmail.value || /^[^\s@]+@(gmail|googlemail)\.com$/i.test(expediteur.value.trim())
        ? undefined
        : 'Saisissez une adresse Gmail valide, par exemple prenom@gmail.com.',
    motDePasse:
      demanderIdentifiantsGmail.value && motDePasseApplication.value.trim() === ''
        ? "Saisissez le mot de passe d'application Gmail."
        : undefined,
  }
  return !erreurs.value.fichier && !erreurs.value.expediteur && !erreurs.value.motDePasse
}

async function lancer() {
  resultat.value = null
  if (!verifierChamps()) return
  enCours.value = true
  try {
    resultat.value = await lancerTirage(
      demanderIdentifiantsGmail.value
        ? {
            expediteur: expediteur.value.trim(),
            motDePasseApplication: motDePasseApplication.value,
            contenuCsv: contenuCsv.value,
          }
        : { contenuCsv: contenuCsv.value },
    )
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
  <BulleNoelle grande>
    <p>
      <strong>Salut, moi c'est Noëlle !</strong> Je t'aide à faire ton tirage de Noël. Importe tes participants :
      chacun recevra en secret le nom de la personne à gâter.
    </p>
  </BulleNoelle>

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
      <BulleNoelle id-texte="fichier-participants-aide">
        Mets ici ton fichier CSV, par exemple l’export des réponses de ton formulaire Google : une colonne « email » (ou « Adresse e-mail »), une colonne « nom » si tu en as une, puis une colonne par question.
        Il me faut au moins 3 participants !
      </BulleNoelle>
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

    <div v-if="demanderIdentifiantsGmail" class="champ" data-testid="adresse-gmail">
      <label for="adresse-gmail">Ton adresse Gmail (obligatoire)</label>
      <BulleNoelle id-texte="adresse-gmail-aide">
        C'est de cette adresse que partiront mes mails. Tu les retrouveras dans son dossier « Envoyés ».
      </BulleNoelle>
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

    <div v-if="demanderIdentifiantsGmail" class="champ" data-testid="mot-de-passe-application">
      <label for="mot-de-passe-application">Ton mot de passe d'application Gmail (obligatoire)</label>
      <BulleNoelle id-texte="mot-de-passe-application-aide">
        Ce n'est pas ton mot de passe Gmail habituel. Promis, je ne le garde jamais !
      </BulleNoelle>
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

    <details v-if="demanderIdentifiantsGmail" id="aide-mot-de-passe">
      <summary>Noëlle t'explique : comment obtenir un mot de passe d'application ?</summary>
      <ol>
        <li>Active la validation en deux étapes sur ton compte Google.</li>
        <li>Dans ton compte Google, cherche « Mots de passe des applications ».</li>
        <li>Crées-en un, nommé par exemple « Secret Santa ».</li>
        <li>Copie les 16 caractères obtenus dans le champ ci-dessus.</li>
      </ol>
    </details>

    <button type="submit" :disabled="enCours">Lancer le tirage et envoyer les mails</button>
    <p v-if="enCours" role="status">Envoi des mails en cours…</p>
  </form>
</template>
