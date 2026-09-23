# Dragon Ball Planet · Three.js

A cartoony, comic-style Dragon Ball world on a tiny planet, made with plain [Three.js](https://threejs.org/) (r169) in a single HTML file: no bundler, no framework, no asset files. The terrain, buildings, characters, dinosaurs and vehicles are all generated in code and drawn with toon shading and ink outlines.

Orbit the globe and zoom down to street level, or jump on the Flying Nimbus and fly as Goku.

## Run it

Open `index.html` in a modern browser with WebGL 2. If your browser refuses to run it from disk, serve the folder instead:

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

It needs an internet connection: Three.js loads from jsDelivr and the comic fonts from Google Fonts.

Add `?q=low`, `?q=med` (default) or `?q=high` to the URL to change the rendering quality.

## What's on the planet

- **17 places:** West City, Capsule Corp., Kame House, Korin Tower, Kami's Lookout, Goku's House, Mt. Paozu, Buu's House, World Tournament, Cell Games Arena, Saiyan Pods, Frieza's Ship, Volcano, Dinosaur Jungle, Wasteland, Snow Peaks and King Kai's Planet.
- **Characters:** Goku, Vegeta, Piccolo, Future Trunks, Krillin, Bulma, Android 18, Master Roshi, Oolong, Turtle, Chi-Chi, Goten, Raditz, Majin Buu, a Great Ape, Frieza, King Kai with Bubbles and Gregory, and West City's citizens.
- **Dinosaurs:** T-Rex, Triceratops, Brachiosaurus and Pterodactyls.
- **Traffic:** cars and hover-cars in West City, prop planes, jets with contrails, the Capsule Corp. blimp and the Capsule Jet.
- **Scenery:** puffy clouds, an erupting volcano, the moon, and a sky that fades into starry space as you zoom out.

## Controls

**Orbit (default)**

| Input | Action |
|---|---|
| Drag | spin the planet / pan |
| Right-drag or Shift+drag | rotate and tilt |
| Wheel, Z / X | zoom |
| Double-click | swoop down to that spot |
| Click a character | follow and chat |
| W A S D or arrows, Q / E | pan, turn |
| World Tour panel | jump to a place or follow a character |
| G | fly with Goku |
| Esc, H | stop following, toggle help |

**Flying as Goku**

| Input | Action |
|---|---|
| W / S or ↑ / ↓ | forward / back |
| A / D or ← / → | turn |
| Space or E, Q or C | up, down |
| Shift | boost |
| Hold K (or F), release | charge and fire a Kamehameha |
| T | transform (Super Saiyan) |
| N | jump off / on the Nimbus |
| Click a place in the tour panel | Instant Transmission |
| Drag, Wheel | look around, camera distance |
| G | back to orbit |

**Dragon Balls:** collect all 7 using the Dragon Radar to summon Shenron, then pick a wish with keys 1–4 or by clicking: Super Saiyan 3, fireworks over West City, more dinosaurs, or eternal life.

## Source layout

`index.html` is generated from the numbered parts in `src/`, which all share one module scope. After editing a part, rebuild it with:

```sh
./build.sh
```

| File | Contents |
|---|---|
| `p0_head.html` | page, CSS, HUD markup, import map, error safety net |
| `p1_core.js` | utilities, noise, renderer and scene, toon and ink materials, geometry builder |
| `p2_planet.js` | planet layout, terrain, water, sky, moon, clouds |
| `p3_world.js` | particles, vegetation, rocks, West City, landmarks |
| `p4a_rig.js` | character and creature rigs, poses, cast definitions |
| `p4b_cast.js` | entities and behaviours, the cast, King Kai's planet |
| `p5_vehicles.js` | vehicles, Dragon Balls and radar, Shenron, fireworks |
| `p6_goku.js` | Goku: Nimbus NPC and player flight |
| `p7a_cam.js` | camera rig: orbit, chase cam, cinematics |
| `p7b_ui.js` | labels, comic pops, speech bubbles, tour, help, speed lines |
| `p7c_main.js` | LOD, environment, input, main loop, boot |

---

Fan-made tribute, not affiliated with or endorsed by the Dragon Ball rights holders. All models are built from primitives in code; no franchise assets are included.
