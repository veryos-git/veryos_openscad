# Research: magnetic puppet theatre

Question (2026-11-21): does this concept exist, and has anyone implemented it
with articulated 3D models, the so-called "3D printed dragons"?

Short answer: the **mechanism** is a century old and was patented and sold as a
toy theatre several times. The **articulated FDM part** — moving a
print-in-place model with a magnet under a thin printed stage — was not found
as an open, parametric design. The closest printed thing is a finger-puppet
play, which needs no magnet and no string (found by the user, see below).

## What exists

| source | what it is | mechanism |
|---|---|---|
| [US1396046](https://patents.google.com/patent/US1396046A/en), E. S. Moore, 1919/1921 | "Toy theater": a hollow cardboard stage, a horseshoe magnet on a long handle inserted between its upper and lower walls; the figures carry a paper clip on their base | magnet under a thin stage, moved by hand |
| [US2637138](https://patents.google.com/patent/US2637138A/en), Doran, 1951/1953 | "Doll stage construction": a stage platform of "relatively strong, thin, non-magnetic sheet material", an operating recess for the hand and forearm, a magnet slid along the underside, dolls with a bar-magnet or iron base | magnet under a thin stage, moved by hand |
| [US3422562](https://patents.google.com/patent/US3422562A/en), 1969 | "Toy theater" with play pieces on a magnetic base | magnet under the stage |
| [FR2619021](https://patents.google.com/patent/FR2619021A1/en), 1989 / [US4804348](https://patents.google.com/patent/US4804348A/en) | animated puppet theatre | another take on the same idea |
| [US20190126162A1](https://patents.google.com/patent/US20190126162A1/en), 2017/2019, abandoned; [US11325049B1](https://patents.google.com/patent/US11325049B1/en), 2022 | "Toy theater": elevated stage, magnetic characters with a magnet in the base, an operator magnet below, scenery on magnetically receptive walls; the poles align the character | closest modern patent; magnet under a thin stage |
| Detoa Albrechtice "Magnetic Play Theatre", 1960s–80s ([listing](https://www.worthpoint.com/worthopedia/detoa-albrechtice-magnetic-play-1891967511)) | wooden theatre, five figures with magnets, two rods with magnets that move them from beneath the floor | commercial toy, rods under a thin floor |
| [Lilliputiens 3 Little Pigs Magnetic Theatre](https://pinkpoppies.com.au/products/lilliputiens-3-little-pigs-magnetic-theatre) | four magnetised wooden figures, two magnetic sticks slid under the play surface | current commercial toy |
| [Three Little Pigs Finger Puppet Play](https://www.printables.com/model/699802-the-three-little-pigs-finger-puppet-play), Printables 699802 (the user's find) | figures with cylindrical holes on the fingers, a printed stage | no magnet, no string; the hand is the mechanism |

Articulated models with magnets, all using them for mounting, not for moving:

| model | magnet |
|---|---|
| [Articulated Dragon 034, keychain and magnetic](https://www.printables.com/model/1832126-articulated-dragon-034-medium-version-keychain-mag) | slots for 5 mm magnets |
| [Magnetic Articulated Skeleton Dragon](https://www.printables.com/model/391974-magnetic-articulated-skeleton-dragon) | holes for 5 × 3 mm magnets |
| [Flexi Skeleton Dragon "Magnet Pal"](https://creativelycubic.com/wholesale/flexi-skeleton-dragon/) | embedded magnet and backers for wear and display |
| [Flexi Dragon Fidget Toy](https://global3d.com.au/products/flexi-dragon-toy) | an 8 × 2 mm magnet version for the fridge |
| [Kekreations Flexi Dragon Shoulder Puppet](https://www.patreon.com/Kekreations3D/posts/boutique-flexi-109984797) | a print that is a puppet, but posed with fishing line and hinge pins, not a magnet |

## What was not found

No open-source, parametric magnetic puppet theatre for print-in-place FDM
models. The searches combined "magnetic puppet theatre", "magnet under stage",
"articulated dragon magnet" and the German terms; the toy theatres above and
the magnet-ready dragons came up, but no printed mechanism that drags an
articulated printed model from below.

## What the sources say about the design

- **Thin stage, smooth underside.** The 1953 patent is explicit: the platform
  is a thin non-magnetic sheet, the underside is smooth and free of
  obstructions, and the platform is supported only at its margins, so the
  magnet reaches the whole surface. This design uses 2.0 mm for the top, a rim
  under the edge, and four corner legs; the middle of the underside is clear.
- **The hand needs room.** The 1953 patent asks for a recess for the hand and
  forearm. 110 mm under the top is enough for a flat arm on a desk; the
  operator sits in front of the stage.
- **Orientation.** Two round disc magnets give no preferred rotation about
  their axis, so a puppet can spin. The 1953 patent puts a *bar* magnet (or an
  iron block) in the doll's base; the 2018 patent says the poles align the
  figure. A bar magnet in this pad cannot be printed as a horizontal pocket
  without support; two disc pairs side by side would do the same and are the
  next step if the test shows the puppet turning.
- **The gap decides.** A neodymium disc's pull falls steeply with distance:
  Supermagnete lists 1.8 kg for a Ø10 × 3 N42 on steel in contact and only
  360 g sideways ([datasheet](https://www.supermagnete.ch/eng/disc-magnets-neodymium/disc-magnet-10mm-3mm_S-10-03-N));
  totalElement's [air-gap chart](https://totalelement.com/blogs/about-neodymium-magnets/how-air-gaps-impact-magnet-strength)
  shows how fast it drops. The design keeps the faces 2.84 mm apart (2.0 stage
  + 0.6 base floor + 0.2 pad recess + 0.04 print gap) and prints the puppet's
  magnet 0.6 above the play face, not deeper.
- **Friction is the limit.** The magnet pulls the puppet down by the same force
  it uses to drag it, so the slide needs the sideways fraction of the pull
  (about 0.4 here) to beat μ × (weight + pull). A smooth play face, a light
  puppet, and the pull as large as the pad allows are the levers. This is why
  the stage's play face is printed on the bed and not textured.

## This design against the prior art

| | old toy theatres | this |
|---|---|---|
| figures | flat cut-outs or rigid dolls on a magnetic base | print-in-place articulated models, dragged by a base glued under the belly |
| stage | cardboard, plywood or plastic sheet | 2.0 mm FDM top, rim, four legs, one print |
| operator | a loose magnet on a stick | a two-part arm that rests on the desk, its head pressed to the underside by the magnet, so the gap stays fixed |
| source | manufactured | one parametric OpenSCAD file, magnets and printer |

The arm is the part that is not in the old patents: its height comes from the
stage's own parameters, and the magnet holds it against the underside, so the
operator does not have to judge the distance.
