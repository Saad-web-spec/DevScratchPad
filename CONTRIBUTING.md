# Contributing to DevScratchpad

Thank you for your interest in contributing to **DevScratchpad**! We welcome bug fixes, performance improvements, documentation updates, and new developer tools.

---

## 🛠️ How to Add a New Developer Tool

Adding a new tool to DevScratchpad is simple and structured:

1. **Create the Tool Logic**:
   - Add a pure client-side utility function in `src/lib/tools/<tool-name>.ts`.
   - Ensure the logic does not make any external network requests (100% client-side execution).

2. **Register the Tool Metadata**:
   - Open `src/lib/tools/registry.ts`.
   - Add a new entry to `TOOLS_REGISTRY` specifying:
     - `slug`: unique URL pathname (e.g. `jwt-decoder`)
     - `name`: Full title for SEO and display
     - `shortName`: Compact title for tabs/chips
     - `description`: Summary of capabilities
     - `howToUse`: Step-by-step instructions
     - `edgeCases`: Caveats, limits, and edge case notes

3. **Build the Tool UI Component**:
   - Create `src/components/tools/<ToolName>Tool.tsx`.
   - Follow our unified spatial design tokens:
     - Input fields: `font-mono text-base tracking-wide bg-[#121215] border border-[#27272A] text-zinc-100 focus:ring-1 focus:ring-zinc-400 rounded-lg p-3`
     - Action buttons: `h-9 px-3 bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-zinc-300 text-xs font-medium rounded-md transition-colors`
     - Copy feedback: 1.5s `Copied!` transition with green checkmark icon.

4. **Map the Component in WorkspaceShell**:
   - In `src/components/WorkspaceShell.tsx`, import your new tool component and add it to the render switch.

5. **Test Build**:
   ```bash
   npm run build
   ```
   Ensure 0 TypeScript errors and that the static route is pre-rendered cleanly.

---

## 📜 Development Guidelines

- **Zero-Server Rule**: Under no circumstances should any user payload, code, or secret be transmitted to an external server or telemetry endpoint.
- **Styling**: Use Tailwind CSS v4 with dark spatial tokens. Do not wrap utility tools inside secondary nested dark cards.
- **Code Style**: Format code cleanly and follow ESLint conventions.

---

## 🚀 Pull Request Workflow

1. Fork the repo and create your branch from `main`:
   ```bash
   git checkout -b feat/my-new-tool
   ```
2. Make and test your changes locally.
3. Commit with semantic messages:
   - `feat: add hex to ascii converter tool`
   - `fix: resolve regex catastrophic backtracking warning`
   - `docs: update readme with awesome-lists badge`
4. Push to your fork and submit a Pull Request against `main`.
