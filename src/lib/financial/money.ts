const CENTS_PER_REAL = 100;

export function toCents(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new Error("Valor monetário inválido.");
  }

  return Math.round((amount + Number.EPSILON) * CENTS_PER_REAL);
}

export function fromCents(cents: number): number {
  if (!Number.isSafeInteger(cents)) {
    throw new Error("Quantidade de centavos inválida.");
  }

  return cents / CENTS_PER_REAL;
}

export function roundMoney(amount: number): number {
  return fromCents(toCents(amount));
}

export function sumMoney(amounts: Iterable<number>): number {
  let totalCents = 0;

  for (const amount of amounts) {
    totalCents += toCents(amount);
  }

  return fromCents(totalCents);
}

export function clampMoney(amount: number, minimum: number, maximum: number): number {
  if (minimum > maximum) {
    throw new Error("O mínimo não pode ser maior que o máximo.");
  }

  return roundMoney(Math.min(Math.max(amount, minimum), maximum));
}
