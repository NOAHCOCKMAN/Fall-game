// Plain names for the part picker card. Anything not listed gets a name built from its id.
const NAMES: Record<string, string> = {
  vehicle: 'Tractor', frameRailL: 'Frame rail (left)', frameRailR: 'Frame rail (right)', frameXStock: 'Stock crossmembers',
  hood: 'Original hood', grille: 'Grille', dash: 'Dash pedestal', fenderDeck: 'Fender deck', seat: 'Seat', seatNew: 'Seat mount (adjustable)',
  steeringWheel: 'Steering wheel', steeringColumnStock: 'Stock steering column', steeringSector: 'Steering sector', dragLinkStock: 'Stock drag link',
  engineStock: 'Stock engine', mufflerStock: 'Stock muffler', airCleanerStock: 'Stock air cleaner', fuelTankStock: 'Stock fuel tank', battery: 'Stock battery',
  variator: 'Variator pulley', beltStockEngine: 'Engine belt', beltStockTrans: 'Transaxle belt', clutchBrakePedal: 'Clutch-brake pedal', pedalLinkage: 'Pedal linkage',
  transaxle2300: 'Peerless 2300 transaxle', mowerDeck: 'Mower deck', deckLiftLinkage: 'Deck lift linkage', liftLever: 'Lift lever', deckHangers: 'Deck hangers',
  bracketsMisc: 'Old brackets', hoodMountTabs: 'Hood mount tabs (keep)', wiringStock: 'Stock wiring', throttleCableStock: 'Stock throttle cable', rearHitch: 'Rear hitch',
  frontAxleStock: 'Stock front axle', boxPlateL: 'Box plate (left)', boxPlateR: 'Box plate (right)', xEngineF: 'Engine crossmember (front)', xEngineR: 'Engine crossmember (rear)',
  xFrontSusp: 'Front suspension crossmember', apexBracket: 'Wishbone apex bracket', panhardTab: 'Panhard frame tab', xRear: 'Rear crossmember',
  frontClip: 'Front clip (rail extensions)', frontClipPlate: 'Front plate + tow point',
  rearLiftBracketL: 'Rear lift bracket (left)', rearLiftBracketR: 'Rear lift bracket (right)',
  axleBeam: 'Front axle beam', beamCaps: 'Beam end caps', beamTabs: 'Beam tabs', kpEarsL: 'Kingpin ears (left)', kpEarsR: 'Kingpin ears (right)',
  knuckleL: 'Steering knuckle (left)', knuckleR: 'Steering knuckle (right)', wishbone: 'Wishbone', apexJoint: 'Apex heim joint', panhard: 'Panhard bar',
  shockTowerL: 'Shock tower (left)', shockTowerR: 'Shock tower (right)', coiloverL: 'Coilover (left)', coiloverR: 'Coilover (right)',
  steerShaftUpper: 'Steering shaft (upper)', steerShaftMid: 'Steering shaft (middle)', steerShaftLower: 'Steering shaft (lower)', uJointUpper: 'Steering U-joint (upper)',
  uJointLower: 'Steering U-joint (lower)', steerSupportBearing: 'Steering support bearing', pitmanArm: 'Pitman arm', dragLink: 'Drag link', tieRod: 'Tie rod',
  engineMountPlate: 'Engine mount plate', predator420: 'Predator 420 engine', governorLever: 'Governor (speed-control) lever', carb: 'Carburetor', airBox: 'Air box',
  cvtDriver: 'CVT driver clutch', cvtDriven: 'CVT driven pulley', cvtBelt: 'CVT belt', cvtBackPlate: 'CVT back plate', jackshaft: 'Jackshaft', cvtGuard: 'CVT guard',
  uJointF: 'Driveshaft U-joint (front)', uJointR: 'Driveshaft U-joint (rear)', driveshaft: 'Driveshaft + slip yoke', driveshaftHoop: 'Driveshaft guard hoop',
  throttlePedal: 'Gas pedal', returnSprings: 'Throttle return springs', fuelCell: 'Fuel cell', fuelShutoff: 'Fuel shutoff', fuelFilter: 'Fuel filter',
  exhaustHeader: 'Exhaust header', sparkArrestor: 'Spark arrestor muffler', heatShield: 'Heat shield', snorkelFilter: 'Snorkel air filter',
  cageHoopL: 'Cage side frame (left)', cageHoopR: 'Cage side frame (right)', cageCrossbars: 'Cage crossbars', cageTopRailRemovable: 'Removable cage top bar',
  cageHingeTabs: 'Hood hinge tabs', hoodBumpers: 'Hood bumpers', hoodPins: 'Hood pins', lightBarMount: 'Light bar mount', bumperFront: 'Front bumper',
  grilleGuard: 'Grille guard', skidPlate: 'Skid plate', ropsHoop: 'ROPS hoop', ropsBraces: 'ROPS braces', seatBelt: 'Lap belt',
  fenderFlareL: 'Fender flare (left)', fenderFlareR: 'Fender flare (right)', floorboardL: 'Floorboard (left)', floorboardR: 'Floorboard (right)',
  brakeDiscTrans: 'Foot-brake disc', caliperTrans: 'Foot-brake caliper', brakePedal: 'Brake pedal', masterCylinder: 'Master cylinder',
  cutLeverL: 'Cutting brake lever (left)', cutLeverR: 'Cutting brake lever (right)', parkRatchet: 'Parking ratchet', killTether: 'Kill tether', keySwitch: 'Key switch',
  batteryBox: 'Battery box', batteryNew: 'Battery', mainFuse: '30 A main fuse', fuseBlock: 'Fuse block', relayLights: 'Light bar relay', switchPanel: 'Switch panel',
  headlightL: 'Headlight (left)', headlightR: 'Headlight (right)', lightBar: 'Light bar', tailLight: 'Tail light',
  workbench: 'Workbench', partsShelf: 'Parts shelf', scrapBin: 'Scrap bin', toolbox: 'Toolbox', fireExtinguisher: 'Fire extinguisher', welder: 'Welder',
  grinder: 'Angle grinder', grinder2: 'Angle grinder (flap disc)', boltTrays: 'Bolt trays', hoist: 'Engine hoist', floorJack: 'Floor jack', hoodTemplate: 'Hood template (cardboard)',
};

export function partName(id: string): string {
  if (NAMES[id]) return NAMES[id];
  const side = /(?<=[a-z0-9])([LR])$/.exec(id)?.[1];
  let base = id.replace(/(?<=[a-z0-9])[LR]$/, '').replace(/\..*$/, '').replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/Stock$/i, '').trim();
  base = base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
  return side ? `${base} (${side === 'L' ? 'left' : 'right'})` : base;
}
