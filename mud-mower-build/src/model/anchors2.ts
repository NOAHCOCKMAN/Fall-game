import type { Vec3 } from '../steps/types';
import type { AnchorDef } from './anchors';
import { FRONT, ENGINE, REAR } from './geom';
import { CAGE_PROFILE } from './builders/cage';
import { STEER } from './builders/steering';

// Anchors for Phases 3–9 (see anchors.ts for conventions). Generated from the shared geometry.
const A = (pts: Vec3[], o: Omit<AnchorDef, 'pts'> = {}): AnchorDef => ({ pts, ...o });
const W = (pts: Vec3[], o: Omit<AnchorDef, 'pts' | 'space'> = {}): AnchorDef => ({ pts, space: 'world', ...o });
const In = (space: string, pts: Vec3[], o: Omit<AnchorDef, 'pts' | 'space'> = {}): AnchorDef => ({ pts, space, ...o });
const S = (pairs: Vec3[][], o: Omit<AnchorDef, 'pts' | 'segs'> = {}): AnchorDef => ({ pts: pairs.flat() as Vec3[], segs: true, ...o });
const mirror = (pairs: Vec3[][]): Vec3[][] => [...pairs, ...pairs.map(p => p.map(([x, y, z]) => [-x, y, z] as Vec3))];
const ring = (c: Vec3, r: number, plane: 'yz' | 'xy', n = 10): Vec3[] => Array.from({ length: n + 1 }, (_, i) => {
  const a = (i / n) * Math.PI * 2;
  return plane === 'yz' ? [c[0], c[1] + Math.cos(a) * r, c[2] + Math.sin(a) * r] : [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, c[2]];
});

const [, BY, BZ] = FRONT.beamRel;
const AP = FRONT.apex;
const T = REAR.axleY;
const armIn = FRONT.steerArm * Math.sin(Math.atan2(FRONT.kpX, FRONT.wheelbase));
const armBack = FRONT.steerArm * Math.cos(Math.atan2(FRONT.kpX, FRONT.wheelbase));
const wheelY = AP[1] + BY - FRONT.spindleDrop;      // front wheel center, vehicle-local
const lugs = (x: number, r = 2.2): Vec3[] => [[x, r, 0], [x, -r, 0], [x, 0, r], [x, 0, -r]];   // cross pattern order
const kn = (sd: 1 | -1, space: string): Record<string, AnchorDef> => {
  const s = sd > 0 ? '' : 'L';
  return {
    [`seam.knuckle${s}.tubeToPlate`]: In(space, [[sd * 0.52, -2.75, 1.52], [sd * 0.52, 1.5, 1.52], [sd * 0.52, -2.75, -1.52], [sd * 0.52, 1.5, -1.52]], { segs: true }),
    [`seam.knuckle${s}.spindle`]: In(space, ring([sd * 0.92, -FRONT.spindleDrop, 0], 0.45, 'yz')),
    [`seam.knuckle${s}.gussets`]: In(space, [[sd * 0.9, -1.0, 0.14], [sd * 2, -1.0, 0.14], [sd * 0.9, -2.5, 0.14], [sd * 2, -2.5, 0.14]], { segs: true }),
    [`seam.knuckle${s}.steerArm`]: In(space, sd > 0 ? [[-0.5, -1.2, -0.45], [0.2, -1.2, 0.5], [-0.45, 1.0, 0.1], [0.45, 1.0, 0.1]] : [[0.5, -1.2, -0.45], [-0.2, -1.2, 0.5]], { segs: true }),
  };
};

