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
  const currentYear = new Date().getFullYear();

  const username = normalizeCredentialPart(localPart || 'account').slice(0, 32) || 'account';
  const password = `${username}_${currentYear}.`;

  return { username, password };
}

export function getProviderName(user) {
  const provider = user?.externalAccounts?.[0]?.provider || user?.externalAccounts?.[0]?.verification?.strategy || '';
  return String(provider).replace(/^oauth_/, '') || 'account';
}
