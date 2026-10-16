# Redesign mockup

Interactive mockup of the redesigned UI. It is the reference for the build: every screen, tab, dialog and popup is reachable from the grid icon in its title bar.

- `im-crm-redesign.html` — the built, self-contained mockup. Open it in a browser.
- `src/` — the parts it is built from: `p1.css` (styles), `dark.css` (dark tokens), `shell.html` (window markup), `p2.js` (icons, sample data, charts), `p3.js` (views), `p4.js` (modals, shell, actions).
- `build.py` — joins `src/` into `im-crm-redesign.html`: `python3 docs/redesign/build.py`.
