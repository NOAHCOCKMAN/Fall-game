# Fall Apartment

A first-person, fully interactive 3D recreation of my apartment, built from a walkthrough video. Walk around, use almost everything, and redecorate it however you want. Layouts save in your browser so you can switch between decorations.

**Play:** open `index.html` in a browser (it loads three.js from a CDN, so it needs an internet connection). It also works on GitHub Pages.

## What's in it

- **Real floor plan:** the 785 sq ft 1 bed / 1 bath plan. Bedroom (13'5" x 11'1") and recessed balcony along the north side, living room (11'8" x 16') with French doors and a ceiling fan, a short hall, a bathroom with double vanity and corner glass shower, a walk-in closet behind it, an L-shaped kitchen with island, range wall, microwave and French-door fridge, and the washer/dryer and mechanical closets by the entry. Furniture and decor come from the walkthrough video, and finishes come from the listing photos.
- **Live a day:** five needs (hunger, energy, hygiene, bladder, fun) drain over time and show up as effects when low (slower walking and a dark vignette when exhausted, warnings when hungry or desperate for the bathroom). One real second is one game minute, and the sun rises and sets over the fall trees. Sleep to skip to morning or take a nap.
- **Things to do:** every door, cabinet, drawer and curtain opens. Brew espresso and drink it, cook on the burners, bake cookies, boil tea, heat leftovers, wash dishes, run the dishwasher, do a full laundry cycle, iron, brush your teeth, use the toilet, shower (the mirror fogs up), watch TV from the couch, play records, flip switches and the breaker, and more. A to-do list tracks 31 of these.
- **Things in your hand:** pick up mugs, plates and pizza. They show in your hand, and eating or drinking plays an animation.
- **Your phone (Tab):** order pizza, Thai, burgers or burritos (the doorbell rings and it is left outside the front door), play music, control lights and the lock, read texts.
- **Random events:** packages get delivered and friends text you.
- **Phone friendly:** on-screen joystick, drag to look, and touch buttons.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows | walk (Shift to run) |
| Mouse | look (click to lock; or click-and-drag) |
| E / click | use the thing you're aiming at |
| G | pick up · Q drop · F eat or drink what you hold |
| Tab | phone · T to-do list · L room lights · M mute · Esc menu |

## Development

Source lives in `src/` (`01_util.js` textures and synthesized audio, `02_catalog.js` furniture and decor, `03_apartment.js` the building, built-ins and outdoors, `04_main.js` engine, UI and saving, `template.html` the page shell). Run `python3 build.py` to bundle everything into `index.html`.

## Cocoa Slide

`cocoa-slide/index.html` is a separate game: a ride down a glowing hot chocolate slide through a snowy candy village at night, seen from the rider's seat (heart pajamas, fuzzy slippers and a mug of cocoa). Touch the screen and slide left or right to steer.

**World 1, Cocoa Village, has 15 levels.** Grab treats (stars, marshmallows, presents, candy canes) to earn 1, 2 or 3 stars. Each level shows its three targets before it starts. Levels 1-5 need 1 star to unlock the next level, 6-10 need 2 stars, and 11-15 need 3 stars. World 2 opens once every level has 3 stars. Later levels are faster (12 up to about 22) and speed up toward the end of each ride. Treats get scattered side to side and up against the walls, lanes switch and split, and from level 3 grumpy snow blocks knock 3 treats out of your mug if you hit them. Each level hides one golden star worth 3. Star targets are set from the best score a perfect run could get, so every level can be beaten. Each level's layout is fixed so it can be learned. Progress is saved in the browser.

Each ride ends by flying off the slide into a hot cocoa lake; a wave of chocolate covers the screen and the results card shows your stars with Retry, Next and Levels buttons. Santa's sleigh flies overhead during each ride, and Jingle Bells, We Wish You a Merry Christmas and Deck the Halls play, all synthesized in the browser. Open the file in a browser (it loads three.js from a CDN).
