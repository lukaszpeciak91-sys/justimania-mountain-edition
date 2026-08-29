# Simple Browser Game Cookbook

> **Scope boundary:** this is a lightweight workflow for small, fun, experimental, or
> short-lived browser games such as Justimania, tamagotchi-jam, and quick GitHub Pages
> projects. **It is not the standard workflow for serious projects.** A project with
> substantial reliability needs, platform-specific complexity, long-term maintenance,
> significant architecture, or broader scope needs its own workflow, contracts,
> documentation, validation, and engineering process. This cookbook does not replace it.

## Guiding decisions

> **Build the smallest complete game first. Add architecture only after the game proves
> it needs it.**

> **Reuse physically validated solutions before inventing cleaner ones.**

These are defaults, not dogma. Depart from them when an actual product requirement or
observed limitation gives a reason. The objective is to reduce avoidable rework, not to
reduce useful iteration.

## 1. When to use this cookbook

Use it when most of these describe the project:

- a limited-scope browser game made for fun, a joke, or an experiment;
- a short development cycle and simple static hosting, often GitHub Pages;
- disposable runs or deliberately lightweight persistence;
- mobile, desktop, or both, with a narrow set of browser interactions;
- no backend unless the game genuinely requires one;
- a small team or an AI-and-user collaboration that benefits from quick validation.

Size alone is not the test. A tiny payment game, accessibility-critical experience,
long-lived live service, platform integration, or safety/reliability-sensitive product may
need a serious-project process. Do not use this cookbook to waive real requirements.

## 2. Start with a short product conversation

Before implementation, understand the game rather than immediately scaffolding it. Ask
only the questions that can change the solution. Adapt the conversation; do not administer
a fixed questionnaire.

Useful unknowns commonly include:

- core loop and expected session length;
- screens and transitions;
- mobile/desktop target, orientation, and controls;
- whether canvas rendering, world coordinates, or physics are needed;
- lose, win, restart, and menu behavior;
- disposable state versus persistence;
- asset needs and who supplies them;
- static-hosting/deployment target;
- major product, theme, content, and progression decisions.

### Product ownership is not implementation freedom

An AI may choose routine implementation details inside an approved design. It must not
silently invent product canon: characters, checkpoint or route lists, level names/order,
progression, unlocks, important copy, difficulty concept, themes, editions, or equivalent
defining content. It may propose options, but material choices go to the user for approval
before becoming canonical data or code.

## 3. Choose the smallest suitable stack

The audited reference projects demonstrate different valid levels, not a ladder on which
more structure is automatically better:

- A tamagotchi-like interface can be plain HTML, CSS, and JavaScript, with browser storage
  only when its product loop calls for persistence.
- A Justimania-like moving world benefits from Phaser because it uses scene rendering,
  world coordinates, collisions/Arcade Physics, camera movement, sprite states, and
  generated gameplay objects.

Do not use Phaser merely because the product is called a game. Do not add React, a router,
a state library, a UI framework, or another dependency unless the present product gains a
clear benefit. “Future scalability” is not a requirement unless that future is credible
and approved.

## 4. Two reference shapes, not two templates

### A. Simple DOM game

```text
index.html
style.css
app.js
assets/
```

Typical flow:

```text
state -> input -> update -> render -> optional persistence
```

Keep these responsibilities in one file while that remains easy to understand. Split a
module when a real responsibility becomes independently useful, not to make the tree look
more formal.

### B. Small Phaser game

```text
src/
  scenes/
  gameplay/
  ui/
  config/
public/assets/
```

Even this shape should grow only when scenes, gameplay systems, DOM UI, and configuration
have actually become separate concerns. A new project need not match either tree.

## 5. Define a mini-spec before coding

Write a short, reviewable mini-spec containing only enough to prevent fundamental rework:

