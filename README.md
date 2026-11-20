# joelarrais.github.io

Website of Joel P. Arrais and his research group, published by GitHub Pages at
<https://joelarrais.github.io/>.

It is a single static page: plain HTML, CSS and JavaScript, with no build step and no
dependencies. Edit the files, push, and GitHub Pages publishes the result.

## Structure

```
index.html                 the whole site (one page, sections in order)
assets/css/style.css       all styles; table of contents at the top
assets/js/site.js          navbar and menu behaviour, analytics consent
assets/img/                header.jpg, profile.jpg (also used for link previews), group.jpg
assets/img/icons/          small icons (social links, highlights)
assets/img/research/       research interest icons
assets/img/publications/   visual abstracts of the featured publications
assets/img/team/           team photos, named firstname-lastname.jpg
```

## Common edits

- **Add a team member**: in the Team section of `index.html`, copy one `col-md-6`
  block and change the text. Add the photo as a square JPEG of 180x180 px in
  `assets/img/team/firstname-lastname.jpg`.
- **Move someone to former students**: delete their block and add a `<li>` to the
  `alumni-list`.
- **Feature a publication**: put the image in `assets/img/publications/` and copy one
  `col-md-6` block in the Featured Publications section.

Images are shown small, so keep them small: about twice the size they appear on screen
(team photos 180 px, icons 130-150 px, page-wide images about 1600-1900 px wide).

## Preview locally

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.
