function normalizeCredentialPart(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function deriveAccountCredentials(email) {
  const emailText = String(email || '').trim().toLowerCase();
  const [localPart = ''] = emailText.split('@');
  const username = normalizeCredentialPart(localPart || 'account').slice(0, 32) || 'account';

  return deriveCredentialsFromUsername(username);
}

export function deriveCredentialsFromUsername(username) {
  const currentYear = new Date().getFullYear();
  const normalizedUsername = normalizeCredentialPart(username || 'account').slice(0, 32) || 'account';

  return {
    username: normalizedUsername,
    password: `${normalizedUsername}_${currentYear}.`,
  };
}

export function getProviderName(user) {
  const provider = user?.externalAccounts?.[0]?.provider || user?.externalAccounts?.[0]?.verification?.strategy || '';
  return String(provider).replace(/^oauth_/, '') || 'account';
}
