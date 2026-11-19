# Instructions for AI coding assistants

This is Richard's Three.js model of the projection booth at the Grand Illusion Cinema's new home, the Varsity Theatre in Seattle's U District.  Its main job is helping decide where to put a new Barco digital projector and two 35mm projectors.  Read `README.md` and `MEASUREMENTS.md` before changing anything.

## How to work with Richard

- Work in small steps, and explain one step at a time.  He prefers small chunks over a lot of information at once.
- Don't show code in chat unless he asks.  Make the change in the repo and describe it in plain language.
- Before adding anything big or new (a new library, a new feature, a new kind of control), suggest it and talk it over first.
- Write two spaces after every sentence-ending period, question mark, or exclamation point.  Prefer semicolons to em-dashes.
- Commit and push after each finished step.  Richard asked for the repo to stay in sync with GitHub (`bixgomez/varsity-theater`, branch `main`).
- If a number isn't in `MEASUREMENTS.md`, ask or mark it as a guess.  Don't invent measurements.

## Project basics

- Vite and Three.js (`npm install`, `npm run dev`, `npm run build`).  Needs Node 20.19 or newer.
- 1 Three.js unit = 1 inch.
- Axes: x runs south to north (0 to 179), y runs floor to ceiling (0 to 87), z runs west to east (0 to 128).  The windows are in the west wall (z = 0); the door is in the east wall (z = 128).
- The default camera looks down -z, so it faces the windows.
- `src/dimensions.js` holds the room, window, and door numbers.  Keep it in sync with `MEASUREMENTS.md`.
- `src/booth.js` builds the room; `src/fixtures.js` builds the closet, rewind table, conduit, duct, exhaust box, and control box; `src/outside.js` builds placeholder pieces outside the booth (see `MEASUREMENTS.md`, "Outside the booth"); `src/equipment/` holds the projector and stand; `src/walk-controls.js` handles walking and looking.
- Keyboard controls (walk, turn, move up and down, tilt, level) are listed in `README.md`.  Inside the booth the camera can't go within 3 in of the floor or 6 in of the ceiling; over the outside floor it also stays 3 in up.  The walls are solid except for the eight windows and the door, which you can fly through; `src/fly-space.js` defines where the camera may be.  Booth obstacles block from floor to ceiling, so you can't fly over a table or the projector.

## Design decisions already made

- **Viewing:** eye-level walk-through, not an orbit view.  It must work on a phone: drag to look, an on-screen thumbstick to walk.  Keep the touch controls working when you change anything.
- **Layout plan:** the Barco digital projector goes in the center (around window 4), with a 35mm projector on each side.  Each 35 needs room on its right side for a person to thread film.  About 75% of Grand Illusion's shows are digital.
- **New ports:** it's fine to cut new ports or replace window plates so they match where the projectors end up.  The existing ports are not fixed.
- **The stand:** Richard plans to build a sturdy stand himself.  Barco requires a 16 inch zone around the projector with nothing flammable or combustible, and table mounting only, so model the stand in steel.  Design it for at least 231 lb.
- **The control box** (the old wedge-shaped switch panel) will probably be removed, so it's low priority.
- **The equipment rack** in the northeast corner is out of scope for now.

## Guesses to replace with real numbers

- Wall thickness (4 in for every wall) and floor and ceiling thickness (8 in), both set by Richard.
- Eye height (67 in, 5'7", set by Richard).
- The Barco's lens position (estimated from Barco's front-view photo) and the lens barrel size, which depends on the lens.
- The stand (a simple steel table; the height is set so the lens lines up with window 4).
- Colors and lighting (rough matches to Richard's photos).
- The floor: pretend hardwood, drawn in `src/hardwood.js` (3 in boards running north-south, random lengths and colors; a 96 in tile whose rows wrap across its edge, so tiles interlock with no straight seam).  It is not a measurement of the real floor; it covers the booth and the outside floor so the boards line up.
- The control box width (24 in, Richard's estimate) and the exhaust box's position along the wall.
- The hallway east of the booth (52 in wide, the office jut, the opening into the office, floor and ceiling thickness): numbers Richard remembered, to be checked on site.  The 4 in interior wall thickness is measured.
- The 35mm projectors: Richard doesn't know their makes, models, or sizes yet.  Use clearly labeled placeholder boxes until he has real numbers.  What we'll need for each: footprint, height, where the lens sits, and which side the film is threaded from.

## Next steps

1. Make the Barco movable, so Richard can slide it between ports and change the stand height.
2. Add the 35mm projectors, as labeled placeholders if he still doesn't have their sizes.
3. Check the placeholder hallway on site with Richard, then rough in the balcony after he answers the open questions in `MEASUREMENTS.md`.  Then the finishing touches (see the plan in `README.md`).

## Publishing

Richard wants every change published, so after each commit pushed to `main`, do both of these:

1. **The public site** (https://bixgomez.github.io/varsity-theater/, served from the `gh-pages` branch; nothing updates it automatically).  Run `npm run build`, check out `gh-pages` in a separate worktree, replace its contents with the new `dist/` files, commit as "Publish build from <short sha of main>", and push the `gh-pages` branch.
2. **The phone preview** (see the next section).

## The phone preview

Richard views the model on his phone through a published page (a Claude artifact; slug `daacb2e0-8822-450f-995a-6984a080c724`).  It is not part of the build.  The artifact host only allows a few outside script sources and can't use npm, so the preview is a copy of the source that loads Three.js from a CDN.  To rebuild it:

1. Copy `index.html` and `src/` into a new folder.
2. In that copy's `index.html`, remove the `/src/...` absolute paths (use `./src/...`) and add this import map to the `<head>`:

   ```html
   <script type="importmap">
     { "imports": {
       "three": "https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js",
       "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/"
     } }
   </script>
   ```

3. Publish the folder's files (`index.html` and everything in `src/`) to the artifact.

Keep the Three.js version in the import map the same as the one in `package.json`.

## Checking your work

- `npm run build` must pass.
- For anything visual, render it in a headless browser and look at screenshots from a few angles.  `window.booth` exposes `scene`, `camera`, and `controls` for scripted tests.
- Check both a desktop-sized and a phone-sized viewport.
