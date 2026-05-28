# semoasn-mono

Monorepo with:
- `apps/server`: NestJS v11
- `apps/mobile`: Expo (React Native) SDK 54

## Requirements
- Node: `24.16.0` (see `.node-version`)
- pnpm: `11.4.0` (see root `package.json#packageManager`)

## Install

```bash
pnpm install
```

## Dev

```bash
# run both (in parallel where supported by each app)
pnpm dev

# or individually
pnpm dev:server
pnpm dev:mobile
```

## Notes (pnpm v11)
- Some dependencies run postinstall scripts. Allowed builds are configured in `pnpm-workspace.yaml` under `allowBuilds`.

