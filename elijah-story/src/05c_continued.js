// ---------- 15. TO BE CONTINUED (teaser) + scene order ----------
const SC_CONTINUED = { id: 'continued',
  music: [['orchestral', 0, 'card>', 1]],
  sfx: [['hands', 'sting'], [['q1', 1.6], 'heartbeat'], ['wed', 'sting'], [['wed', .3], 'bell'], [['wed', .9], 'bell'], ['foot', 'sting'], [['q3', 1.4], 'twig'], ['tbc', 'boom'], [['tbc', .3], 'sparkle'], [['card', 1.5], 'sparkle']],
  draw(c, t) {
    const q = (s, k) => bigText(c, s, 960, 240, 96, k, '#fff', { stroke: '#120a14' });
    if (!after('wed')) { // will they hold hands? two hands, almost...
      c.fillStyle = '#140c1c'; c.fillRect(0, 0, W, H); const g = c.createRadialGradient(960, 560, 50, 960, 560, 700); g.addColorStop(0, 'rgba(255,120,160,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      const k = easeOut(S('hands', 0, 3)), gap = lerp(500, 18, k), tr = Math.sin(t * 40) * 3 * k;
      for (const [sx, skin] of [[-1, '#ecb59c'], [1, '#f3c2a6']]) { c.save(); c.translate(960 + sx * gap / 2 + sx * 260, 580 + tr * sx); c.scale(-sx, 1);
        fillRR(c, 0, -60, 520, 120, 50, skin); for (let i = 0; i < 4; i++) fillRR(c, -150, -55 + i * 30, 170, 26, 13, skin); fillRR(c, -60, -95, 110, 30, 15, skin); c.restore(); }
      sparkle(c, 960, 520, 40 * k, k, t * 3); q('WILL THEY HOLD HANDS?', S('q1', 0, .5));
      if (after('q1', 1.8)) { c.fillStyle = `rgba(0,0,0,${S('q1', 1.8, 2.1)})`; c.fillRect(0, 0, W, H); }
    } else if (!after('foot')) { // will they get married?
      sky(c, '#ffe6ef', '#fff7fa'); c.fillStyle = '#f3e9e1'; c.fillRect(0, 760, W, 320); fillRR(c, 860, 760, 200, 320, 0, '#d62839');
      church(c, 960, 760, 1.4, t); for (let i = 0; i < 14; i++) { const k = (t * .4 + i / 14) % 1; c.save(); c.translate((i * 151) % W, k * 1000); c.rotate(t + i); ell(c, 0, 0, 10, 5, '#ff8fab'); c.restore(); }
      person(c, { who: 'elijah', look: 'trex', x: 760, y: 980, age: 'adult', shirt: '#111', outfit: 'tie', tie: '#111', pants: '#111', shoes: '#111', hearts: .7 });
      person(c, { who: 'emma', x: 1160, y: 980, age: 'woman', shirt: '#ffffff', skirt: '#ffffff', shoes: '#fff', hearts: .5 });
      floatingRing(c, 960, 420, 2); q('WILL THEY GET MARRIED?', S('q2', 0, .5));
      bigText(c, '?', 960, 640, 300, S('q2', 1, 1.5), '#ff4d6d', { stroke: '#fff' });
    } else if (!after('tbc')) { // will he ever find Bigfoot?
      forestNight(c, t); const sw = Math.sin(t * 1.3) * .6;
      const j = person(c, { who: 'elijah', look: 'trex', x: 760, y: 950, age: 'adult', shirt: '#4b6b3a', pants: '#5a4a2a', shoes: '#3a2a1a', handR: [.3, .05] });
      flashlight(c, j.handR.x, j.handR.y, -.15 + sw, 900, .25);
      // two eyes glowing in the trees, right where the light just missed
      const blink = Math.sin(t * 3) > -.9 ? 1 : 0; if (blink) for (const dx of [-16, 16]) { c.save(); c.shadowColor = '#ffe27a'; c.shadowBlur = 20; circ(c, 1500 + dx, 520, 7, '#ffe27a'); c.restore(); }
      if (after('q3', 1.4)) bigfoot(c, 1500, 790, .7, { a: .35 });
      q('WILL HE EVER FIND BIGFOOT?', S('q3', 0, .5));
    } else { // to be continued
      c.fillStyle = '#120a14'; c.fillRect(0, 0, W, H); const k = S('tbc', 0, .6);
      for (let i = 0; i < 16; i++) sparkle(c, 960 + Math.cos(i / 16 * TAU + t * .25) * 780, 540 + Math.sin(i / 16 * TAU + t * .25) * 400, 14 + 8 * Math.sin(t * 4 + i), k, t);
      // film strip
      c.save(); c.globalAlpha = k; for (const y of [120, 900]) { fillRR(c, 0, y, W, 60, 0, '#2a1f2e'); for (let x = ((t * 80) % 80) - 80; x < W; x += 80) fillRR(c, x + 20, y + 15, 40, 30, 6, '#120a14'); } c.restore();
      bigText(c, 'TO BE CONTINUED...', 960, 420, 150, k, '#ffd23f', { stroke: '#3a0a12' });
      bigText(c, 'Follow along as the story continues.', 960, 590, 58, S('tbc', .8, 1.3), '#fff');
      const icons = S('card', .5, 1.2); if (icons > 0) { c.save(); c.globalAlpha = icons;
        heart(c, 640, 760, 46, '#ff4d6d'); floatingRing(c, 960, 770, 1.6); c.save(); c.translate(1280, 760); ell(c, 0, 10, 34, 50, '#6b4423'); for (let i = 0; i < 5; i++) circ(c, -26 + i * 13, -48 + Math.abs(i - 2) * 6, 9, '#6b4423'); c.restore(); c.restore(); }
    }
  } };

const SCENES = [SC_SIN, SC_SISTERS, SC_BIGFOOT, SC_TRIANGLE, SC_EMMA, SC_ELI, SC_DRPEPPER, SC_ADAM, SC_ARIZONA, SC_GLIMMER, SC_TREX, SC_HANDS, SC_RING, SC_FINALE, SC_CONTINUED];
const TRANS = ['pageflip', 'wipe', 'iris', 'star', 'heart', 'diag', 'slide', 'pageflip', 'blinds', 'wipe', 'iris', 'spin', 'pageflip', 'iris'];
