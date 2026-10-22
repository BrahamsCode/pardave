# Inversiones Pardave · Corp. Farma Perú

Sistema web completo de la distribuidora **Inversiones Pardave E.I.R.L.**: tienda/catálogo
público con pedidos en línea y por WhatsApp, y panel de administración para gestionar
productos, precios, pedidos, clientes y mensajes.

El catálogo inicial (**541 productos, 14 categorías**, con sus precios por unidad, docena,
caja, cajón, tira o paquete, medidas con precio propio y fotografías) se extrajo del
*Catálogo de Productos 2026* en PDF.

## Tecnología

| Capa | Herramienta |
| --- | --- |
| Framework | **Next.js 16** (App Router, React 19, Server Components, Server Actions, Cache Components) |
| Lenguaje | TypeScript estricto |
| Estilos | Tailwind CSS v4 · tipografía Plus Jakarta Sans · íconos Lucide |
| Base de datos | **PostgreSQL** con **Prisma ORM 7** (adaptador `pg`) |
| Validación | Zod 4 (todas las entradas se validan en el servidor) |
| Autenticación | Sesión JWT firmada (jose) en cookie `httpOnly`, contraseñas con bcrypt, `proxy.ts` protege `/admin` |
| Carrito | Zustand persistido en `localStorage`; los precios siempre se recalculan en el servidor |

Rendimiento: las páginas públicas se prerenderizan y el catálogo se sirve desde caché
(`"use cache"` + `cacheTag`). Cada cambio hecho desde el panel invalida la caché al instante
(`updateTag`), así que la tienda siempre muestra los datos vigentes.

## Funcionalidades

**Tienda pública**
- Landing: hero, cifras del catálogo, 14 líneas de producto, destacados, nosotros, marcas,
  cómo comprar y llamadas a la acción a WhatsApp.
- Catálogo con búsqueda (sin importar tildes), filtro por categoría y marca, orden por
  relevancia / nombre / precio y paginación.
- Ficha de producto con selector de presentación (unidad, docena, caja…) o medida, cantidad,
  tabla de medidas, productos relacionados, datos estructurados (schema.org) y SEO.
- Pedido (carrito): edición de cantidades, datos del cliente (DNI/RUC), recojo o delivery.
  Al enviarlo se registra en la base de datos con un código (`PD-00001-A1B2C3`) y se ofrece
  avisar por WhatsApp con el detalle.
- Formulario de contacto con protección anti-spam, botón flotante de WhatsApp, `sitemap.xml`
  y `robots.txt`.

**Panel de administración** (`/admin`)
- Resumen: pedidos pendientes, pedidos y ventas del mes, productos activos/agotados,
  gráfico de ventas de 14 días, más vendidos y últimos pedidos.
- Productos: búsqueda y filtros, activar/ocultar, marcar agotado o destacado con un clic,
  crear/editar con precios por unidad de venta, medidas, imagen (subida de archivo) y stock.
- Pedidos: filtros por estado, detalle, cambio de estado, costo de envío, notas internas,
  impresión y contacto directo al cliente por WhatsApp.
- Categorías, clientes (con historial de compras), mensajes de contacto.
- Configuración: datos de la empresa (correo, teléfono, **número de WhatsApp** que recibe
  los pedidos, dirección, horario), cambio de contraseña y usuarios con roles
  *Administrador* / *Personal*.
- Exportación a CSV (Excel) de productos y pedidos.

## Puesta en marcha (desarrollo)

Requisitos: Node.js 20.9+ y PostgreSQL 14+.

```bash
npm install                 # instala dependencias y genera el cliente Prisma
cp .env.example .env        # completa DATABASE_URL y SESSION_SECRET
npm run db:deploy           # crea las tablas
npm run db:seed             # carga los 541 productos, categorías, configuración y el admin
npm run dev                 # http://localhost:3000
```

Panel: <http://localhost:3000/admin> con `ADMIN_EMAIL` / `ADMIN_PASSWORD` del `.env`
(por defecto `admin@pardave.pe` / `Pardave2026!`). **Cambia la contraseña al primer ingreso**
y configura el número de WhatsApp real en *Configuración*.

El seed se puede volver a ejecutar: actualiza el catálogo sin borrar pedidos, clientes ni
usuarios.

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión de PostgreSQL |
| `SESSION_SECRET` | Clave aleatoria de 32+ caracteres para firmar sesiones (`openssl rand -base64 48`) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Usuario administrador que crea el seed |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio (para SEO y sitemap) |

## Producción

```bash
npm ci
npm run db:deploy
npm run db:seed      # solo la primera vez
npm run build        # requiere acceso a la base de datos (prerenderiza el catálogo)
npm start
```

### Render.com, plan gratuito (incluido en `render.yaml`)

1. Crea una base PostgreSQL gratuita en [Neon](https://neon.tech) (región *US East* u *Oregon*)
   y copia su *connection string* (`postgresql://…?sslmode=require`).
2. En Render: **Blueprints → New Blueprint Instance**, elige este repositorio y la rama.
3. Render pide tres valores: `DATABASE_URL` (la de Neon), `ADMIN_PASSWORD` y
   `NEXT_PUBLIC_SITE_URL` (p. ej. `https://pardave.onrender.com`). `SESSION_SECRET` se genera solo.
4. Cada despliegue ejecuta `npm ci && npm run render-build` (migraciones → seed → build) y
   arranca con `npm start`.
5. Entra a `/admin` y configura el número de WhatsApp real en *Configuración*.

El seed es seguro en cada despliegue: solo carga el catálogo si la base está vacía, así que no
pisa lo que edites en el panel (con `SEED_FORCE=1` se recarga a la fuerza). Las imágenes que se
suben desde el panel se guardan en la base de datos, así que no se necesita disco persistente.

Limitación del plan gratuito de Render: el sitio se “duerme” tras ~15 minutos sin visitas y la
primera visita después tarda unos 30–60 segundos. El plan Starter (US$7/mes) lo evita.

Otras opciones:
- **VPS / Docker** (Railway, DigitalOcean, servidor propio) o **Vercel**: funciona tal cual
  con cualquier PostgreSQL; no requiere disco porque las imágenes subidas van a la base.

## Estructura

```
prisma/
  schema.prisma          modelos: productos, precios, medidas, pedidos, clientes, usuarios…
  seed.ts                carga inicial
  data/catalog.json      catálogo extraído del PDF
public/products/         540 fotos de producto optimizadas (WebP)
src/
  proxy.ts               protección de /admin
  lib/                   acceso a datos (catalog.ts con caché), auth, utilidades
  app/(site)/            tienda: inicio, productos, pedido, contacto
  app/admin/             login y panel
  app/api/               exportación CSV e imágenes subidas
  components/            UI de tienda, panel y primitivas
```
