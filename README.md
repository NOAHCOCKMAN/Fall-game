# Fall Apartment

A first-person, fully interactive 3D recreation of my apartment, built from a walkthrough video. Walk around, use almost everything, and redecorate it however you want. Layouts save in your browser so you can switch between decorations.

**Play:** open `index.html` in a browser (it loads three.js from a CDN, so it needs an internet connection). It also works on GitHub Pages.

## What's in it

- **Layout from the video:** entry with smart lock, stacked washer/dryer closet, coat closet, open kitchen (island with sink and dishwasher, range, microwave, French-door fridge, pendants), living room (cream sofa, gallery prints with picture lights, Christmas tree, swivel chairs and bistro table, TV over the media console, coffee bar sideboard), balcony overlooking the parking lot, pond and fall trees, a hallway with the breaker panel and thermostat, a bathroom with vanity, toilet and glass shower, a walk-in closet, and the bedroom (cane headboard, Monet painting, scalloped lamps, arched cabinet, dresser with photos, desk).
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
