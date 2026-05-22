/**
 * openLink — safely opens external URLs in both Telegram Mini App and web browsers.
 *
 * In Telegram Mini App environment, `window.open()` and `<a target="_blank">` are
 * silently blocked. The correct API is `Telegram.WebApp.openLink(url)` which
 * instructs the Telegram client to open the URL in its in-app browser.
 *
 * @param {string} url - The URL to open
 */
export function openLink(url) {
  if (window.Telegram?.WebApp?.openLink) {
    window.Telegram.WebApp.openLink(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