- one-sentence concept and core loop;
- screen/state flow;
- controls and device/orientation target;
- fail, win, reset, and menu flow;
- asset contract and fallback expectations;
- persistence and reset semantics;
- deployment target;
- MVP boundary versus later polish;
- features requiring early physical validation.

Mark unresolved product decisions rather than filling them in. Have the user review the
mini-spec before implementation starts; revise it cheaply while it is still text.

## 6. Build a complete vertical slice early

Reach an ugly but playable loop as soon as practical:

```text
open -> start -> play -> lose or win -> restart or menu
```

Prove navigation, input ownership, lifecycle, and reset behavior early. Do not spend
several increments polishing menu art, effects, animation, configuration systems, or
architectural seams before the complete loop exists. Polish is easier to keep when every
change can be exercised in context.

## 7. Iteration and PR/task sizing

**Prefer coherent increments, not an arbitrary PR count. Reduce rework, not iteration.**

- Group related work when it naturally produces one understandable result.
- Do not force unrelated or poorly understood work together merely to reduce PRs.
- Split when an increment creates a useful review or validation boundary.
- Treat discoveries and bug-fix iterations as normal.
- Avoid repeatedly rebuilding a foundation that already has a validated solution.

For each meaningful increment, state:

```text
Goal:          what useful result exists afterward?
Scope:         what may and may not change?
Validation:    how will the claim be checked?
Stop condition: when is this increment done?
```

The game determines the number of increments. There is no target PR or task count.

## 8. Physical validation boundaries

Automated checks are useful but not authoritative for mobile touch behavior,
browser/canvas interaction, overlays, orientation, scene lifecycle, real-device layout,
or browser audio policies. Test on a physical target device when one of these foundations
is first introduced—not only after final polish.

Report the boundaries separately:

- **SOURCE/LOGIC PASS:** code, tests, static contracts, or builds passed.
- **PHYSICAL DEVICE PASS:** the behavior was exercised on a named real device/browser.

Never present the first as proof of the second. If no physical pass occurred, say so.

## 9. Phaser versus DOM responsibility

A useful default for a small Phaser game is:

- Phaser owns the game world, physics, camera, and gameplay rendering.
- Native DOM may own simple menu, terminal, or modal controls that do not participate in
  that world.

Real HTML buttons can simplify accessibility, browser input, and navigation for menus,
Game Over, Victory, and simple overlays. If an action means “return to application start,”
runtime state need not survive, and boot is cheap, a normal page reload is a valid,
deterministic reset boundary. Do not build scene/input workarounds solely to avoid it.

This is not an absolute split. Keep a control in Phaser when it must move with the world,
interact with world objects, share game-space depth, or participate directly in gameplay.
Whatever owns a control must also own its listener cleanup and visibility lifecycle.

## 10. Define the asset contract first

Before final art exists, record what runtime needs:

- path and logical role;
- dimensions or aspect ratio;
- transparency expectations;
- sprite-sheet grid and frame order;
- required versus optional loading behavior.

Use placeholders or safe fallbacks when they allow the gameplay slice to progress. A small
central registry is useful once several assets share loading/fallback rules; a few direct
paths do not justify an asset-management system. Large optional media, especially music,
should not block startup and should fail non-fatally where the product permits it.

### Binary ownership

Codex must not silently draw, redraw, resize, optimize, convert, regenerate, overwrite, or
otherwise modify user-owned binary art or audio. Binary work requires explicit user
authorization for that operation. This cookbook primarily concerns source architecture and
workflow; runtime scaling or frame selection does not modify the source binary.

## 11. Use data-driven design only when it pays off

One real variant can use straightforward values. When a second real variant shares the
same mechanics but changes content or presentation, a small data-driven configuration may
become worthwhile. Justimania's editions illustrate that point: the abstraction answered
real shared-mechanics pressure from two variants.

Prefer:

```text
real duplication pressure -> small abstraction
```

not:

```text
possible future duplication -> architecture now
```

Keep canonical product data distinct from mechanics, but do not create registries,
factories, or plugin systems for hypothetical variants.

