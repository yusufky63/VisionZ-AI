# VisionZ AI

VisionZ AI is an AI-powered Web3 creation and discovery platform for generating token ideas, metadata, visuals, market pages, and Zora/Base-oriented coin experiences.

The repository combines AI services, Zora tooling, Supabase-backed data, wallet connection, and trading/discovery UI modules into a single Next.js product.

## Core Capabilities

- AI-assisted token idea, description, and metadata generation.
- Image generation/processing flows through Hugging Face and Replicate-oriented services.
- Zora SDK and protocol integrations for coin creation and token pages.
- Market/discovery views for browsing generated assets and token concepts.
- Wallet connection with ConnectKit, Wagmi, Viem, and Ethers.
- Supabase-backed persistence for generated content and product state.

| Layer | Tools |
| --- | --- |
| Frontend | Next.js, React, TypeScript, Tailwind CSS, Headless UI, Heroicons, Lucide React |
| AI | Hugging Face Inference, Replicate, AI-assisted copy/image workflows |
| Web3 | Zora SDK, Zora protocol packages, Wagmi, Viem, Ethers, ConnectKit |
| Data/Infra | Supabase, React Query, Axios, Vercel Analytics |

## Repository Structure

- `src/` - app routes, components, AI services, Zora/Web3 logic, and token pages.
- `public/` - static assets and metadata.
- `next.config.js` - Next.js configuration.
- `tailwind.config.js` - styling configuration.

## Development

```bash
npm install
npm run dev
```

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start local development. |
| `npm run build` | Build for production. |
| `npm start` | Run the production server. |
| `npm run lint` | Run lint checks. |
| `npm run type-check` | Run TypeScript checks. |
| `npm run lint-watch` | Run linting in watch mode. |

## Status

- Repository: https://github.com/yusufky63/VisionZ-AI
- Live app: https://vision-z-ai.vercel.app
