<template>
  <section class="lutine" aria-label="Message de Noëlle">
    <svg class="lutine-dessin" viewBox="0 0 120 130" width="96" height="104" aria-hidden="true" focusable="false">
      <path d="M22 62 L4 52 L26 48 Z" fill="#f7d3b0" />
      <path d="M98 62 L116 52 L94 48 Z" fill="#f7d3b0" />
      <path d="M30 118 Q60 100 90 118 L96 130 L24 130 Z" fill="#a3201a" />
      <path d="M48 112 L60 124 L72 112 Z" fill="#ffffff" />
      <circle cx="60" cy="72" r="34" fill="#f7d3b0" />
      <path d="M22 56 Q60 8 98 56 Q60 42 22 56 Z" fill="#166534" />
      <path d="M60 6 Q80 -2 92 20 Q78 14 66 22 Z" fill="#166534" />
      <rect x="22" y="52" width="76" height="12" rx="6" fill="#ffffff" />
      <circle cx="94" cy="18" r="7" fill="#f2c14e" />
      <circle cx="47" cy="76" r="4" fill="#1c2b25" />
      <circle cx="73" cy="76" r="4" fill="#1c2b25" />
      <circle cx="40" cy="88" r="6" fill="#f4a6a0" opacity="0.7" />
      <circle cx="80" cy="88" r="6" fill="#f4a6a0" opacity="0.7" />
      <path d="M48 90 Q60 102 72 90" fill="none" stroke="#a3201a" stroke-width="3" stroke-linecap="round" />
    </svg>
    <p class="lutine-bulle">
      <strong>Salut, moi c'est Noëlle !</strong> Je t'aide à faire ton tirage de Noël.
    </p>
  </section>
</template>

<style scoped>
.lutine {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 0.5rem 0 1.5rem;
}
.lutine-dessin {
  flex: none;
}
.lutine-bulle {
  position: relative;
  margin: 0;
  padding: 0.9rem 1.1rem;
  background: #ffffff;
  border: 2px solid var(--vert-noel);
  border-radius: 1rem;
  font-size: 1.05rem;
}
.lutine-bulle::before {
  content: '';
  position: absolute;
  top: 50%;
  left: -0.6rem;
  width: 0.9rem;
  height: 0.9rem;
  background: #ffffff;
  border-bottom: 2px solid var(--vert-noel);
  border-left: 2px solid var(--vert-noel);
  transform: translateY(-50%) rotate(45deg);
}
</style>
