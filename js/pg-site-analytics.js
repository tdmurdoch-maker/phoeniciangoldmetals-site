/*! Phoenician Gold — privacy-light site analytics (ingest only; no service role). */
(function () {
  var cfg = window.__PG_SITE_ANALYTICS__ || {};
  if (!cfg.ingestUrl || !cfg.ingestKey) return;

  function vid() {
    try {
      var k = "pg_vid";
      var v = localStorage.getItem(k);
      if (!v) {
        v = (crypto.randomUUID && crypto.randomUUID()) ||
          String(Date.now()) + "-" + Math.random().toString(16).slice(2);
        localStorage.setItem(k, v);
      }
      return v;
    } catch (e) {
      return "anon";
    }
  }

  function device() {
    return /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop";
  }

  function utm() {
    var q = new URLSearchParams(location.search);
    return {
      source: q.get("utm_source") || "",
      medium: q.get("utm_medium") || "",
      campaign: q.get("utm_campaign") || ""
    };
  }

  function send(payload) {
    // fetch (not sendBeacon) so the ingest key can travel in a request header.
    fetch(cfg.ingestUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-pg-ingest-key": cfg.ingestKey
      },
      body: JSON.stringify(payload),
      keepalive: true,
      mode: "cors",
      credentials: "omit"
    }).catch(function () {});
  }

  function pageview() {
    send({
      v: 1,
      type: "pageview",
      ts: new Date().toISOString(),
      path: location.pathname + location.search,
      ref: document.referrer || "",
      utm: utm(),
      vid: vid(),
      device: device(),
      lang: navigator.language || ""
    });
  }

  function track(name, props) {
    send({
      v: 1,
      type: "event",
      ts: new Date().toISOString(),
      path: location.pathname,
      ref: document.referrer || "",
      utm: utm(),
      vid: vid(),
      name: name,
      props: props || {},
      device: device(),
      lang: navigator.language || ""
    });
  }

  window.pgTrack = track;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", pageview);
  } else {
    pageview();
  }

  document.addEventListener("click", function (ev) {
    var t = ev.target && ev.target.closest && ev.target.closest("a,button");
    if (!t) return;
    var href = (t.getAttribute("href") || "").toLowerCase();
    if (
      href.indexOf("mailto:founder@") === 0 ||
      href.indexOf("/contact") !== -1 ||
      href.indexOf("contact.html") !== -1
    ) {
      track("cta_contact");
    }
    if (href.indexOf("store") !== -1) {
      track("cta_store");
    }
  }, true);

  if (/store\.html$/i.test(location.pathname)) {
    track("store_view");
  }
})();
