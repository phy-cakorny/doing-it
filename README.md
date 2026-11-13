# Doing it

## About

Doing it is a prompt-refinement tool for developers who build interfaces with AI coding agents but may have less design experience. As a developer describes an idea, the tool surfaces design considerations and offers visual choices about consequential decisions such as layout, color, and usability, with explanations of why they matter. A choice is only added to the prompt when the developer accepts it. The result is a more design-aware prompt to copy into a coding tool such as Cursor, Claude Code, v0, or Lovable.

“Doing it” is a web app with one core workflow: rough idea → guided design decisions → refined prompt. It combines three interaction patterns:
- Inline autocomplete that finishes the sentence the developer is writing with a design-relevant clause, tagged by category and paired with a one-line rationale.
- Decision galleries that present one consequential choice at a time (layout, then color, then usability) as visual options, each skippable and reversible.
- A design guidance panel that organizes further suggestions across five categories: layout and structure, visual design, interaction and states, usability, and accessibility.

## Run locally

Prerequisites: Node.js 20.19+ or 22.12+ and npm.

From the repository root, install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open the URL printed by Vite. By default, the app is available at [http://localhost:8443](http://localhost:8443).

To create a production build:

```bash
npm run build
```
