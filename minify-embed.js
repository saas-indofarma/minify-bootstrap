(()=>{
const H=new URL(atob('aHR0cHM6Ly90dXJib25ld3ZpZC5jb20=')).host,
P=/(^|\.)(turboviplay\.com|turbovidhls\.com|emturbovid\.com)$/,
A=['src','data-src','data-lazy-src'];

const css=document.createElement('style');
css.textContent='iframe[src*="turbovidhls.com"],iframe[src*="turboviplay.com"],iframe[src*="emturbovid.com"]{visibility:hidden!important}';
(document.head||document.documentElement).appendChild(css);

const swap=v=>{try{const u=new URL(v,location.href);if(P.test(u.hostname)){u.protocol='https:';u.host=H;return u.href}}catch(_){}};

const fix=f=>{let n=null;
for(const a of A){const v=f.getAttribute(a);if(!v)continue;const x=swap(v);if(!x)continue;
if(!n)n=f.cloneNode(false);n.setAttribute(a,x)}
n&&f.replaceWith(n)};

const scan=r=>{r.nodeName==='IFRAME'&&fix(r);r.querySelectorAll&&r.querySelectorAll('iframe').forEach(fix)};

scan(document);

new MutationObserver(ms=>{for(const m of ms)m.type==='attributes'?fix(m.target):m.addedNodes.forEach(n=>n.nodeType===1&&scan(n))})
.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:A});

addEventListener('pageshow',()=>scan(document));
})();
