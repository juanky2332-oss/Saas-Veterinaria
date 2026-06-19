const APP = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Script embebible del widget de reservas. La clínica lo pega en su web:
 *   <script src="https://app.clinicomatic.app/widget.js" data-clinic="su-slug"></script>
 * Inyecta un iframe a /reservar/{slug} justo donde está el <script>.
 */
export function GET() {
  const js = `(function(){
  var s = document.currentScript;
  if(!s){ return; }
  var slug = s.getAttribute('data-clinic');
  if(!slug){ console.error('[Clinicomatic] Falta data-clinic en el script del widget'); return; }
  var height = s.getAttribute('data-height') || '720';
  var iframe = document.createElement('iframe');
  iframe.src = ${JSON.stringify(APP)} + '/reservar/' + encodeURIComponent(slug);
  iframe.style.width = '100%';
  iframe.style.maxWidth = '480px';
  iframe.style.height = height + 'px';
  iframe.style.border = '0';
  iframe.style.borderRadius = '18px';
  iframe.style.boxShadow = '0 12px 40px rgba(16,36,42,.12)';
  iframe.setAttribute('title', 'Reservar cita');
  iframe.setAttribute('loading', 'lazy');
  s.parentNode.insertBefore(iframe, s.nextSibling);
})();`;
  return new Response(js, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
