# Brand

What Scientia is, how it should feel to move through, and the rules that make any
screen recognisably the same product. `ui-guidelines.md` has the component and
copy rules; this file says why and what must stay true when they change.

Scientia is built on [Designsystemet](https://designsystemet.no) (Digdir). The system
supplies the components, the spacing, the type scale and the light and dark schemes.
What makes the product ours is the theme we give it, where the primary colour goes,
and how pages are shaped and worded.

## The idea

**Scientia tells you exactly where you stand and what comes next, and stays out of the
way of the work.**

Three qualities, in this order when they conflict:

1. **Exact.** A date is a date, a score is "86 / 100", a status is one word from a fixed list.
   Nothing that matters is vague ("soon", "a while ago", "a few").
2. **Fair.** Both sides see the same facts in the same words. Nothing punishes by
   surprise: missing work is not a zero, grades stay private until released, errors say
   what to do, a destructive action says what is lost.
3. **Calm.** The work is the loud part. Neutral surfaces, one primary colour in the places
   you look, no decoration, nothing moves unless the person did something.

The feeling this adds up to is **settled**: every page is where you expect it, shaped
like the last one, and answers in the same words. Someone who has used the Assignments
list can use the Announcements list without learning anything.

## What makes a screenshot ours

If the logo is cropped out, these still identify it:

- A solid deep-blue top bar on every page, with the S mark top left.
- The same blue in three more places on every screen: the current place (navigation item
  or tab), the next thing to do (the one primary button, the next-due item) and what you
  can follow (links, counts). Everything else is neutral.
- Neutral page and panels from the system's neutral scale, hairline borders for
  structure, shadow only on what floats (menus, dialogs, toasts). Dark is the same
  design in the system's dark scheme.
- Inter, the system's type scale, semi-bold headings, tabular figures in tables.
- The page header: a "‹ Parent" link above, the title, at most one plain sentence, the
  actions on the right.
- Words in status tags, never colour alone, from one shared vocabulary.
- Dates as `Fri 17 Oct, 23:59` everywhere, scores as `86 / 100`.
- Buttons that are verbs in sentence case.

## Built on Designsystemet

We use its React components (`@digdir/designsystemet-react`), its CSS
(`@digdir/designsystemet-css`) and a theme generated from a few colour inputs
(Theme Builder at theme.designsystemet.no, or its CLI). The theme is imported after the
system's CSS and is never edited by hand.

| Role | Input | Used for |
| --- | --- | --- |
| `accent` | our deep blue `#1f4f8a` (becomes `base-default`) | the primary colour, see below |
| `neutral` | a warm grey, starting from `#55554f`, so surfaces keep the off-white feel | page, panels, text, borders, anything that is not a signal |
| `success`, `warning`, `danger`, `info` | the system's defaults | status tags, alerts, delete actions, only with words |
| `brand1`, `brand2` | not used | a second or third colour would dilute the one signal |

If a generated scale reads cold, or fails contrast (`a11y.serious`), change the one
input in the theme. Do not patch a token.

How the system is used, everywhere:

- Set `data-color="accent"` once on the root so every component inherits the primary
  colour, `data-color-scheme="auto"` so dark follows the person's device, and
  `data-size="md"` so there is one size. `sm` only inside rows and table cells.
  Elements that must differ (`data-color="danger"` on a delete action, a status tag)
  say so on themselves.
- Colour comes from `--ds-color-<role>-<group>-<variant>` tokens, or the unprefixed
  `--ds-color-…` ones that follow the nearest `data-color`. Radius, shadow, size, line
  height and font weight come from `--ds-border-radius-*`, `--ds-shadow-*`,
  `--ds-size-*`, `--ds-line-height-*`, `--ds-font-weight-*`. The font is Inter, set
  through `--ds-font-family`.
- The system has no top bar, side navigation or page header. We build those three, and
  the page layouts, from its tokens and nothing else. Everything else is a system
  component used with its own props and data attributes.
- A component that does not fit is a signal to change the page, or the theme input,
  not to override the component.

## Where the primary colour goes

Every screen carries it in at least three of the first five rows. That is the change
from a page that is blue only on its button.

| Where | How | Tokens |
| --- | --- | --- |
| Top bar | solid fill; mark, product name and links in the contrast colour | `accent-base-default`, `accent-base-contrast-default` |
| Current place | the current navigation item and tab: tinted fill and accent text | `accent-surface-tinted`, `accent-text-default` |
| Next action | the one primary button; the next-due item and the "Needs grading" count on the Dashboard sit on a tinted panel | `accent-base-default` for the button, `accent-surface-tinted` and `accent-border-subtle` for the panel |
| What needs you | unread and queue counts as solid badges | `accent-base-default`, `accent-base-contrast-default` |
| What you can open | links and the course cards on the Dashboard (cards in `data-color="accent"`) | `accent-text-default`, `accent-surface-tinted` |
| Focus | the system's focus ring, never removed | system default |

What stays calm:

- Page, panels, headings, body text, table cells and borders are neutral. A heading is
  never blue; a table never has a coloured column.
- Tint means "open this, act on this, you are here". A panel that is none of these stays
  neutral, even if it would look more branded in blue.
- Status colours (success, warning, danger, info) appear only in tags, alerts and delete
  actions, and always with words. They never decorate.
- One solid blue control in the page body: the primary button. The top bar and counts
  are the only other solid blue.
- No gradients, illustrations, second hue, per-course colours or accent-coloured
  backgrounds on whole sections.

## Rules

Each rule has a check. Automated ones run in `mise run metrics`; the rest are looked
at on the running app (light, dark, 390 px wide) before a change lands.

1. **Use the system as it comes.** Components take their look from the theme and their
   state from their own props. No override of a component's colour, size, radius,
   shadow or type; no `!important`; no selector that reaches into a component's
   internals; no `style` attribute.
   *Check: `design.inline_styles` 0. To add when the redesign lands: `design.overrides`
   (`!important` and selectors on a component's own classes or data attributes, target
   0) and `design.custom_css_lines`, ratcheted down to what is measured then.*
2. **One primary colour, used where you look.** The accent goes where the table above
   says and nowhere else. Status colours appear only in tags, alerts and delete
   actions, always with words.
   *Check: `design.literal_colors` 0 (no hex or rgb in a stylesheet or page, only
   `--ds-color-…` tokens); look at the five rows on every new screen.*
3. **Same place for the same thing.** Brand mark top left and always links home; the
   account menu top right; course navigation left, in the same order in every course;
   back link above the title; the create action at the right of the header; the
   submit button bottom left of a form with Cancel beside it. A header may hold a
   second action (Gradebook "Export CSV", Users "Import users"): it is a secondary
   button immediately left of the primary one. Never two primary buttons.
   *Check: look.*
4. **Same shape for the same kind of page.** Five shapes only (below). A new page picks
   one; it does not invent a sixth.
   *Check: look.*
5. **Same words for the same thing.** One status vocabulary, one verb per action
   (people are "removed", content is "deleted"), "Optional" on optional fields,
   "Enter …" and "Choose …" in field errors, toasts as "<Thing> <past tense>", empty
   states as a title and one sentence.
   *Check: `copy.leaks` 0; `ui-guidelines.md` Writing.*
6. **Exact, never vague.** Absolute dates and numbers first, relative text only beside
   them. No score without its total, no total without saying what it counts.
   *Check: look.*
7. **Answer the same way every time.** Hover, focus, press and disabled are the
   component's own; we add no motion. A finished action gives one toast at the top; a
   failed one puts the message next to the cause and keeps the input. Loading says
   "Loading…" in place.
   *Check: rule 1.*
8. **Fair by default.** Errors never blame ("Enter your email", not "Invalid input").
   Confirmations name the object and what happens to others. A student's view never
   shows a teacher-only fact; a teacher's view uses the student's words.
   *Check: e2e role specs; look.*
9. **The same on every screen.** Light, dark, phone, sign-in, error pages, the page
   before the app has loaded, the browser tab (title `Page · COURSE · Scientia`,
   favicon, theme colour). Nothing is desktop-only or light-only.
   *Check: `a11y.serious` 0, `design.phone_overflow` 0; look at 390 px, light and dark.*

## Five page shapes

| Shape | Skeleton | Pages |
| --- | --- | --- |
| Overview | header, then sections of lists and course cards | Dashboard, Course Home |
| List | header with create action, optional tabs or toolbar, one list of rows, empty state | Modules, Announcements, Discussions, Assignments, Grading queue, People, Notifications |
| Detail | header with back link, facts, body, then the one form that belongs here | Announcement, Thread, Assignment, Page, Grading a submission |
| Form | header with back link, one column of fields, buttons bottom left | every New/Edit page, Profile, Notification settings, Sign in |
| Table | header, optional toolbar, one table; stacked rows on phones or sideways scroll with a visible edge | Gradebook, Grades, Admin Users, Admin Courses (the Calendar month grid is the one exception) |

## Voice

Plain, direct, sentence case, "you". Say what is true and what to do; leave out how or
why the product was built. Examples from the app that set the tone:

- "Nothing due this month" (not "You're all caught up!")
- "Graded so far: 96 of 110 points (87.3%)" (not "Your grade: 87%")
- "Choose a due date and time" (not "Invalid date")
- "Your teacher has started grading this work"

Never: exclamation marks, emoji, humour, jargon, praise, other products' names, words
about the product's own qualities (the words in this file are for us, not the screen).

## When a rule and a request disagree

Exact beats fair beats calm. A feature that needs a seventh status, a second colour
role or a sixth page shape is a signal to change the feature, or to change this file
first with a reason.
