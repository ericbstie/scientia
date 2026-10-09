# Brand

What Scientia is, how it should feel to move through, and the rules that make any
screen recognisably the same product. `ui-guidelines.md` has the tokens and component
rules; this file says why and what must stay true when they change.

## The idea

**Scientia tells you exactly where you stand and what comes next, and stays out of the
way of the work.**

Three qualities, in this order when they conflict:

1. **Exact.** A date is a date, a score is "86 / 100", a status is one word from a fixed list.
   Nothing that matters is vague ("soon", "a while ago", "a few").
2. **Fair.** Both sides see the same facts in the same words. Nothing punishes by
   surprise: missing work is not a zero, grades stay private until released, errors say
   what to do, a destructive action says what is lost.
3. **Calm.** The work is the loud part. Neutral surfaces, one accent, no decoration,
   nothing moves unless the person did something.

The feeling this adds up to is **settled**: every page is where you expect it, shaped
like the last one, and answers in the same words. Someone who has used the Assignments
list can use the Announcements list without learning anything.

## What makes a screenshot ours

If the logo is cropped out, these still identify it:

- A deep-blue accent that appears only on the next thing to do and the place you are:
  the one primary button, links, the current navigation item, the unread count.
- Warm off-white page, white panels, hairline borders for structure. Shadow only on
  what floats (menus, dialogs, toasts). In dark: near-black, raised panels, same rules.
- Inter, five sizes, semi-bold headings, tabular figures in tables.
- The page header: a "‹ Parent" link above, the title, at most one plain sentence, the
  one action on the right.
- Words in status badges, never colour alone, from one shared vocabulary.
- Dates as `Fri 17 Oct, 23:59` everywhere, scores as `86 / 100`.
- Buttons that are verbs in sentence case.

## Rules

Each rule has a check. Automated ones run in `mise run metrics`; the rest are looked
at on the running app (light, dark, 390 px wide) before a change lands.

1. **One accent, one job.** Accent marks the next action or the current place. Status
   colours appear only inside badges, alerts and delete actions, always with words.
   *Check: `design.literal_colors` 0; no page sets a colour.*
2. **Same place for the same thing.** Brand mark top left and always links home; the
   account menu top right; course navigation left, in the same order in every course;
   back link above the title; the create action at the right of the header; the
   submit button bottom left of a form with Cancel beside it.
   *Check: look.*
3. **Same shape for the same kind of page.** Five shapes only (below). A new page
   picks one; it does not invent a sixth.
   *Check: look.*
4. **Same words for the same thing.** One status vocabulary, one verb per action
   (people are "removed", content is "deleted"), "Optional" on optional fields,
   "Enter …" and "Choose …" in field errors, toasts as "<Thing> <past tense>", empty
   states as a title and one sentence.
   *Check: `copy.leaks` 0; `ui-guidelines.md` Writing.*
5. **Exact, never vague.** Absolute dates and numbers first, relative text only beside
   them. No score without its total, no total without saying what it counts.
   *Check: look.*
6. **Answer the same way every time.** Hover, focus and press change colour over 120 ms
   and nothing else moves. A finished action gives one toast at the top; a failed one
   puts the message next to the cause and keeps the input. Loading says "Loading…" in
   place. Reduced-motion removes the 120 ms.
   *Check: `design.inline_styles` 0 keeps the transitions in one stylesheet.*
7. **Fair by default.** Errors never blame ("Enter your email", not "Invalid input").
   Confirmations name the object and what happens to others. A student's view never
   shows a teacher-only fact; a teacher's view uses the student's words.
   *Check: e2e role specs; look.*
8. **The same on every screen.** Light, dark, phone, sign-in, error pages, the page
   before the app has loaded, the browser tab (title `Page · COURSE · Scientia`,
   favicon, theme colour). Nothing is desktop-only or light-only.
   *Check: `a11y.serious` 0; look at 390 px, light and dark.*

## Five page shapes

| Shape | Skeleton | Pages |
| --- | --- | --- |
| Overview | header, then sections of `.list`s and course tiles | Dashboard, Course Home |
| List | header with create action, optional `.tabs` or toolbar, one `.list` of rows, `Empty` | Modules, Announcements, Discussions, Assignments, Grading queue, People, Notifications |
| Detail | header with back link, facts, body, then the one form that belongs here | Announcement, Thread, Assignment, Page, Grading a submission |
| Form | header with back link, one column `.form`, buttons bottom left | every New/Edit page, Profile, Notification settings, Sign in |
| Table | header, optional toolbar, `.table-wrap`; stacked rows on phones or sideways scroll with a visible edge | Gradebook, Grades, Admin Users, Admin Courses (the Calendar month grid is the one exception) |

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

Exact beats fair beats calm. A feature that needs a seventh status, a second accent
colour or a sixth page shape is a signal to change the feature, or to change this file
first with a reason.
