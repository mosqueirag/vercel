-- Phase 4A: editable system pages. This migration is additive and is not
-- applied to staging automatically.
create table if not exists public.site_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug in ('energia', 'internet', 'fibra-optica', 'telefonia', 'sepelio', 'tramites', 'cortes-programados', 'medios-de-pago', 'centro-de-ayuda', 'institucional', 'contacto', 'privacidad')),
  eyebrow text not null check (length(btrim(eyebrow)) between 2 and 120),
  title text not null check (length(btrim(title)) between 2 and 180),
  intro text not null check (length(btrim(intro)) between 2 and 1200),
  image_url text,
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  status text not null default 'draft' check (status in ('draft', 'published')),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_pages_public_idx on public.site_pages (slug, status, sort_order);
alter table public.site_pages enable row level security;
revoke all on public.site_pages from anon, authenticated;
grant select on public.site_pages to anon, authenticated;
grant all on public.site_pages to service_role;

create policy "published site pages are public" on public.site_pages
for select to anon, authenticated using (status = 'published');
create policy "news admins manage site pages" on public.site_pages
for all to authenticated using ((select private.is_news_admin())) with check ((select private.is_news_admin()));

create trigger site_pages_updated_at before update on public.site_pages
for each row execute function public.set_platform_updated_at();