export const anchors2: Record<string, AnchorDef> = {
  // ---------- 3.1 transaxle (labels at the exploded positions) ----------
  'tx.forks': In('transaxle2300', [[0, 18.8, 3.5]]),
  'tx.diff': In('transaxle2300', [[0, 3.5, 16]]),
  'tx.bushings': In('transaxle2300', [[-14, 1.6, 0]]),
  'tx.seals': In('transaxle2300', [[16.6, 1.6, 0]]),
  // ---------- 3.2 lift ----------
  'pt.dropTop': A([[-7.6, 9.5, 5.6]]), 'pt.dropBottom': A([[-7.6, 6.5, 5.6]]),
  'seam.rearLiftL': S([[[-6.72, 12.5, -5], [-6.72, 12.5, 5]], [[-6.72, 9.5, -5], [-6.72, 12.5, -5]], [[-6.72, 9.5, 5], [-6.72, 12.5, 5]], [[-7.6, 9.45, 0], [-6.72, 9.45, 0]]]),
  'seam.rearLiftR': S([[[6.72, 12.5, -5], [6.72, 12.5, 5]], [[6.72, 9.5, -5], [6.72, 12.5, -5]], [[6.72, 9.5, 5], [6.72, 12.5, 5]], [[7.6, 9.45, 0], [6.72, 9.45, 0]]]),
  'fast.transMountNewL': A([[-6.8, 8, -4], [-6.8, 8, 4]], { normal: [-1, 0, 0] }),
  'fast.transMountNewR': A([[6.8, 8, -4], [6.8, 8, 4]], { normal: [1, 0, 0] }),
  'pt.transCase': A([[7.5, T + 4, -7]]),
  // ---------- 3.3 / 3.4 rear hubs + wheels (transaxle space) ----------
  'fast.hubRearL.set': In('transaxle2300', [[-REAR.hubX, 1.6, 0]]), 'fast.hubRearR.set': In('transaxle2300', [[REAR.hubX, 1.6, 0]]),
  'fast.hubRearL.ret': In('transaxle2300', [[-REAR.hubX - 1.4, 0, 0]], { normal: [-1, 0, 0] }), 'fast.hubRearR.ret': In('transaxle2300', [[REAR.hubX + 1.4, 0, 0]], { normal: [1, 0, 0] }),
  'laser.runoutA': In('transaxle2300', [[-REAR.discX - 0.3, 3.6, -6]]), 'laser.runoutB': In('transaxle2300', [[-REAR.discX - 0.3, 3.6, 6]]),
  'meas.trackRear34': In('transaxle2300', [[-REAR.wheelX, 15, 0], [REAR.wheelX, 15, 0]]),
  'fast.lugsRL': In('transaxle2300', lugs(-REAR.wheelX - 0.25), { normal: [-1, 0, 0] }),
  'fast.lugsRR': In('transaxle2300', lugs(REAR.wheelX + 0.25), { normal: [1, 0, 0] }),
  'shop.standsPark1': W([[52, 0, 34]]), 'shop.standsPark2': W([[61, 0, 34]]), 'shop.standsPark3': W([[70, 0, 34]]), 'shop.standsPark4': W([[79, 0, 34]]),
  'pt.swingPivot': A([[0, 4.5, 12]]),
  // ---------- 4.1 beam (axleBeam space: origin = wishbone apex) ----------
  'bench.beam': W([[100, 35.2 - BY, -BZ]]),
  'cut.beamOffcut': In('axleBeam', [[11, BY + 1.05, BZ - 1], [11, BY + 1.05, BZ + 1]], { normal: [0, 1, 0] }),
  'seam.beamCaps': In('axleBeam', [[-11.2, BY - 1, BZ + 1.03], [-11.2, BY + 1, BZ + 1.03], [11.2, BY - 1, BZ + 1.03], [11.2, BY + 1, BZ + 1.03]], { segs: true }),
  'axis.kingpinL': In('axleBeam', [[-FRONT.kpX - 2, BY + 2.6, BZ]]),
  'seam.kpEarsL': In('axleBeam', [[-11.05, BY + 1.57, BZ - 1.5], [-11.05, BY + 1.57, BZ + 1.5], [-11.05, BY - 1.57, BZ - 1.5], [-11.05, BY - 1.57, BZ + 1.5]], { segs: true }),
  'seam.kpEarsR': In('axleBeam', [[11.05, BY + 1.57, BZ - 1.5], [11.05, BY + 1.57, BZ + 1.5], [11.05, BY - 1.57, BZ - 1.5], [11.05, BY - 1.57, BZ + 1.5]], { segs: true }),
  'seam.beamTabs': In('axleBeam', [[-11.5, BY + 1.03, BZ + 0.2], [-10.5, BY + 1.03, BZ + 0.2], [10.5, BY + 1.03, BZ + 0.2], [11.5, BY + 1.03, BZ + 0.2], [9.4, BY, BZ + 1.03], [10.6, BY, BZ + 1.03]], { segs: true }),
  'meas.kingpins': In('axleBeam', [[-FRONT.kpX, BY + 4.5, BZ], [FRONT.kpX, BY + 4.5, BZ]]),
  // ---------- 4.2 knuckles ----------
  'bench.knuckle': W([[100, 38, -2]]), 'bench.knuckleL': W([[86, 38, 3]]),
  'kn.tube': In('knuckleR', [[0, 1.8, 0]]), 'kn.bush': In('knuckleR', [[0, 2.2, 6]]), 'kn.plate': In('knuckleR', [[5.7, 1.8, 0]]),
  'kn.spindle': In('knuckleR', [[11.4, -1.6, 0]]), 'kn.gussets': In('knuckleR', [[6.5, -4.2, 4]]), 'kn.arm': In('knuckleR', [[-armIn, -1, -armBack - 7]]),
  'kn.drag': In('knuckleR', [[-10.3, 7.6, 0]]),
  ...kn(1, 'knuckleR'), ...kn(-1, 'knuckleL'),
  'meas.knuckleDrop': In('knuckleR', [[1.6, 0, 0.8], [1.6, -FRONT.spindleDrop, 0.8]]),
  'line.ackermannR': In('knuckleR', [[0, -1.2, 0], [-armIn * 9.4, -1.2, -armBack * 9.4]]),
  'stage.beam': A([[AP[0], AP[1] - 5, AP[2]]]),
  'pt.zerkR': In('knuckleR', [[0, 0, -0.9]]),
  'pt.hubR': In('hubFrontR', [[1.6, 1.8, 0]]),
  'fast.lugsFL': In('hubFrontL', lugs(-0.95), { normal: [-1, 0, 0] }), 'fast.lugsFR': In('hubFrontR', lugs(0.95), { normal: [1, 0, 0] }),
  // ---------- 4.4 wishbone + panhard ----------
  'seam.wishbone.beam': In('axleBeam', mirror([[[-10.6, BY + 0.55, BZ - 1.05], [-9.4, BY + 0.55, BZ - 1.05]], [[-10.6, BY - 0.55, BZ - 1.05], [-9.4, BY - 0.55, BZ - 1.05]]]).flat() as Vec3[], { segs: true }),
  'seam.wishbone.apex': In('axleBeam', ring([0, 0, 2.2], 0.62, 'xy')),
  'pt.kpL': In('axleBeam', [[-FRONT.kpX, BY + 1, BZ]]), 'pt.kpR': In('axleBeam', [[FRONT.kpX, BY + 1, BZ]]),
  'fast.panhardFrame': A([[-6.7, 7.8, 48.5]], { normal: [-1, 0, 0] }),
  'fast.panhardBeam': In('axleBeam', [[10, 7.8 - AP[1], BZ + 1.5]], { normal: [1, 0, 0] }),
  'pt.frontAxleNew': A([[0, AP[1] + BY + 4, AP[2] + BZ]]),
  // ---------- 4.5 coilovers ----------
  'seam.shockTowers': S(mirror([[[-8.4, 12.55, 45.7], [-6.5, 12.55, 45.7]], [[-8.4, 12.55, 48.3], [-6.5, 12.55, 48.3]]])),
  'fast.coilTop': A([[-8, FRONT.towerY, 47], [8, FRONT.towerY, 47]], { normal: [0, 0, 1] }),
  'fast.coilLower': In('axleBeam', [[-11, BY + 1.5, BZ], [11, BY + 1.5, BZ]], { normal: [0, 0, 1] }),
  'pt.apexGauge': A([[-12, AP[1] + 3, AP[2] + 20]]),
  // ---------- 4.6 / 4.7 steering ----------
  'laser.steerA': A([STEER.hub]), 'laser.steerB': A([FRONT.pitman]),
  'fast.pitmanPin': A([[FRONT.pitman[0], FRONT.pitman[1] + 0.6, FRONT.pitman[2]]]),
  'fast.tieRodL': In('knuckleL', [[armIn, -1.2, -armBack]]), 'fast.tieRodR': In('knuckleR', [[-armIn, -1.2, -armBack]]),
  'fast.dragPitman': In('pitmanArm', [[3.5, -0.4, -0.8]]), 'fast.dragKnuckle': In('knuckleR', [[-4.3, 2.3, 0]]),
  'pt.clearL': A([[-10, 9, 33]]), 'pt.clearR': A([[10, 9, 33]]),
  // ---------- 4.8 alignment ----------
  'toeL.a': In('hubFrontL', [[-4.9, 0, -15]]), 'toeL.b': In('hubFrontL', [[-4.9, 0, 26]]),
  'toeR.a': In('hubFrontR', [[4.9, 0, -15]]), 'toeR.b': In('hubFrontR', [[4.9, 0, 26]]),
  'meas.toeFront': A([[-16, wheelY, 58.5], [16, wheelY, 58.5]]), 'meas.toeRear': A([[-16, wheelY, 35.5], [16, wheelY, 35.5]]),
  // ---------- 5.x drivetrain ----------
  'axis.transInputNew': A([[0, ENGINE.transInput[1], 6], [0, ENGINE.transInput[1], 16]]),
  'axis.crankNew': A([[0, ENGINE.crankY, 30], [0, ENGINE.crankY, 56]]),
  'shop.standsRearUp3': W([[-5.9, 0, -6]]), 'shop.standsRearUp4': W([[5.9, 0, -6]]),
  'bench.engine': W([[100, 34.1, 0]]),
  'pt.benchExhaust': In('predator420', [[-5.5, 11, 2]]),
  'holes.mountSlots': A([[-4, 12.77, 39.5], [4, 12.77, 39.5], [-4, 12.77, 52], [4, 12.77, 52]]),
  'fast.mountPlate': A([[-4.6, 12.8, 38], [4.6, 12.8, 38], [-4.6, 12.8, 53], [4.6, 12.8, 53]]),
  'fast.engineBolts': A([[-5, 12.8, 40.5], [5, 12.8, 40.5], [-5, 12.8, 49.5], [5, 12.8, 49.5]]),
  'pt.engineSide': A([[-5.75, 24, 45]]), 'pt.cageLine': A([[-6.5, 24, 45]]),
  'fast.backPlate': A([[-1.5, 18.5, 36.5], [4, 18.5, 36.5], [-1.5, 5, 36.5], [4, 5, 36.5]], { normal: [0, 0, -1] }),
  'fast.driverBolt': A([[0, ENGINE.crankY, 34.1]], { normal: [0, 0, -1] }),
  'laser.cvtAlign': A([[ENGINE.driver[0] - 1.5, ENGINE.driver[1] + 3.6, ENGINE.driver[2]], [ENGINE.driven[0] + 1.5, ENGINE.driven[1] - 4.2, ENGINE.driven[2]]]),
  'fast.ujF': A([[ENGINE.jackshaftEnd[0], ENGINE.jackshaftEnd[1] + 0.7, ENGINE.jackshaftEnd[2]]]),
  'fast.ujR': A([[ENGINE.transInput[0], ENGINE.transInput[1] + 0.7, ENGINE.transInput[2]]]),
  'pt.ujF': A([[ENGINE.jackshaftEnd[0] - 3, ENGINE.jackshaftEnd[1], ENGINE.jackshaftEnd[2]]]),
  'pt.ujR': A([[ENGINE.transInput[0] - 3, ENGINE.transInput[1], ENGINE.transInput[2]]]),
  'laser.driveshaft': A([ENGINE.jackshaftEnd, ENGINE.transInput]),
  'seam.hoop': S([[[-5.06, 9.45, 19.25], [-5.06, 9.45, 20.75]], [[5.06, 9.45, 19.25], [5.06, 9.45, 20.75]]]),
  'path.throttleCable': A([[9, 13.6, 23.4], [8.2, 15, 30], [6.8, 18, 36], [6.6, 22, 44], [7.1, 25.05, 48.6]]),
  'path.fuelLine': A([[2.7, 23, -14.2], [5.8, 19, -8], [6.2, 15.6, 2], [6.2, 15.6, 4.6], [7, 14.5, 20], [7.6, 17, 40], [6.8, 19.2, 46.6]]),
  'clamps.fuel': A([[2.7, 23.2, -14.2], [6.2, 15.9, 1.8], [6.2, 15.9, 4.8], [7.6, 17.3, 40]]),
  'path.snorkel': A([[7, 22.4, 46.5], [7.3, 26, 45], [6.2, 29, 42], [4.5, 29.4, 40.2]]),
  'pt.water': W([[-38, 12, 10]]),
  // ---------- 6.x cage + body ----------
  'path.cageOutline': A(CAGE_PROFILE.map(([z, y]) => [8.3, y, z] as Vec3)),
  ...Object.fromEntries([[34.6, 12.5], [34.6, 30.5], [55, 30.5], [61.6, 12.5]].map(([z, y], i): [string, AnchorDef] => [`cut.miter${i + 1}`, W([[z - 48 + 100 - 0.6, 35.35, y - 21 - 0.6], [z - 48 + 100 + 0.6, 35.35, y - 21 + 0.6]], { normal: [0, 1, 0] })])),
  'bench.top2': W([[100, 36, 0]]),
  'seam.cage.feet': S(mirror([[[-6.5, 12.55, 34.1], [-7.5, 12.55, 34.1]], [[-6.5, 12.55, 35.1], [-7.5, 12.55, 35.1]], [[-6.5, 12.55, 61.1], [-7.5, 12.55, 61.1]], [[-6.5, 12.55, 62.1], [-7.5, 12.55, 62.1]]])),
  'seam.cage.joints': S(mirror([...CAGE_PROFILE.slice(1, -1).map(([z, y]) => [[-7.55, y - 0.6, z], [-7.55, y + 0.6, z]] as Vec3[]), [[-6.5, 31.05, 34.1], [-6.5, 31.05, 35.1]], [[-6.5, 25.75, 60.9], [-6.5, 25.75, 61.9]]])),
  'seam.cage.gussets': S(mirror([[[-7.5, 12.8, 33.6], [-5.4, 12.8, 33.6]], [[-7.5, 12.8, 35.6], [-5.4, 12.8, 35.6]]])),
  'pt.gapRL': A([[-8.7, 31.2, 36]]), 'pt.gapRR': A([[8.7, 31.2, 36]]), 'pt.gapFL': A([[-8.7, 30, 58]]), 'pt.gapFR': A([[8.7, 30, 58]]),
  'seam.hingeTabs': S(mirror([[[-7.25, 16, 61.75], [-7.25, 18.2, 61.75]]])),
  'seam.hoodPins': S(mirror([[[-4.8, 29.5, 34.0], [-4.2, 29.5, 34.0]]])),
  'fast.lightBarMount': A([[-8.8, 25.2, 70], [8.8, 25.2, 70]], { normal: [0, -1, 0] }),
  'fast.bumperL': A([[-6.3, 10.9, 67.2], [-6.3, 10.9, 68.2]], { normal: [-1, 0, 0] }),
  'fast.bumperR': A([[6.3, 10.9, 67.2], [6.3, 10.9, 68.2]], { normal: [1, 0, 0] }),
  'seam.guard': S([...[-9, -3, 3, 9].map(x => [[x - 0.55, 11.55, 69.7], [x + 0.55, 11.55, 69.7]] as Vec3[]), [[-7, 24.7, 62.1], [-7, 25.7, 62.1]], [[7, 24.7, 62.1], [7, 25.7, 62.1]]]),
  'fast.skid': A([[-6, 8.75, 30], [6, 8.75, 30], [-6, 8.75, 45], [6, 8.75, 45], [-6, 8.75, 60], [6, 8.75, 60]], { normal: [0, -1, 0] }),
  'fast.ropsBase': A([[-9, 10.8, -12], [-12.5, 10.8, -12], [-9, 10.8, -14], [-12.5, 10.8, -14], [9, 10.8, -12], [12.5, 10.8, -12], [9, 10.8, -14], [12.5, 10.8, -14]]),
  'seam.rops': S(mirror([[[-11.4, 43.4, -13.6], [-11.4, 44.6, -13.6]], [[-6.9, 10.4, -24], [-6.9, 11.6, -24]]])),
  'pt.helmetTop': A([[0, 65.4, -3.5]]), 'pt.hoopTop': A([[0, 67.5, -3.5]]),
  'rivets.flares': A([-1, 1].flatMap(sd => [30, 60, 90, 120, 150].map(d => [sd * 19.7, 8.5 + 14.2 * Math.sin(d * Math.PI / 180), 14.2 * Math.cos(d * Math.PI / 180)] as Vec3))),
  'holes.floorL': A([9, 14, 19, 24].map(z => [-10, 10.62, z] as Vec3)), 'holes.floorR': A([9, 14, 19, 24].map(z => [10, 10.62, z] as Vec3)),
  'fast.floor': A([[-7.2, 10.62, 6], [-13, 10.62, 6], [-7.2, 10.62, 26], [-13, 10.62, 26], [7.2, 10.62, 6], [13, 10.62, 6], [7.2, 10.62, 26], [13, 10.62, 26]]),
  // ---------- 7.x brakes ----------
  'fast.caliperTrans': In('transaxle2300', [[-7.2, 1.7, 2.4], [-7.2, 1.7, 3.6]], { normal: [-1, 0, 0] }),
  'path.brakeLine': A([[-9, 11.4, 17], [-8.6, 10, 11], [-8, 9, 6], [-7.6, T + 0.9, 3.2]]),
  'pt.bleeder': In('transaxle2300', [[-7.8, 3.3, 4.4]]),
  'path.cutCableL': A([[-10.6, 25, -1], [-11.2, 17, -1.5], [-12.6, 12, -0.8], [-REAR.discX, T + 3.2, 0]]),
  'path.cutCableR': A([[-12.2, 25, -0.8], [-9, 14, -6], [0, T + 1.4, -7.5], [9, T + 2, -4], [REAR.discX, T + 3.2, 0]]),
  'path.pivotLeft': W(Array.from({ length: 7 }, (_, i) => { const a = (i / 6) * 1.75; return [-REAR.wheelX + REAR.wheelX * Math.cos(a), 0, REAR.wheelX * Math.sin(a)] as Vec3; })),
  'path.forwardShort': W([[0, 0, 0], [0, 0, 10], [0, 0, 26]]),
  'pt.mudPatch': W([[REAR.wheelX, 0, 0]]),
  'fast.cvtGuard': A([[-3, 21.1, 35], [5, 21.1, 35]]),
  'path.killWire': A([[3, 29.6, 31], [2, 26, 34], [-2, 24, 38], [-4.5, 21, 42], [-5.6, 19, 45]]),
  'pt.exhaustOut': A([[-10.6, 14.2, 65.4]]),
  // ---------- 8.x electrical ----------
  'path.harness': A([[-3.2, 21.6, -6], [-6.95, 13.2, -2], [-6.95, 13.2, 12], [-6.95, 13.2, 22], [-5, 20, 27], [-3, 22.5, 27.5]]),
  'ties.harness': A([2, 7, 12, 17].map(z => [-7.05, 13.2, z] as Vec3)),
  'path.ground': A([[-2, 21.3, -6.5], [-4.5, 16, -6.5], [-5.3, 12.6, -6.5]]),
  // ---------- 9.x ----------
  'stripes.all': A([[-8, FRONT.towerY + 0.6, 47], [8, FRONT.towerY + 0.6, 47], [-5, 13.4, 40.5], [5, 13.4, 40.5], [-9, 11.2, -12], [9, 11.2, -12], [-6.8, 8.6, -4], [6.8, 8.6, -4], [ENGINE.jackshaftEnd[0], ENGINE.jackshaftEnd[1] + 0.9, ENGINE.jackshaftEnd[2]]]),
  'path.fig8': W([[0, 0, 0], [0, 0, 18], [24, 0, 42], [0, 0, 68], [-24, 0, 94], [0, 0, 118], [24, 0, 94], [0, 0, 68], [-24, 0, 42], [-6, 0, 16], [0, 0, 2]]),
  'path.lawnOut': W([[0, 0, 0], [0, 0, 30], [8, 0, 70], [26, 0, 100]]),
  'path.finale': W([[0, 0, 0], [0, 0, 60], [0, 0, 120], [0, 0, 150], [0, 0, 185], [0, 0, 213], [0, 0, 240], [0, 0, 265], [0, 0, 295], [0, 0, 320], [10, 0, 342], [30, 0, 362], [40, 0, 376]]),
};
