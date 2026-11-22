/** Accepts 07XXXXXXXX, 7XXXXXXXX, 2557XXXXXXXX and +2557XXXXXXXX; returns 255XXXXXXXXX or null. */
export function normalizeTzPhone(input: string) {
  const digits = input.replace(/[\s().-]/g, '').replace(/^\+/, '');
  const local = digits.startsWith('255') ? digits.slice(3) : digits.startsWith('0') ? digits.slice(1) : digits;
  return /^[67]\d{8}$/.test(local) ? `255${local}` : null;
}

export const maskPhone = (phone: string) => phone.replace(/^(\d{5})\d+(\d{3})$/, '$1•••$2');
