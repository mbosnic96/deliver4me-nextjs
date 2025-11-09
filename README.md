## Getting Started
1. Kreirati MongoDB bazu podataka, nazvati je deliver4me. Importovati kolkcije iz /collections

2.Kopirati .env.local poslan u mail-u.
Za pokrenuti build, jer dev server refresha stalno i compile-a svaku stranicu iznova:

```bash
npm install
npm run build
npm run start

```

Za development server:

```bash
npm install
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

za kreirati VAPID_KEY:
```bash
web-push generate-vapid-keys
```
za kreirati key za karticu i next_authsecret:

```bash
openssl rand -base64 32
```
