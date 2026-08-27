# FMK Service

Base técnica de la landing responsive de FMK Service.

## Desarrollo local

```bash
pnpm install
pnpm dev
```

## Verificación

```bash
pnpm check
pnpm build
```

## Cloudflare Workers

El proyecto queda preparado para conectarse desde **Workers & Pages → Create application → Import a repository** con estos valores:

- Repositorio: `cartoonmemwork-maker/FMK-Service`
- Rama de producción: `main`
- Framework: React (Vite)
- Comando de build: `pnpm build`
- Comando de deploy: `pnpm exec wrangler deploy`
- Directorio raíz: `/`
- Versión de Node: `22.13.0`

`wrangler.jsonc` mantiene la configuración de Workers Static Assets versionada junto con el código. La salida de Vite se publica desde `dist` y las rutas de la SPA vuelven a `index.html`. No deben guardarse tokens ni secretos en el repositorio.
