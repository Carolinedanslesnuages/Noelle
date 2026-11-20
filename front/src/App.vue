<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <a class="lien-evitement" href="#contenu">Aller au contenu</a>
  <header class="entete">
    <p class="entete-titre"><span aria-hidden="true">🎄</span> <strong>Noëlle</strong> <span aria-hidden="true">🎁</span></p>
  </header>
  <main id="contenu" class="contenu">
    <RouterView />
  </main>
  <footer class="pied">
    <p><span aria-hidden="true">❄️</span> Noëlle — tirage au sort du Secret Santa <span aria-hidden="true">❄️</span></p>
  </footer>
</template>
