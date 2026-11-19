# Varsity Theater

A Three.js model of the Grand Illusion Cinema's new home at the Varsity Theatre in Seattle's U District.  It starts with the projection booth; more to come.

## Units and directions

- 1 Three.js unit = 1 inch.
- The booth's windows face west, toward the auditorium.  The door is on the east wall.

See `MEASUREMENTS.md` for the booth measurements.

## Running it

You need Node.js 20.19 or newer.

```sh
npm install
npm run dev
```

Then open the local address Vite prints (usually http://localhost:5173).

- `npm run build` makes a production build in `dist/`.
- `npm run preview` serves that build locally.

## Viewing

You walk through the booth at eye level, as if you were standing in it.  It works on a computer and on a phone.

- **Computer:** drag to look; use the keyboard to move (see below).  On a trackpad, spread two fingers apart to walk forward and pinch them together to walk back.  Drag two fingers up or down to rise or sink, and left or right to slide sideways.
- **Help:** the ? button in the top right opens a panel with every control and a short overview of the booth.  Esc or the close button hides it.
- **Menu:** the Menu button next to the ? opens a dropdown with Return home and the Show toggles, on every screen size.  Esc closes it, and so does Return home.
- **Return home:** the Return home button in the Menu, or `H`, glides you back to where you started over about 2.5 seconds.
- **Phone:** drag to look; use the on-screen thumbstick to walk.  Spread two fingers apart to walk forward and pinch them together to walk back.  Drag with three fingers to move up and down or slide sideways.

| Key | Action |
| --- | --- |
| Up arrow or `W` | Walk forward |
| Down arrow or `S` | Walk backward |
| `A` | Strafe left |
| `D` | Strafe right |
| Left arrow | Turn left |
| Right arrow | Turn right |
| `E` or Shift + Up arrow | Move up |
| `Q` or Shift + Down arrow | Move down |
| Shift + Left arrow | Strafe left |
| Shift + Right arrow | Strafe right |
| `Z` or Ctrl/Option + Up arrow | Tilt the view up |
| `C` or Ctrl/Option + Down arrow | Tilt the view down |
| `X` | Smoothly level the view |
| `H` | Return home (glide back to the start view) |

Moving up and down changes your eye height; you always stay at least 3 in above the floor, inside the booth and over the outside floor, and inside the booth you can't go up through the ceiling.

You can't walk through the walls, the projector, the electrical closet, or the rewind table.

Refreshing the page puts you back where you were, facing the same way, with the same Show switches off.  This lasts for that browser tab only; a new tab starts at the home view.  You can fly out of the booth through any of the eight windows or the door, and back in the same way; line up with an opening and use Q and E to get to its height.  Window 4 is blocked by the Barco in front of it.  Outside there's nothing modeled yet, just empty space up to about 50 ft from the booth.

## What's in the model so far

- **Done:** the empty room, with the eight window openings in the west wall and the door opening in the east wall.
- **Done:** the Barco SP4K-12C projector, with its lens lined up on window 4, on a placeholder steel stand.
- **Done:** the electrical closet (a plain block) and the rewind table (a simple table; the shelves above it are not measured yet).
- **Done:** the conduit ledge and vertical conduit on the west wall, and the duct and exhaust box in the ceiling.  The vertical conduit's top height and the exhaust box's position along the wall are guesses.
- **Done:** the wedge-shaped control box on the conduit ledge (plain; no switches yet).
- **Done:** the open door, and the shelves and wall clock on the east wall.
- **Rough:** a placeholder for the hallway east of the booth (52 in wide, with the office jut and its opening), from remembered numbers.  Its walls are light gray (the real ones are painted white) and its ceiling is the same soft white as the booth ceiling.  The balcony and the doorway north of the booth aren't modeled yet.
- **Not yet:** 35mm projectors and finishing touches (colors, lighting).

## Plan

The goal is to decide where the Barco and the two 35mm projectors go.  The current idea is the digital projector in the center, with a 35 on each side and room to thread film on the right of each 35.

1. Make the Barco movable, so you can slide it between ports and change the stand height.
2. Add the 35mm projectors (their sizes aren't known yet, so they start as placeholders).
3. Check the hallway numbers on site, then rough in the balcony once the open questions in `MEASUREMENTS.md` are answered.
4. Finishing touches.

## Guesses

Some numbers are placeholders until they're measured: wall, floor, and ceiling thickness, eye height, the Barco's lens position and lens size, the stand, the floor's hardwood look (pretend boards, 3 in wide, running north-south), the control box width, and the 35mm projectors' sizes.  `AGENTS.md` has the full list.

## For AI assistants

`AGENTS.md` has the working notes, decisions so far, and how to rebuild the phone preview.
