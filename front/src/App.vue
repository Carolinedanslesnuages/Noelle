<script setup lang="ts">
import { RouterView } from 'vue-router'

const logoText = ['République', 'Française']
</script>

<template>
  <DsfrHeader
    service-title="Noëlle"
    service-description=""
    :logo-text="logoText"
    home-to="/"
  />
  <main id="contenu" class="fr-container fr-my-6w">
    <RouterView />
  </main>
  <DsfrFooter :logo-text="logoText" />
</template>
