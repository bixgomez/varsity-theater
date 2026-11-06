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
- `src/booth.js` builds the room; `src/fixtures.js` builds the closet, rewind table, conduit, duct, exhaust box, and control box; `src/equipment/` holds the projector and stand; `src/walk-controls.js` handles walking and looking.
- Keyboard controls (walk, turn, move up and down, tilt, level) are listed in `README.md`.  The camera can't go below the floor or within 6 in of the ceiling.  Collisions only look at the floor plan, so you can't fly over a table or the projector.

## Design decisions already made

- **Viewing:** eye-level walk-through, not an orbit view.  It must work on a phone: drag to look, an on-screen thumbstick to walk.  Keep the touch controls working when you change anything.
- **Layout plan:** the Barco digital projector goes in the center (around window 4), with a 35mm projector on each side.  Each 35 needs room on its right side for a person to thread film.  About 75% of Grand Illusion's shows are digital.
- **New ports:** it's fine to cut new ports or replace window plates so they match where the projectors end up.  The existing ports are not fixed.
- **The stand:** Richard plans to build a sturdy stand himself.  Barco requires a 16 inch zone around the projector with nothing flammable or combustible, and table mounting only, so model the stand in steel.  Design it for at least 231 lb.
- **The control box** (the old wedge-shaped switch panel) will probably be removed, so it's low priority.
- **The equipment rack** in the northeast corner is out of scope for now.
- **The fire shutters** on windows 2 and 8 are sliding panels, modeled closed.

## Guesses to replace with real numbers

- Wall thickness (6 in for the west wall, 4 in for the others).
- Eye height (67 in, 5'7", set by Richard).
- The Barco's lens position (estimated from Barco's front-view photo) and the lens barrel size, which depends on the lens.
- The stand (a simple steel table; the height is set so the lens lines up with window 4).
- Colors and lighting (rough matches to Richard's photos).
- The control box width (24 in, Richard's estimate) and the exhaust box's position along the wall.
- The 35mm projectors: Richard doesn't know their makes, models, or sizes yet.  Use clearly labeled placeholder boxes until he has real numbers.  What we'll need for each: footprint, height, where the lens sits, and which side the film is threaded from.

## Next steps

1. Make the Barco movable, so Richard can slide it between ports and change the stand height.
2. Add the 35mm projectors, as labeled placeholders if he still doesn't have their sizes.
3. Build the door (hinged on the closet side, opens into the booth).  Then the finishing touches (see the plan in `README.md`).

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
