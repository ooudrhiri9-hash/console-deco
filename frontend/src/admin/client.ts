/**
 * Talking to the API from the back office.
 *
 * The token lives in localStorage because the shop and the API sit on two
 * different domains, where a cookie set by the API would never be sent back.
 * It expires after 12h server-side; here we only decide when to show the login
 * screen again.
 */
import { apiUrl } from '@/config/api';

const KEY = 'omar.admin.token';

/** Fired when the API rejects the token, so the shell can show the login form. */
const EXPIRED = 'omar:admin-expired';

export const getToken = (): string => {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(KEY) || '';
  } catch {
    // Private browsing with storage blocked: the admin still works for one
    // page, and the login form simply comes back on the next reload.
    return '';
  }
};

export const setToken = (token: string) => {
  try {
    window.localStorage.setItem(KEY, token);
  } catch {
    /* ignore — see getToken */
  }
};

export const clearToken = () => {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};

export const onExpired = (handler: () => void) => {
  window.addEventListener(EXPIRED, handler);
  return () => window.removeEventListener(EXPIRED, handler);
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type Options = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** FormData for /uploads: sent as-is so the browser sets the boundary. */
  form?: FormData;
  /**
   * Login: no token is sent, and a 401 means "wrong password", not "session
   * expired". Without this the sign-in screen answers a mistyped password with
   * "Session expirée, reconnectez-vous." — advice that makes no sense there.
   */
  anonymous?: boolean;
};

/**
 * One request against /api/admin. Always returns parsed JSON, always throws an
 * ApiError carrying the French message the API sent — those messages are
 * written for the shop owner and are shown to them verbatim.
 */
export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const { method = 'GET', body, form, anonymous = false } = options;
  const token = anonymous ? '' : getToken();

  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(form ? {} : { 'Content-Type': 'application/json' }),
      },
      body: form ?? (body === undefined ? undefined : JSON.stringify(body)),
    });
  } catch {
    throw new ApiError("Serveur injoignable. Vérifiez que l'API est démarrée.", 0);
  }

  if (res.status === 401 && !anonymous) {
    clearToken();
    window.dispatchEvent(new Event(EXPIRED));
    throw new ApiError('Session expirée, reconnectez-vous.', 401);
  }

  const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null;

  if (res.status === 429) {
    throw new ApiError('Trop de tentatives. Patientez une minute.', 429);
  }

  if (!res.ok) {
    throw new ApiError(data?.error || `Erreur ${res.status}`, res.status);
  }
  return data as T;
}

/** Sends a photo to /api/admin/uploads and returns its public URL. */
export async function uploadPhoto(file: File, name = ''): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  if (name) form.append('name', name);
  const { url } = await api<{ url: string }>('/api/admin/uploads', { method: 'POST', form });
  return url;
}
