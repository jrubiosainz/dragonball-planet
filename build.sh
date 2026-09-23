#!/bin/sh
# Rebuilds the single-file index.html from the numbered source parts in src/ (order matters: one shared module scope).
cd "$(dirname "$0")" || exit 1
P="src/p1_core.js src/p2_planet.js src/p3_world.js src/p4a_rig.js src/p4b_cast.js src/p5_vehicles.js src/p6_goku.js src/p7a_cam.js src/p7b_ui.js src/p7c_main.js"
{ cat src/p0_head.html $P; printf '\n</script>\n</body>\n</html>\n'; } > index.html
echo "built index.html ($(wc -c < index.html | tr -d ' ') bytes)"
