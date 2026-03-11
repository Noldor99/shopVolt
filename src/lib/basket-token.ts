const BASKET_TOKEN_KEY = 'basket_token_id';

function createToken() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `basket_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateBasketToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  const savedToken = localStorage.getItem(BASKET_TOKEN_KEY);
  if (savedToken) {
    return savedToken;
  }

  const newToken = createToken();
  localStorage.setItem(BASKET_TOKEN_KEY, newToken);
  return newToken;
}
