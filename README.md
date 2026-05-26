# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Authentication

This app uses Clerk for authentication.

Set `VITE_CLERK_PUBLISHABLE_KEY` in your local environment, then enable Google OAuth and email/password sign-in in your Clerk dashboard.

## Supabase Setup

Apply [supabase/schema.sql](supabase/schema.sql) in your Supabase SQL editor before running the app. It creates the `tasks`, `backlog`, `sessions`, and `destination` tables the client expects.

For your local env, you need `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` if you run the server functions that talk to Supabase.

For Clerk-to-Supabase auth, create a Clerk JWT template named `supabase` with the custom claims Clerk allows, such as:

```json
{
	"aud": "authenticated",
	"role": "authenticated"
}
```

Do not add `sub` manually. Clerk reserves it and will reject the template. Pass `getToken({ template: 'supabase' })` to Supabase requests, and Clerk will still include the user subject in the token.

An example environment file is available at `.env.example`.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
