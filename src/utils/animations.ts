export function playResetAnimation(button: HTMLButtonElement) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const icon = button.querySelector('svg')
  if (!icon) return

  icon.animate(
    [
      { transform: 'rotate(0deg) scale(1)', filter: 'brightness(1)' },
      { offset: 0.45, transform: 'rotate(-220deg) scale(.78)', filter: 'brightness(1.8)' },
      { offset: 0.75, transform: 'rotate(-330deg) scale(1.1)', filter: 'brightness(1.35)' },
      { transform: 'rotate(-360deg) scale(1)', filter: 'brightness(1)' },
    ],
    { duration: 620, easing: 'cubic-bezier(.2,.8,.25,1)' },
  )
}
