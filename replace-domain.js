<script>
(function () {
  var TARGET = 'https://turbonewvid.com';
  var PATTERN = /(^|\.)(turboviplay\.com|turbovidhls\.com|emturbovid\.com)$/;
  var ATTRS = ['src', 'data-src', 'data-lazy-src'];

  function fixIframe(el) {
    ATTRS.forEach(function (attr) {
      var value = el.getAttribute(attr);
      if (!value) return;
      var u;
      try { u = new URL(value, location.href); } catch (e) { return; }
      if (!PATTERN.test(u.hostname)) return;
      var t = new URL(TARGET);
      u.protocol = t.protocol;
      u.host = t.host;
      el.setAttribute(attr, u.toString());
    });
  }

  function fixAll(root) {
    if (root.tagName === 'IFRAME') fixIframe(root);
    if (root.querySelectorAll) root.querySelectorAll('iframe').forEach(fixIframe);
  }

  fixAll(document);

  new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      if (m.type === 'attributes') fixIframe(m.target);
      m.addedNodes.forEach(function (n) { if (n.nodeType === 1) fixAll(n); });
    });
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'data-src', 'data-lazy-src']
  });

  document.addEventListener('DOMContentLoaded', function () { fixAll(document); });
  window.addEventListener('load', function () { fixAll(document); });
})();
</script>
