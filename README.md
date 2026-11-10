# Fall Apartment

A first-person, fully interactive 3D recreation of my apartment, built from a walkthrough video. Walk around, use almost everything, and redecorate it however you want. Layouts save in your browser so you can switch between decorations.

**Play:** open `index.html` in a browser (it loads three.js from a CDN, so it needs an internet connection). It also works on GitHub Pages.

## What's in it

- **Real floor plan:** the 785 sq ft 1 bed / 1 bath plan. Bedroom (13'5" x 11'1") and recessed balcony along the north side, living room (11'8" x 16') with French doors and a ceiling fan, a short hall, a bathroom with double vanity and corner glass shower, a walk-in closet behind it, an L-shaped kitchen with island, range wall, microwave and French-door fridge, and the washer/dryer and mechanical closets by the entry. Furniture and decor come from the walkthrough video, and finishes come from the listing photos.
- **Interactions:** every door, cabinet, drawer and curtain opens. Brew espresso and drink it, cook eggs, pancakes, bacon or grilled cheese on the burners, bake cookies, boil the kettle for tea, heat leftovers, wash the dishes, run the dishwasher, do a full laundry cycle, iron, shower (the mirror fogs up), flush, flip light switches and fans, trip the main breaker, change the thermostat, watch TV (4 channels), play music, sleep to switch day and night, open presents, feed the fish, and more. There's a to-do list of 28 things to try.
- **Decorating (press `B`):** move, rotate, recolor, duplicate or delete any furniture or decor. Add from a catalog of 70+ items (`Tab`). Repaint walls and change flooring per room. Undo with `Z`.
- **Saved layouts:** name and save decorations, load or overwrite them later, reset to the real apartment, start from empty, or copy a layout code to back up or share.
- **Phone friendly:** on-screen joystick, drag to look, and touch buttons.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows | walk (Shift to run) |
| Mouse | look (click to lock; or click-and-drag) |
| E / click | use the thing you're aiming at |
| G | pick up small items · F eat/drink what you hold |
| B | build & decorate mode · Tab catalog, walls & floors, layouts |
| R / Q | rotate (Shift = 90°) · mouse wheel rotates held items |
| X | delete · C duplicate · V recolor · Z undo · P grid snap |
| N | day/night · L room lights · T to-do list · M mute · Esc menu |

## Development

Source lives in `src/` (`01_util.js` textures and synthesized audio, `02_catalog.js` furniture and decor, `03_apartment.js` the building, built-ins and outdoors, `04_main.js` engine, UI and saving, `template.html` the page shell). Run `python3 build.py` to bundle everything into `index.html`.
