// Cloudflare Web Analytics for docs.nomo.gg: cookieless, no personal data.
// Mintlify loads every .js file in the repo on every page.
(function () {
  if (document.querySelector("script[data-cf-beacon]")) return;
  var s = document.createElement("script");
  s.defer = true;
  s.src = "https://static.cloudflareinsights.com/beacon.min.js";
  s.setAttribute("data-cf-beacon", '{"token": "4db88618506348e2b0744fd5dbb249aa", "spa": true}');
  document.head.appendChild(s);
})();
