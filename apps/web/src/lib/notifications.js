export function notify(message, type) {
  window.dispatchEvent(
    new CustomEvent('gvk:notification', {
      detail: { id: crypto.randomUUID(), message, type },
    }),
  );
}
