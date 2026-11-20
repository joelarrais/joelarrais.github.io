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

## Preview locally

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.
