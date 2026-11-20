<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <a class="lien-evitement" href="#contenu">Aller au contenu</a>
  <header class="entete">
    <p><strong>Noëlle</strong></p>
  </header>
  <main id="contenu" class="contenu">
    <RouterView />
  </main>
  <footer class="pied">
    <p>Noëlle — tirage au sort du Secret Santa</p>
  </footer>
</template>
