<script setup lang="ts">
// Noëlle en pied (robe de lutine, bras) : elle fête la fin du tirage. Dessin purement décoratif :
// l'information est dans le message, jamais ici. Les mouvements sont en CSS (voir styles.css) et s'arrêtent d'eux-mêmes.
withDefaults(defineProps<{ largeur?: number }>(), { largeur: 130 })
</script>

<template>
  <svg
    class="lutine-en-pied"
    viewBox="0 0 120 250"
    :width="largeur"
    :height="Math.round((largeur * 250) / 120)"
    aria-hidden="true"
    focusable="false"
  >
      <defs>
      <pattern id="rayures-lutine" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="4" fill="#ffffff"/>
      <rect y="4" width="8" height="4" fill="#166534"/>
      </pattern>
      </defs>
      <!-- jambes en collants rayés + chaussons -->
      <rect x="43" y="186" width="13" height="46" rx="4" fill="url(#rayures-lutine)"/>
      <rect x="64" y="186" width="13" height="46" rx="4" fill="url(#rayures-lutine)"/>
      <g transform="translate(60 0) scale(1 1) translate(-60 0)">
      <path d="M58 229 L58 241 Q44 246 30 241 Q25 233 33 225 Q38 233 47 232 Z" fill="#166534"/>
      <path d="M58 237 Q44 242 31 238" stroke="#f2c14e" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="33" cy="224" r="3.4" fill="#f2c14e"/>
      </g>
      <g transform="translate(60 0) scale(-1 1) translate(-60 0)">
      <path d="M58 229 L58 241 Q44 246 30 241 Q25 233 33 225 Q38 233 47 232 Z" fill="#166534"/>
      <path d="M58 237 Q44 242 31 238" stroke="#f2c14e" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="33" cy="224" r="3.4" fill="#f2c14e"/>
      </g>
      <g id="coupG">
      <circle cx="20" cy="92" r="11" fill="#7a3b1d"/>
      <rect x="28" y="84" width="10" height="6" rx="3" fill="#a3201a" transform="rotate(-20 33 87)"/>
      </g>
      <g id="coupD">
      <circle cx="100" cy="92" r="11" fill="#7a3b1d"/>
      <rect x="82" y="84" width="10" height="6" rx="3" fill="#a3201a" transform="rotate(20 87 87)"/>
      </g>
      <circle cx="60" cy="70" r="36" fill="#7a3b1d"/>
      <path d="M30 74 L10 62 L32 62 Z" fill="#f7d3b0"/>
      <path d="M90 74 L110 62 L88 62 Z" fill="#f7d3b0"/>
      <!-- cou -->
      <rect x="53" y="102" width="14" height="18" rx="5" fill="#f7d3b0"/>
      <!-- robe de lutine : évasée, ceinture dorée, bordure de fourrure -->
      <path d="M40 116 Q60 109 80 116 L85 142 Q98 168 105 192 Q60 202 15 192 Q22 168 35 142 Z" fill="#a3201a"/>
      <path d="M40 116 Q60 109 80 116 L82 128 Q60 122 38 128 Z" fill="#c8352c"/>
      <path d="M44 114 Q60 125 76 114 Q60 108 44 114 Z" fill="#ffffff"/>
      <rect x="35" y="140" width="50" height="9" rx="3" fill="#f2c14e"/>
      <rect x="54" y="138" width="12" height="13" rx="3" fill="#fff3c4" stroke="#d9a62a" stroke-width="1.4"/>
      <circle cx="60" cy="160" r="2.6" fill="#f2c14e"/>
      <circle cx="60" cy="172" r="2.6" fill="#f2c14e"/>
      <g fill="#ffffff">
      <rect x="13" y="187" width="94" height="11" rx="5.5"/>
      <circle cx="20" cy="193" r="6.2"/>
      <circle cx="33" cy="193" r="6.2"/>
      <circle cx="46" cy="193" r="6.2"/>
      <circle cx="59" cy="193" r="6.2"/>
      <circle cx="72" cy="193" r="6.2"/>
      <circle cx="85" cy="193" r="6.2"/>
      <circle cx="98" cy="193" r="6.2"/>
      </g>
      <g fill="#166534">
      <path d="M26 176 l4 -7 l4 7 z"/>
      <path d="M52 180 l4 -7 l4 7 z"/>
      <path d="M78 176 l4 -7 l4 7 z"/>
      </g>
      <g transform="translate(40 122)">
      <g class="lutine-bras lutine-bras-gauche">
      <path d="M-7 -4 Q0 -8 7 -4 L8 26 Q0 31 -8 26 Z" fill="#a3201a"/>
      <rect x="-9" y="24" width="18" height="9" rx="4.5" fill="#ffffff"/>
      <circle cx="0" cy="38" r="6.5" fill="#f7d3b0"/>
      </g>
      </g>
      <g transform="translate(80 122)">
      <g class="lutine-bras lutine-bras-droit">
      <path d="M-7 -4 Q0 -8 7 -4 L8 26 Q0 31 -8 26 Z" fill="#a3201a"/>
      <rect x="-9" y="24" width="18" height="9" rx="4.5" fill="#ffffff"/>
      <circle cx="0" cy="38" r="6.5" fill="#f7d3b0"/>
      </g>
      </g>
      <ellipse cx="60" cy="78" rx="29" ry="30" fill="#f7d3b0"/>
      <path d="M31 66 Q40 48 60 52 Q80 48 89 66 Q74 56 60 60 Q46 56 31 66 Z" fill="#7a3b1d"/>
      <g id="chapeau">
      <path d="M32 46 Q38 8 80 8 Q104 8 100 32 Q92 18 78 24 Q80 36 88 46 Z" fill="#166534"/>
      <rect x="28" y="42" width="64" height="12" rx="6" fill="#ffffff"/>
      <circle cx="100" cy="32" r="7" fill="#f2c14e"/>
      </g>
      <circle cx="48" cy="78" r="3.6" fill="#1c2b25"/>
      <circle cx="72" cy="78" r="3.6" fill="#1c2b25"/>
      <path d="M42 73 L38 70 M45 71 L43 67 M78 73 L82 70 M75 71 L77 67" stroke="#1c2b25" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="40" cy="89" r="5" fill="#f4a6a0" opacity="0.75"/>
      <circle cx="80" cy="89" r="5" fill="#f4a6a0" opacity="0.75"/>
      <path d="M51 91 Q60 100 69 91" fill="none" stroke="#a3201a" stroke-width="3" stroke-linecap="round"/>
  </svg>
</template>
