# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev      # Start Vite dev server with HMR
npm run build    # TypeScript compile + Vite production build
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

## Architecture Overview

This is a React + TypeScript + Vite application for editing character cards used in AI roleplay applications. It supports three specification versions (V1, V2, V3) of the "Tavern Card" format.

### Core Data Flow

- **EditorCardData** (`src/utils/types.ts`) - Unified internal state containing all possible fields from V1-V3 specs. The editor always works with this format internally.
- **Conversion functions** in `types.ts` handle transforming between EditorCardData and spec-specific formats (TavernCardV1/V2/V3).
- **PNG embedding** (`src/utils/pngUtils.ts`) - Character data is stored in PNG tEXt chunks:
  - V1/V2: `chara` keyword with base64-encoded JSON
  - V3: `ccv3` keyword with base64-encoded JSON

### Component Structure

- **CardEditor** (`src/components/CardEditor.tsx`) - Main orchestrator component managing state, localStorage persistence, import/export
- Section components receive `data`, `version`, and `onChange` props:
  - BasicInfoSection - Name, description, personality, scenario
  - MessagesSection - First message, alternate greetings, example messages
  - SystemSection - System prompt, post-history instructions
  - MetadataSection - Creator info, tags, version
  - CharacterBookEditor - Lorebook entries (V2+)
  - AssetsEditor - Character assets (V3 only)

### Key Libraries

- `png-chunks-extract/encode` and `png-chunk-text` - PNG tEXt chunk manipulation for character data storage
- Tailwind CSS v4 for styling

## Code Style

- External imports first, then local imports grouped separately
- React 19 with functional components and hooks
