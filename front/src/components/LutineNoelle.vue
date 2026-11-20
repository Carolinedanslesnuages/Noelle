<script setup lang="ts">
withDefaults(defineProps<{ taille?: number }>(), { taille: 96 })
</script>

<template>
  <svg
    class="lutine-dessin"
    viewBox="0 0 120 130"
    :width="taille"
    :height="Math.round((taille * 130) / 120)"
    aria-hidden="true"
    focusable="false"
  >
    <!-- couettes -->
    <circle cx="20" cy="92" r="11" fill="#7a3b1d" />
    <circle cx="100" cy="92" r="11" fill="#7a3b1d" />
    <!-- cheveux derrière la tête -->
    <circle cx="60" cy="70" r="36" fill="#7a3b1d" />
    <!-- oreilles pointues -->
    <path d="M30 74 L10 62 L32 62 Z" fill="#f7d3b0" />
    <path d="M90 74 L110 62 L88 62 Z" fill="#f7d3b0" />
    <!-- col -->
    <path d="M32 126 Q60 106 88 126 L92 130 L28 130 Z" fill="#a3201a" />
    <path d="M48 114 L60 126 L72 114 Z" fill="#ffffff" />
    <!-- visage -->
    <ellipse cx="60" cy="78" rx="29" ry="30" fill="#f7d3b0" />
    <!-- frange -->
    <path d="M31 66 Q40 48 60 52 Q80 48 89 66 Q74 56 60 60 Q46 56 31 66 Z" fill="#7a3b1d" />
    <!-- bonnet : bord posé sur le front, pointe qui retombe -->
    <path d="M32 46 Q38 8 80 8 Q104 8 100 32 Q92 18 78 24 Q80 36 88 46 Z" fill="#166534" />
    <rect x="28" y="42" width="64" height="12" rx="6" fill="#ffffff" />
    <circle cx="100" cy="32" r="7" fill="#f2c14e" />
    <!-- rubans des couettes -->
    <rect x="28" y="84" width="10" height="6" rx="3" fill="#a3201a" transform="rotate(-20 33 87)" />
    <rect x="82" y="84" width="10" height="6" rx="3" fill="#a3201a" transform="rotate(20 87 87)" />
    <!-- yeux et cils -->
    <circle cx="48" cy="78" r="3.6" fill="#1c2b25" />
    <circle cx="72" cy="78" r="3.6" fill="#1c2b25" />
    <path d="M42 73 L38 70 M45 71 L43 67 M78 73 L82 70 M75 71 L77 67" stroke="#1c2b25" stroke-width="1.6" stroke-linecap="round" />
    <!-- joues et sourire -->
    <circle cx="40" cy="89" r="5" fill="#f4a6a0" opacity="0.75" />
    <circle cx="80" cy="89" r="5" fill="#f4a6a0" opacity="0.75" />
    <path d="M51 91 Q60 100 69 91" fill="none" stroke="#a3201a" stroke-width="3" stroke-linecap="round" />
  </svg>
</template>
