# 🎬 DevScratchpad AI Skill Studio — Higgsfield Video Production Guide

This package contains the exact assets, motion prompts, voiceover scripts, and timeline blueprint to create a viral promotional video for **[devscratchpad.tech/ai-skill-studio](https://www.devscratchpad.tech/ai-skill-studio)** with a feature showcase of the 28 offline developer tools.

---

## 📁 1. Captured 4K Screen Assets
All base images have been captured at **retina resolution (16:9 Ultra-HD)** and are located in `promo_assets/`:

1. `asset1_ai_skill_studio_hero.png` — Hero section with badge icons (Cursor .mdc, Claude SKILL.md, AGENTS.md, etc.)
2. `asset2_ai_skill_studio_workbench.png` — Format switcher and the 5-Layer AI Suite controls
3. `asset3_monaco_code_generator.png` — Monaco Code Editor with live rule generation and quality audit meter
4. `asset4_main_tools_workspace.png` — Main DevScratchpad workspace showing tabs and offline developer utilities
5. `asset5_main_tool_jwt_detail.png` — Deep-dive view of `/tools/jwt` with live decoded token claims and sidebar tools

---

## 🎥 2. Higgsfield Prompt & Motion Matrix

### **Clip 1: The Hook (0:00 – 0:05)**
* **Base Image**: `asset1_ai_skill_studio_hero.png`
* **Higgsfield Mode**: Image + Prompt (Vibe Motion)
* **Motion Prompt**:
  ```text
  Slow cinematic 3D forward dolly pan into software hero dashboard. Neon cyan glow, sleek dark-mode glassmorphic UI cards gently floating in three-dimensional space, ultra-crisp typography, 4K resolution, 60fps.
  ```
* **Camera Movement**: Dolly In + 5% Upward Tilt
* **Text Overlay**: `STOP WRITING AI RULES BY HAND.`

---

### **Clip 2: The 13 Formats & 5-Layer Suite Rollout (0:05 – 0:12)**
* **Base Image**: `asset2_ai_skill_studio_workbench.png`
* **Higgsfield Mode**: Image + Prompt (Vibe Motion)
* **Motion Prompt**:
  ```text
  Smooth 3D isometric camera pan across software interface. Format badges, toggle buttons, and security cards fluidly roll out and slide onto the screen sequentially. Glowing cyan and emerald borders, futuristic developer workbench, 4K.
  ```
* **Camera Movement**: Pan Right + Subtle Orbit
* **Text Overlay**: `13 AI FORMATS. 1 CLICK.`

---

### **Clip 3: Code Generation & Quality Auditor (0:12 – 0:18)**
* **Base Image**: `asset3_monaco_code_generator.png`
* **Higgsfield Mode**: Image + Prompt
* **Motion Prompt**:
  ```text
  Cinematic macro zoom onto glowing dark code editor. Syntax highlighted lines streaming in smoothly, rule audit quality score indicator rising dynamically, subtle ambient particle drift, modern high-tech commercial.
  ```
* **Camera Movement**: Zoom In to Code Editor + Horizontal Pan
* **Text Overlay**: `5-LAYER CONTEXT SHIELD. ZERO TOKEN BLOAT.`

---

### **Clip 4: The Main Tools Reveal (0:18 – 0:24)**
* **Base Image**: `asset4_main_tools_workspace.png` (or `asset5_main_tool_jwt_detail.png`)
* **Higgsfield Mode**: Image + Prompt
* **Motion Prompt**:
  ```text
  Dynamic horizontal camera wipe across multi-tabbed developer workstation. Tab headers, JSON trees, JWT decoders, and diff panels switching with clean kinetic energy. Ultra-clean dark theme, crisp edges, 4K.
  ```
* **Camera Movement**: Smooth Pan Left-to-Right
* **Text Overlay**: `PLUS 28 OFFLINE DEV TOOLS.`

---

### **Clip 5: The Outro & Action CTA (0:24 – 0:30)**
* **Base Image**: `asset1_ai_skill_studio_hero.png` (or DevScratchpad Logo)
* **Higgsfield Mode**: Image + Prompt
* **Motion Prompt**:
  ```text
  Slow heroic camera pull-out into a centered dark tech scene. Soft volumetric backlighting, subtle neon glow around web URL and terminal prompt, elegant fade to black, premium SaaS brand aesthetic.
  ```
* **Camera Movement**: Dolly Out
* **Text Overlay**: `100% OFFLINE. FREE FOREVER. -> devscratchpad.tech`

---

## 🎙️ 3. Audio & Voiceover Assets

### **Master 30-Second Voice Script** (Paced for 140-150 WPM)
> *"Stop wasting hours writing AI agent rules by hand. Meet AI Skill Studio by DevScratchpad.*
>
> *Instantly generate production-grade rules across 13 formats — from Claude SKILL.md and Cursor .mdc to AGENTS.md and MCP.*
>
> *Protect your tokens with an automated 5-layer context shield, drop in your package manifests, and export your complete AI kit in seconds.*
>
> *And that’s just one studio — DevScratchpad also packs 28 offline developer tools in one blazing-fast workspace.*
>
> *100% client-side privacy. Zero server tracking. Free forever at devscratchpad.tech."*

### **15-Second Short/Reel Voice Script** (High energy, punchy)
> *"Your AI coding agent is only as good as its rules.*
>
> *AI Skill Studio builds your Claude skills, Cursor rules, and 5-layer context shield across 13 formats — 100% offline.*
>
> *Plus, get 28 instant developer utilities built right in.*
>
> *Try it now at devscratchpad.tech/ai-skill-studio."*

---

## 🔊 4. Sound FX (SFX) Track Suggestions
1. **0:00 – 0:02**: Low-frequency cyber whoosh / sub-bass drop.
2. **0:06 – 0:11**: Mechanical keyboard clicks (`cherry mx blue / brown`) synced with format switches.
3. **0:13 – 0:15**: Subtle electronic chime or "lock-in" sound when the context shield appears.
4. **0:19 – 0:21**: Quick camera whip-pan whoosh when transitioning to the 28 main tools.
5. **0:28 – 0:30**: Resonant, modern tech brand note / harmonic chord.

---

## 🛠️ 5. Re-running the Asset Capture Engine
If you ever update the website UI or change styles, simply re-run:
```bash
python ./scripts/capture_promo_assets.py
```
This will automatically refresh all 5 high-res assets in `promo_assets/`.
