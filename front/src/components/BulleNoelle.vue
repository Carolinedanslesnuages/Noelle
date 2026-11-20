<script setup lang="ts">
import LutineNoelle from './LutineNoelle.vue'

withDefaults(defineProps<{ idTexte?: string; grande?: boolean }>(), { idTexte: undefined, grande: false })
</script>

<template>
  <div class="bulle-noelle" :class="{ 'bulle-noelle-grande': grande }">
    <LutineNoelle :taille="grande ? 96 : 52" />
    <div :id="idTexte" class="bulle-noelle-texte">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.bulle-noelle {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin: 0.4rem 0 0.6rem;
}
.bulle-noelle-grande {
  margin: 0.5rem 0 1.5rem;
}
.bulle-noelle-texte {
  position: relative;
  flex: 1;
  padding: 0.6rem 0.9rem;
  background: #ffffff;
  border: 2px solid var(--vert-noel);
  border-radius: 1rem;
  font-size: 0.9rem;
}
.bulle-noelle-grande .bulle-noelle-texte {
  padding: 0.9rem 1.1rem;
  font-size: 1.05rem;
}
.bulle-noelle-texte::before {
  content: '';
  position: absolute;
  top: 50%;
  left: -0.55rem;
  width: 0.8rem;
  height: 0.8rem;
  background: #ffffff;
  border-bottom: 2px solid var(--vert-noel);
  border-left: 2px solid var(--vert-noel);
  transform: translateY(-50%) rotate(45deg);
}
.bulle-noelle-texte :deep(p) {
  margin: 0;
}
</style>
