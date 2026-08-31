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

## Cloudflare Pages

El proyecto queda preparado para conectarse desde **Workers & Pages → Create → Pages → Connect to Git** con estos valores:

- Repositorio: `cartoonmemwork-maker/FMK-Service`
- Rama de producción: `main`
- Framework: React (Vite)
- Comando de build: `pnpm build`
- Directorio de salida: `dist`
- Directorio raíz: `/`
- Versión de Node: `22.13.0`

`wrangler.jsonc` mantiene la configuración de Pages versionada junto con el código. No deben guardarse tokens ni secretos en el repositorio.

## Panel privado de estadísticas

El panel vive en `/estadisticas` y utiliza Pages Functions con una base D1. En el entorno de producción de Cloudflare Pages deben configurarse:

- Binding D1 `DB` conectado a `fmk-service-analytics`.
- Secreto cifrado `ANALYTICS_PASSWORD` con un mínimo de 12 caracteres.

La contraseña no debe agregarse al repositorio ni a archivos `.env` versionados.
