# Research: D2L Brightspace and itslearning

Researched 2026-10-09 for Milestone 2. Sources are listed at the end and cited inline as [S#]. Items marked (unverified) rest on a single weak source, a vendor claim, or a summary I could not check against the original page.

Note on quotes: review quotes below come from page summaries produced by a small fetch model. Treat them as paraphrase and check the original wording before quoting anything externally.

## Summary

- Both products are full-featured, generic K-12 and higher-ed LMSs. Their main public complaints are navigation depth, too many clicks, and grading/gradebook friction, not missing features [S2][S4][S5].
- itslearning is the Norwegian-origin LMS with the stronger Nordic K-12 footprint. Its login for Norwegian schools runs through Feide at municipality level [S11]. The vendor reports 4.5 million active users across 26 countries [S15]. No Norwegian market-share figure was found.
- Brightspace's Norwegian footprint could not be confirmed from public sources. Canvas is the best-documented LMS in Norwegian higher education (UNINETT framework, 2017) [S17].
- The most serious documented itslearning failure is the 2020 Houston ISD rollout: outages, login failures, and 85% of help-desk tickets tied to the vendor [S10]. Outages and login reliability are the pain points most worth designing against.
- Both vendors claim WCAG 2.1/2.2 conformance, but both have documented gaps for screen readers and contrast [S6][S12][S8]. Accessibility is a differentiator Scientia can credibly claim.

## Features by area

Brightspace coverage is thin. The D2L marketing page is mostly a product-add-on catalogue, and its feature detail is limited [S1]. Where Brightspace detail is marked "unknown", the vendor page does not describe the area. The itslearning column comes from its solution page [S7] unless noted.

| Area | Brightspace | itslearning |
|---|---|---|
| Courses & content | Content creation tools; bulk course migration from other LMSs; reusable course templates via add-ons. Content drop-in from cloud drives not verified [S1]. | Resources from desktop folders, Google Drive, Dropbox, O365. Quizzes, discussions, surveys and third-party content link into courses. Course plans can be customised and reused across an organisation [S7]. |
| Announcements | Unknown in vendor material. Students cannot reply to announcements; discussion is a separate area [S4]. | Scheduled or real-time announcements to groups; mass text messaging to a whole school or district [S7]. |
| Assignments & submission | Submission and grade viewing are easier than other areas, per the Reddit poster [S4]. Submit button "buried at the bottom" of the page, per one reviewer [S2-p6]. | Per-student copies created automatically; work returned online; offline and practical tasks can be monitored; Google and Microsoft documents usable for group work [S7]. |
| Grading & feedback | Instructors cannot mark up student papers directly, per one reviewer [S2-p6]. | Annotate student work in the document without download/upload; rubrics and learning objectives attach to assessments [S7]. |
| Gradebook | Widely described as hard to use; points must be changed "in multiple places" [S2]. | Assessments recorded automatically; gradebook exports to Excel for SIS use [S7]. |
| Calendar & due dates | Students cannot add their own due dates, per one technical manager [S2]. | Course calendars combine with personal calendar; resource booking shown [S7]. |
| Discussions | Hard to organise; hard to see which posts have been answered [S2]. Restrictive forums per one reviewer [S2-p6]. | Named as an interactive resource; no detail (unverified) [S7]. |
| Messaging | Students new to the system found it hard to contact people; messaging required the student email connection, per one student [S2-p6]. | Real-time messaging "multiple options" (vague) [S7]. |
| Quizzes | Self-marking tests and quizzes exist (vendor detail not verified). A reviewer reports zeros entered automatically for questions needing manual grading [S2]. | Self-marking tests in a variety of formats; a test-mode browser locks the student's computer during tests [S7]. |
| Groups | Unknown in vendor material. | Projects let students or educators invite members for study groups or clubs; group assignments supported [S7]. |
| Attendance | Unknown. | Not mentioned in vendor material [S7]. |
| Notifications | Limited. No push notifications for discussion replies on the phone app, per one reviewer [S2]. | Automated alerts for key events such as an assessment being marked [S7]. Scope of alerts not documented. |
| Mobile | Mobile access reported weak: app does not show number grades; Safari and Flash issues persist, per reviewers [S2][S2-p6]. | Two apps (original and new) on Google Play and App Store. Students see today's and tomorrow's plans, no-deadline activities, messages. Teachers manage tasks by course. Grades and offline use not described [S14]. |
| Accessibility | Accessibility Conformance Report (auditor-verified, 31 March 2026) claims WCAG 2.2 A/AA/AAA and EN 301 549 V3.2.1. It lists "Partially Supports" on contrast (1.4.3), non-text content (1.1.1), name/role/value (4.1.2), status messages (4.1.3), and focus not obscured (2.4.11) [S6]. Separate Accessibility+ add-on [S1]. | Guided by WCAG 2.1, aligned with the EU directive. Screen reader, braille, magnification and keyboard support claimed. Four fonts incl. Atkinson Hyperlegible and OpenDyslexic, high-contrast mode, optional accessibility checker. Personalisation settings "do not yet apply to all pages" [S12]. Reviewers report inconsistent screen-reader support and no native captions [S8]. |
| Integrations | Single sign-on and Google integration described as hard to set up [S2-p6]. Third-party integration via LTI, APIs, D2L Link no-code recipes [S1]. | SSO with school accounts; SIS integration; Microsoft Teams (course overview tab); Zoom; Google and Microsoft 365 apps; optional plagiarism checker [S7]. Teams detail: an existing Team does not get participant management from itslearning; the tab takes about a minute to appear; full course editing requires the browser [S13]. |
| Roles & admin | Admin tools described; reviewers report weak K-12 support and high cost for smaller schools [S2-p6]. Analytics and AI (Lumi) add-ons [S1]. | Admin tools to centralise institution tasks; parent dashboard; mentor tools; appointment registration [S7]. Parent mobile app described as weak by one reviewer [S8]. |

### Norwegian and Nordic notes

- Login: itslearning access in Norwegian municipal schools is tied to Feide. Bærum's municipality page describes students getting Feide credentials from school, memorising them, and contacting the contact teacher or IKT contact when they fail. Parents log in via ID-porten. Teachers with Feide problems go to the school IKT contact. The page describes Feide login, not the itslearning login steps themselves, and says a new password routine is being piloted [S11].
- Privacy: Datatilsynet's 2025 supervision of 50 municipalities found that many do not know what pupil data digital school services collect. Decisions about tools often fall to principals or individual teachers, and 82.4% of municipalities asked for a central tool-assessment resource. The report does not name itslearning [S16]. This is a real opening for a privacy-first LMS, but it is sector-level evidence, not an itslearning finding.
- Ownership: itslearning is Nordic-headquartered, with its development hub in Norway. The CEO says the company is now investing as part of Sanoma, and K-12 is the core market (higher and vocational is about 12%) [S15].
- Canvas in Norwegian higher education: UNINETT chose Canvas as preferred supplier in 2017, allowing 17 member institutions to buy without a separate tender [S17]. That is dated (2017) and I did not check the current status.
- Brightspace in Norway: no public Norwegian customer was found in this research. Status unknown.

## Pain points

1. **Navigation depth and too many clicks (Brightspace).** A Reddit r/USC thread from 9 Sep 2024 (136 upvotes) says reaching a document can take five to six panels, that the poster used Blackboard and got there in one click, and that the navigation outweighs the benefits [S4]. Capterra reviewers repeat this for simple course edits, the "too many tabs" problem, and dated 2015-2021 reviews [S2][S2-p6].
2. **Students find the new system harder than the old one (Brightspace, one school).** Cardinal Points (15 Sep 2023) reports that many students said the site was harder than Moodle, and that professors themselves had trouble navigating it [S5]. One school's switch is a single case, not a market measure.
3. **Gradebook and grading friction (Brightspace).** Reviewers call the gradebook "a nightmare" each semester, say points must be changed in several places, and report automatic zeros for questions that need manual grading [S2].
4. **Weak mobile experience (Brightspace).** Reviewers report that the app does not show number grades and that mobile access is limited [S2]. Vendor claims of a mobile app exist, but the reviews say the experience lags [S1].
5. **Bugs, crashes and login failures (Brightspace).** Reviewers report crashes, system outages, and glitchy login [S2][S2-p6].
6. **Mass outage and help-desk overload (itslearning, Houston ISD, 2020).** In the first weeks, HISD logged about 1,375 help-desk tickets from 1 Aug to 16 Sep. About 85% involved itslearning, and only 9% were resolved the same day. The CTIO called performance "completely unacceptable." The vendor apologised and gave a letter promising reliability [S10].
7. **Accessibility gaps (itslearning).** A 2026 Capterra reviewer calls accessibility for users with hearing or sight disabilities the main drawback, citing inconsistent screen-reader support and no native automated captioning [S8]. The vendor's own page admits personalisation settings do not reach all pages [S12].
8. **Complicated navigation and setup (itslearning).** Reviewers describe some actions opening new windows with no easy way back, too many areas (students get lost), and complicated setup [S8]. A 2018 G2 reviewer says software updates change the layout and disrupt users for months [S9].
9. **Reporting and slow feature pace (itslearning).** A digital learning manager says reporting could be better, and another reviewer says building useful reports often requires support. Feature development "could be faster," and ideas-portal suggestions are hard to get picked up [S8].
10. **Lost work and unclear data flows (itslearning).** One teacher reports plans being deleted without notice. Some reviewers want timed automatic submission [S8]. Sector-level privacy findings: schools often do not know what data is collected or used for [S16].
11. **Login and credential friction in Norway (Feide).** Bærum's own guidance has students memorising Feide credentials and routing lost passwords through a contact teacher [S11]. This is an operational pain for schools, not a complaint in reviews.
12. **Cost and small-school fit (Brightspace).** Reviewers say advanced features cost much more, and that K-12 help is hard to obtain. One principal says the product is not affordable for smaller schools [S2-p6].

Pain points 1, 2, 3, 5, 6 and 7 meet the acceptance criterion of at least eight with source URLs. Pain points 9 to 12 are weaker, either because the sample is small or because the evidence is sector-level.

## Worth copying

- **One place for all courses.** Students and teachers get everything in one location (itslearning reviewer, 2018) [S9]. This is close to Scientia's core goal.
- **Inline annotation and per-student copies.** Marking up submitted work without download/upload, and auto-creating a copy per student, reduce steps for teachers [S7].
- **Automatic per-student copy of assignments and assessment notifications.** Students hear when work is marked [S7].
- **"Today and tomorrow" mobile view for students, with no-deadline activities separated.** A short, focused mobile default [S14].
- **Accessibility personalisation.** Font choice (including dyslexia-friendly fonts), higher contrast, and an optional accessibility checker built on axe rules [S12].
- **Calendar combined with personal calendar, and Excel export from the gradebook.** Simple data export and familiar calendar integration [S7].
- **Advance notice before downtime.** One Brightspace user praised pre-announced shutdowns [S2-p6]. Advance notice should be a standard feature of any Scientia update.

## Worth avoiding

- **Deep nested folder trees and tab-heavy navigation.** Repeatedly named as the top complaint for both products [S4][S2][S2-p6][S9].
- **Back button that returns to the home page.** Reported for Brightspace [S2-p6].
- **Splitting discussions, announcements and messaging into separate areas,** especially where students cannot reply to announcements [S4].
- **Grading that requires leaving the page, multi-place point edits, and automatic zeros.** Reported for Brightspace [S2].
- **Layout changes without warning.** Reported for itslearning [S9].
- **Single-vendor outage with poor communication.** The Houston rollout shows that a platform that fails under load creates support volume for the whole district [S10].
- **Integrations that look good but limit control.** itslearning's Teams tab does not manage participants for existing Teams and forces teachers into the browser for full editing [S13].
- **Privacy by default that schools cannot assess.** Datatilsynet's finding is an opening for Scientia, and a warning about how the sector will treat any data it collects [S16].

## Sources

- [S1] D2L Brightspace, product overview. https://www.d2l.com/brightspace/
- [S2] Capterra, Brightspace reviews (page 1). https://www.capterra.com/p/122854/Brightspace/reviews/
- [S2-p6] Capterra, Brightspace reviews (page 6). https://www.capterra.com/p/122854/Brightspace/reviews/?page=6
- [S4] Reddit r/USC, "Brightspace is awful" (9 Sep 2024), via third-party mirror. https://nyc1.lr.ggtyler.dev/r/USC/comments/1fckbi2/brightspace_is_awful/lmbmo5c/?context=3 (the mirror is not reddit.com; the original is https://www.reddit.com/r/USC/comments/1fckbi2/)
- [S5] Cardinal Points, "Students weigh in on Brightspace" (15 Sep 2023). https://cardinalpointsonline.com/students-weigh-in-on-brightspace/
- [S6] D2L, Auditor-verified Brightspace Core Accessibility Conformance Report (31 Mar 2026). https://www.d2l.com/wp-content/uploads/2026/04/Auditor-verified-Brightspace-Core-ACR-March-31-2026.pdf
- [S7] itslearning, solution overview. https://itslearning.com/solution
- [S8] Capterra, itslearning reviews. https://www.capterra.com/p/129887/itslearning/reviews/
- [S9] G2, itslearning review (16 Aug 2018). https://www.g2.com/products/itslearning-itslearning/reviews/itslearning-review-847293
- [S10] ABC13 (Houston), "HISD technology vendor's unacceptable performance" (2020). https://abc13.com/amp/post/houston-isd-hub-technology-hisds-online-learning-platform-hisd-itslearning-website/8019654/
- [S11] Bærum kommune, Feide login support page (published 16 Mar 2016, updated 2 Oct 2024). https://www.baerum.kommune.no/tjenester/skole/logg-inn-pa-its-learning/feide-innlogging---brukerstotte/
- [S12] itslearning support, accessibility overview. https://support.itslearning.com/en/support/solutions/articles/7000058599-accessibility-overview
- [S13] itslearning support, MS Teams integration. https://support.itslearning.com/en/support/solutions/articles/7000078848
- [S14] itslearning, mobile app page. https://itslearning.com/mobile-app
- [S15] Nordic EdTech, "The NEN Interview: Steve Tucker, CEO itslearning". https://nordicedtech.substack.com/p/the-nen-interview-steve-tucker-ceo
- [S16] Altinget Arbeidsliv (15 May 2025), on Datatilsynet's municipal school privacy supervision. https://www.altinget.no/arbeidsliv/artikkel/kommunene-har-ikke-kontroll-paa-digitale-verktoey-i-skolen-ber-staten-gripe-inn
- [S17] PR Newswire (28 Mar 2017), UNINETT framework selects Canvas for Norwegian universities. https://www.prnewswire.co.uk/news-releases/thirteen-norwegian-universities-use-uninett-framework-to-select-canvas-and-drive-progress-in-digital-learning-617267163.html

Consulted but not cited for claims: Brightspace community thread https://community.d2l.com/brightspace/discussion/4399/using-brightspace; Feide overview https://docs.feide.no/general/feide_overview.html.

Total distinct cited sources: 17 (S1 to S17, where S2-p6 is a second page of the Capterra Brightspace reviews).