## 12. Test in proportion to risk

| Claim | Proportionate evidence |
| --- | --- |
| Pure calculation/state rule | Focused unit test |
| Application still packages | Production build |
| Small static/source contract | Small source check, if it adds value |
| Touch, overlay, orientation, audio, lifecycle | Physical device/browser |
| Visual composition and readable layout | Rendered browser/device inspection |

Do not add a test framework more complicated than the feature. A regex source check can
prove that text or a pattern exists; it cannot prove runtime behavior. Label evidence by
what it actually demonstrates.

## 13. Keep state and reset rules simple

- Keep lightweight state explicit and reset semantics easy to trace.
- Use `localStorage` only for intentional persistence across visits.
- Use `sessionStorage` only when short-lived navigation intent is useful.
- Do not persist state because it might become useful later.
- A disposable run may reset entirely or reload.
- A tamagotchi-like ongoing-care loop may intentionally save and restore state.

Let the product decide. Document versioning or migration only if persisted data has enough
value and lifetime to require it.

## 14. Mobile-first basics

- Declare viewport and portrait/landscape intent; handle an unsupported orientation
  deliberately rather than leaving half-working controls.
- Set `touch-action` intentionally and make touch targets readable and comfortably sized.
- Account for safe-area insets where controls approach device edges.
- Check browser scaling and use the canvas's actual client rectangle when aligning DOM UI;
  logical canvas coordinates are not necessarily CSS pixels.
- Remove or disable hidden overlays so they cannot intercept input.
- Exercise resize, rotate, background/foreground, and repeated navigation on the target
  browser when those flows matter.

## 15. Performance defaults

- Keep assets reasonable for the hosting and expected network.
- Do not block boot on large optional media.
- Prefer simple, static-hosting-compatible loading and deployment.
- Do not optimize every allocation or abstraction prematurely.
- Do investigate an obvious slow startup, oversized download, repeated work, or runtime
  hitch when observation shows it matters.

## 16. Anti-overengineering check

Before adding complexity, ask:

- Does this need a class, or would one function be enough?
- Is there a real second consumer or variant?
- Does this project actually need this state machine?
- Could a reload be the correct reset boundary?
- Does this button genuinely need to live in Phaser?
- Is this abstraction solving a current observed problem?
- Has a reference project already physically validated a suitable solution?
- Am I improving the product, or only making the implementation look “professional”?
- Can the complete loop work without this?

## 17. Avoid repeating failed loops

- Choose navigation ownership, validate it on device, and revisit it only with new
  evidence; do not repeatedly rotate architectures to fix unexamined symptoms.
- Test basic input on the target before adding gesture or scene-input complexity.
- Consult prior validated decisions before inventing a cleaner-looking substitute.
- Preserve approved layout while fixing unrelated behavior.
- Ask before canonizing AI-invented content that will later need replacement.
- Keep a bug fix inside the affected subsystem unless evidence establishes a wider cause.
- Never treat passing automation as proof of mobile touch, layout, or lifecycle behavior.

## 18. AI operating mode for a new game

When ChatGPT or Codex receives this cookbook for a new game, it must not scaffold a clone
of Justimania or tamagotchi-jam. It should:

1. Read the cookbook.
2. Understand the user's new game idea.
3. Clarify only genuinely important unknowns.
4. Decide which principles apply.
5. Explicitly identify which principles do **not** apply.
6. Recommend the smallest suitable stack.
7. Propose a short mini-spec for user review.
8. Propose coherent implementation stages with goals and stop conditions.
9. Identify early physical-validation points.
10. Get user approval before making important product/content decisions.
11. Only then prepare the first implementation task.

The reference projects are evidence for choosing an appropriate shape, not universal
templates. Carry forward reasons and validated boundaries—not their viewport, timing,
physics, routes, balance, asset dimensions, colors, content counts, or other
project-specific constants. This cookbook is adaptable guidance, not a rigid architecture.
