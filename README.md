# joelarrais.github.io

Personal and research group website of Joel P. Arrais, published by GitHub Pages at
<https://joelarrais.github.io/>.

It is a single static page: plain HTML, CSS and JavaScript, with no build step and no
dependencies. Edit the files, push, and GitHub Pages publishes the result.

## Structure

```
index.html                 the whole site (one page, sections in order)
favicon.ico                browser tab icon (also assets/img/favicon.svg, apple-touch-icon.png)
assets/css/style.css       all styles; table of contents and design tokens at the top
assets/js/site.js          navbar and menu behaviour, analytics consent
assets/img/                header.jpg, profile.jpg (also used for link previews), group.jpg
assets/img/icons/          highlight icons
assets/img/research/       research interest icons
assets/img/publications/   figures of the featured publications (SVG, 800x390)
assets/img/team/           team photos, named firstname-lastname.jpg
```

## Common edits

- **Add a team member**: in the Team section of `index.html`, copy one `col-md-6`
  block and change the text. Add the photo as a square JPEG of 180x180 px in
  `assets/img/team/firstname-lastname.jpg`.
- **Move someone to former students**: delete their block and add a `<li>` to the
  `alumni-list`.
- **Feature a publication**: copy one `col-md-6` block in the Featured Publications
  section and change the link, journal, year and title. For the figure, copy one of the
  SVGs in `assets/img/publications/` and edit its text in any text editor: three steps
  at the top (the middle one highlighted) and three numbers at the bottom.
- **Icons** (highlights, research interests) are single-colour PNGs with a transparent
  background; the page paints them in the theme colour, so any colour in the file works.

Images are shown small, so keep them small: about twice the size they appear on screen
(team photos 180 px, icons about 128 px, page-wide images about 1600-1900 px wide).

## Design

Colours, corner radius, shadows and fonts are defined once at the top of
`assets/css/style.css` (section 1), with a second set of colours for dark mode, which
follows the visitor's system setting.

## Bioinformatics quiz

`bioinformatica/quiz/` is a multiple-choice training quiz for the Bioinformatics course,
published at <https://joelarrais.github.io/bioinformatica/quiz/>. It is deliberately not
linked from the personal page; the quiz links back to it. `bioinformatica/` is reserved
for a future course page.

- The question bank, scoring, XP, Phred levels and class ranking live in a Google Apps
  Script web app; its URL is `APPS_SCRIPT_URL` at the top of `bioinformatica/quiz/quiz.js`.
  Without it the quiz runs in demo mode with 4 sample questions.
- Achievements, personal best, days in a row and the theme are kept in the student's
  browser (per device and pseudonym), not on the server.
- Google Analytics uses the same property and the same consent answer as the personal
  page. Events sent: block started and completed (mode, score) and question flagged;
  never the pseudonym.

## Preview locally

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000> (and <http://localhost:8000/bioinformatica/quiz/>).
Use the local server rather than opening the files directly: icons and the quiz's
calls need a real web address.
