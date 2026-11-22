import crypto from 'crypto';

function key() {
  const secret = process.env.APP_SECRET;
  if (!secret || secret.length < 32) throw new Error('APP_SECRET must be set to at least 32 characters.');
  return crypto.createHash('sha256').update(`incnet:enc:${secret}`).digest();
}

/** AES-256-GCM. Used for payment provider keys at rest. */
export function encrypt(plain: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString('base64url')).join('.');
}

export function decrypt(value: string | null | undefined) {
  if (!value) return null;
  try {
    const [iv, tag, data] = value.split('.').map((p) => Buffer.from(p, 'base64url'));
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

export const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Short codes people can read off paper and type on a phone: no 0/O, 1/I/L. */
export function newCode(length = 8) {
  return Array.from({ length }, () => CODE_CHARS[crypto.randomInt(CODE_CHARS.length)]).join('');
}

export const newToken = (prefix: string) => `${prefix}${crypto.randomBytes(24).toString('base64url')}`;

export function slugify(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'site';
}
