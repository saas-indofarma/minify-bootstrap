const PLAYER_ORIGINS_ENCODED = 'WyJodHRwczovL3R1cmJvbmV3dmlkLmNvbSJd';
const SOURCE_HOST_PATTERN = /(^|\.)(turboviplay\.com|turbovidhls\.com|emturbovid\.com)$/;
const PROBE_TIMEOUT_MS = 4000;
const STORAGE_KEY = 'player:lastWorkingOrigin';

const decodePlayerOrigins = () => {
  try {
    const origins = JSON.parse(atob(PLAYER_ORIGINS_ENCODED));
    if (!Array.isArray(origins) || origins.length === 0) {
      throw new Error('decoded value is not a non-empty array');
    }
    return origins;
  } catch (error) {
    console.error('[replace-domain] invalid PLAYER_ORIGINS_ENCODED:', error.message);
    return [];
  }
};

const PLAYER_ORIGINS = decodePlayerOrigins();

const isOriginReachable = async (origin) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    await fetch(origin + '/', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    });
    return true;
  } catch (error) {
    console.warn('[replace-domain] origin unreachable:', origin, error.message);
    return false;
  } finally {
    clearTimeout(timer);
  }
};

const readLastWorkingOrigin = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (_) {
    return null;
  }
};

const saveLastWorkingOrigin = (origin) => {
  try {
    localStorage.setItem(STORAGE_KEY, origin);
  } catch (_) {}
};

const getOriginsInPriorityOrder = () => {
  const last = readLastWorkingOrigin();
  if (!last || !PLAYER_ORIGINS.includes(last)) return PLAYER_ORIGINS;
  return [last, ...PLAYER_ORIGINS.filter((origin) => origin !== last)];
};

const findWorkingOrigin = async () => {
  for (const origin of getOriginsInPriorityOrder()) {
    if (await isOriginReachable(origin)) return origin;
  }
  return null;
};

let workingOriginPromise = null;

const getWorkingOrigin = () => {
  if (!workingOriginPromise) {
    workingOriginPromise = findWorkingOrigin().then((origin) => {
      if (origin) saveLastWorkingOrigin(origin);
      return origin;
    });
  }
  return workingOriginPromise;
};

const buildReplacedSrc = (src, origin) => {
  let url;
  try {
    url = new URL(src, location.href);
  } catch (_) {
    return null;
  }
  if (!SOURCE_HOST_PATTERN.test(url.hostname)) return null;

  const target = new URL(origin);
  if (url.host === target.host) return null;

  url.protocol = target.protocol;
  url.host = target.host;
  return url.toString();
};

const replaceIframe = (iframe, origin) => {
  const nextSrc = buildReplacedSrc(iframe.src, origin);
  if (nextSrc) iframe.src = nextSrc;
};

const replaceDomainTurbo = async () => {
  const origin = await getWorkingOrigin();
  if (!origin) {
    console.warn('[replace-domain] no player origin reachable, iframes left unchanged');
    return;
  }
  document.querySelectorAll('iframe').forEach((iframe) => replaceIframe(iframe, origin));
};

const observeNewIframes = () => {
  const observer = new MutationObserver(async (mutations) => {
    const origin = await getWorkingOrigin();
    if (!origin) return;
    for (const m of mutations) {
      if (m.type === 'attributes' && m.target.tagName === 'IFRAME') {
        replaceIframe(m.target, origin);
      }
      m.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.tagName === 'IFRAME') replaceIframe(node, origin);
        else node.querySelectorAll && node.querySelectorAll('iframe').forEach((f) => replaceIframe(f, origin));
      });
    }
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src'],
  });
};

replaceDomainTurbo();
observeNewIframes();
window.addEventListener('load', replaceDomainTurbo);