insert into public.site_pages (slug, eyebrow, title, intro, items, status, sort_order)
values
  ('energia','Energía eléctrica','Energía para la comunidad','Accedé a guardias, trámites y orientación sobre el suministro eléctrico.', '[{"title":"Simulador de consumo","text":"Estimá cuántos kWh consumen los artefactos de tu hogar.","href":"/simulador-energia"},{"title":"Falta de energía","text":"Guardia 24 horas: 297 436-4961.","href":"tel:+542974364961"},{"title":"Cortes programados","text":"Consultá únicamente alertas confirmadas.","href":"/cortes-programados"},{"title":"Nueva conexión","text":"Iniciá una consulta sobre requisitos y factibilidad.","href":"/tramites"},{"title":"Facturas","text":"Consultá deuda y comprobantes en Oficina Virtual.","href":"https://www.cooponlineweb.com.ar/SARMIENTO/Login"}]'::jsonb,'draft',10),
  ('internet','Conectividad','Internet para cada necesidad','Planes, soporte y solicitudes de cobertura con atención local.', '[{"title":"Contratar internet","text":"Usá el recomendador y solicitá contacto.","href":"/#internet"},{"title":"Consultar cobertura","text":"La disponibilidad requiere evaluación técnica.","href":"/#contratar"},{"title":"Soporte","text":"Comunicaciones: 297 464-1110.","href":"tel:+542974641110"},{"title":"Fibra óptica","text":"Conocé la tecnología y pedí una evaluación.","href":"/fibra-optica"}]'::jsonb,'draft',20),
  ('fibra-optica','Fibra óptica','Conectividad de nueva generación','Consultá disponibilidad de FTTH para tu hogar, comercio o empresa.', '[{"title":"Cobertura","text":"Pendiente de evaluación técnica por zona.","href":"/#contratar"},{"title":"Planes","text":"Velocidades y precios pendientes de confirmación.","href":"/#internet"},{"title":"Solicitud","text":"Registrá tus datos para recibir asesoramiento.","href":"/#contratar"},{"title":"Soporte","text":"Canal técnico: 297 464-1110.","href":"tel:+542974641110"}]'::jsonb,'draft',30),
  ('telefonia','Telefonía','Comunicación y soporte local','Información sobre telefonía fija, gestiones y asistencia técnica.', '[{"title":"Asistencia técnica","text":"Canal: 297 464-1110.","href":"tel:+542974641110"},{"title":"Alta o baja","text":"Consultá requisitos con un operador.","href":"/contacto"},{"title":"Cambio de titularidad","text":"Iniciá la orientación del trámite.","href":"/tramites"},{"title":"Información","text":"Las condiciones están pendientes de carga oficial.","href":"/centro-de-ayuda"}]'::jsonb,'draft',40),
  ('sepelio','Servicio solidario','Acompañamiento cuando más se necesita','Orientación y guardias del Servicio Solidario de Sepelios.', '[{"title":"Guardia","text":"297 624-1614 / 297 624-1615","href":"tel:+542976241614"},{"title":"Grupo familiar","text":"Mantené actualizada la nómina declarada.","href":"/contacto"},{"title":"Cobertura","text":"Solicitá información oficial sobre condiciones.","href":"/contacto"},{"title":"Acompañamiento","text":"Atención y orientación ante una necesidad.","href":"/contacto"}]'::jsonb,'draft',50),
  ('tramites','Autoservicio','Trámites y gestiones','Encontrá el canal correcto sin conocer previamente la sección.', '[{"title":"Cambio de titularidad","text":"Consultá documentación antes de iniciar.","href":"/#asistente"},{"title":"Nueva conexión","text":"Solicitá orientación y evaluación.","href":"/#asistente"},{"title":"Reconexión","text":"Conocé los pasos según tu situación.","href":"/#asistente"},{"title":"Actualizar datos","text":"Ingresá a la Oficina Virtual o pedí ayuda.","href":"https://www.cooponlineweb.com.ar/SARMIENTO/Login"}]'::jsonb,'draft',60),
  ('cortes-programados','Estado de servicios','Cortes y alertas operativas','No existen alertas confirmadas cargadas en este momento. Ante una urgencia usá la guardia correspondiente.', '[{"title":"Energía","text":"Guardia: 297 436-4961.","href":"tel:+542974364961"},{"title":"Internet","text":"Soporte: 297 464-1110.","href":"tel:+542974641110"},{"title":"Información oficial","text":"Las novedades aparecerán aquí cuando sean publicadas.","href":"/noticias"},{"title":"Asistente","text":"Describí tu problema para recibir orientación.","href":"/#asistente"}]'::jsonb,'draft',70),
  ('medios-de-pago','Facturas','Facturas y medios de pago','Accedé a los canales digitales disponibles. Verificá siempre que estés en el sitio oficial.', '[{"title":"Oficina Virtual","text":"Consultá y descargá facturas.","href":"https://www.cooponlineweb.com.ar/SARMIENTO/Login"},{"title":"Consultar deuda","text":"Ingresá con tus credenciales en el canal oficial.","href":"https://www.cooponlineweb.com.ar/SARMIENTO/Login"},{"title":"Débito automático","text":"Consultá disponibilidad y condiciones.","href":"/#asistente"},{"title":"Seguridad","text":"Nunca compartas contraseñas ni códigos.","href":"/privacidad"}]'::jsonb,'draft',80),
  ('centro-de-ayuda','Ayuda','Centro de ayuda COOPSAR','Respuestas y accesos oficiales para resolver consultas frecuentes.', '[{"title":"Asistente inteligente","text":"Escribí qué necesitás con tus palabras.","href":"/#asistente"},{"title":"Trámites","text":"Explorá gestiones frecuentes.","href":"/tramites"},{"title":"Internet","text":"Consultá planes y cobertura.","href":"/internet"},{"title":"Hablar con una persona","text":"+54 9 2975 37-6656","href":"https://wa.me/5492975376656"}]'::jsonb,'draft',90),
  ('institucional','Nuestra cooperativa','COOPSAR, cerca de la comunidad','Servicios esenciales con compromiso cooperativo y atención local en Sarmiento.', '[{"title":"Servicios","text":"Energía, conectividad, telefonía y sepelio.","href":"/"},{"title":"Atención","text":"Lunes a viernes · 8:00 a 15:00","href":"/contacto"},{"title":"Domicilio","text":"Roca 663 · Sarmiento, Chubut","href":"/contacto"},{"title":"Noticias","text":"Información institucional y operativa.","href":"/noticias"}]'::jsonb,'draft',100),
  ('contacto','Atención','Contactate con COOPSAR','Elegí el canal adecuado para tu consulta y evitá compartir información sensible.', '[{"title":"WhatsApp comercial","text":"+54 9 2975 37-6656","href":"https://wa.me/5492975376656"},{"title":"Energía","text":"297 436-4961","href":"tel:+542974364961"},{"title":"Internet y telefonía","text":"297 464-1110","href":"tel:+542974641110"},{"title":"Sepelio","text":"297 624-1614 / 297 624-1615","href":"tel:+542976241614"}]'::jsonb,'draft',110),
  ('privacidad','Privacidad','Uso responsable de tus datos','COOPSAR solicita únicamente la información necesaria para responder consultas y prestar servicios.', '[{"title":"Asistente","text":"No compartas contraseñas, datos bancarios ni información sensible.","href":"/#asistente"},{"title":"Solicitudes","text":"Los datos comerciales se usan para gestionar tu pedido.","href":"/internet"},{"title":"Analítica","text":"Se priorizan métricas anónimas y agregadas.","href":"/"},{"title":"Derechos","text":"Contactá a COOPSAR para consultar sobre tus datos.","href":"/contacto"}]'::jsonb,'draft',120)
on conflict (slug) do nothing;

comment on table public.site_pages is 'Editable public system pages. Draft rows are never returned to public visitors.';
