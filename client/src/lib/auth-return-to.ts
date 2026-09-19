export function setAuthReturnTo() {
  const returnTo = window.location.href;
  const maxAgeSeconds = 60 * 5;

  document.cookie = `auth_return_to=${encodeURIComponent(
    returnTo
  )}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;

  return returnTo;
}
