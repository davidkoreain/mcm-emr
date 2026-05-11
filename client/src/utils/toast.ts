let current: HTMLDivElement | null = null;

export function toast(
  message: string,
  type: 'success' | 'info' | 'warning' = 'info'
) {
  if (current) current.remove();

  const colors = {
    success: '#10b981',
    info: '#3b82f6',
    warning: '#f59e0b',
  };

  const el = document.createElement('div');
  el.style.cssText = `
    position:fixed; bottom:1.5rem; right:1.5rem; z-index:99999;
    background:${colors[type]}; color:white;
    padding:0.75rem 1.25rem; border-radius:0.6rem;
    font-size:0.88rem; font-weight:500;
    box-shadow:0 8px 24px rgba(0,0,0,0.18);
    max-width:320px; line-height:1.4;
    animation:toastIn 0.25s ease;
  `;
  el.textContent = message;

  const style = document.createElement('style');
  style.textContent = `@keyframes toastIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
  document.head.appendChild(style);
  document.body.appendChild(el);
  current = el;

  setTimeout(() => { el.remove(); current = null; }, 3000);
}
