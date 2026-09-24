import { notify } from './notifications';

export async function api(path, options = {}) {
  const admin = path.startsWith('/admin/');
  const binary = options.body instanceof Blob;
  const method = (options.method || 'GET').toUpperCase();
  try {
    const res = await fetch('/api' + path, {
      credentials: 'same-origin',
      ...options,
      headers: {
        'Content-Type': binary ? 'application/octet-stream' : 'application/json',
        ...options.headers,
      },
      body: binary ? options.body : options.body ? JSON.stringify(options.body) : undefined,
    });
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('The server is unavailable. Please try again.');
    }
    if (!res.ok) throw new Error(data.error || 'Request failed');
    if (admin && method !== 'GET' && path !== '/admin/uploads') {
      window.dispatchEvent(new Event('gvk:content-updated'));
      notify(method === 'DELETE' ? 'Deleted successfully.' : 'Saved successfully.', 'success');
    }
    return data;
  } catch (error) {
    if (admin && error.name !== 'AbortError')
      notify(error.message || 'Something went wrong. Please try again.', 'error');
    throw error;
  }
}
export function date(value) {
  return (
    new Date(value).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    }) + ' IST'
  );
}
export const money = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
