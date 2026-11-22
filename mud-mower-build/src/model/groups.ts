// Part groups (B2) used by paint / explode / X-ray.
export const GROUPS: Record<string, string[]> = {
  'grp.frame': ['frameRailL', 'frameRailR', 'frameXStock', 'boxPlateL', 'boxPlateR', 'xEngineF', 'xEngineR', 'xFrontSusp', 'xRear', 'frontClip', 'frontClipPlate', 'rearLiftBracketL', 'rearLiftBracketR', 'apexBracket', 'panhardTab', 'hoodMountTabs', 'engineMountPlate', 'driveshaftHoop'],
  'grp.cage': ['cageHoopL', 'cageHoopR', 'cageCrossbars', 'cageTopRailRemovable', 'cageHingeTabs', 'shockTowerL', 'shockTowerR', 'hoodPins', 'lightBarMount'],
  'grp.frontEnd': ['axleBeam', 'kpEarsL', 'kpEarsR', 'beamTabs', 'beamCaps', 'knuckleL', 'knuckleR', 'hubFrontL', 'hubFrontR', 'wishbone', 'panhard', 'coiloverL', 'coiloverR', 'dragLink', 'tieRod', 'pitmanArm'],
  'grp.drivetrain': ['predator420', 'cvtDriver', 'cvtDriven', 'cvtBelt', 'cvtBackPlate', 'jackshaft', 'cvtGuard', 'uJointF', 'driveshaft', 'uJointR', 'transaxle2300'],
  'grp.body': ['hood', 'grille', 'fenderDeck', 'fenderFlareL', 'fenderFlareR', 'floorboardL', 'floorboardR', 'seat'],
  'grp.brakes': ['brakePedal', 'masterCylinder', 'brakeDiscTrans', 'caliperTrans', 'cutLeverL', 'cutLeverR', 'parkRatchet', 'discRearL', 'discRearR', 'caliperRearL', 'caliperRearR'],
  'grp.electrical': ['killTether', 'keySwitch', 'batteryBox', 'batteryNew', 'mainFuse', 'fuseBlock', 'relayLights', 'switchPanel', 'headlightL', 'headlightR', 'lightBar', 'tailLight'],
  // 9.2 strip-down: direct children of the vehicle that come off for paint (fly out around the frame)
  'grp.teardown': ['axleBeam', 'transaxle2300', 'predator420', 'cvtDriver', 'cvtDriven', 'cvtBelt', 'cvtBackPlate', 'jackshaft', 'cvtGuard', 'driveshaft', 'uJointF', 'uJointR',
    'fenderDeck', 'seat', 'floorboardL', 'floorboardR', 'bumperFront', 'grilleGuard', 'skidPlate', 'coiloverL', 'coiloverR', 'panhard', 'dragLink', 'pitmanArm', 'fuelCell', 'batteryBox', 'batteryNew',
    'exhaustHeader', 'sparkArrestor', 'heatShield', 'steeringWheel', 'brakePedal', 'masterCylinder', 'throttlePedal', 'cutLeverL', 'cutLeverR', 'headlightL', 'headlightR', 'lightBar'],
};

export function expandParts(ids: string[]): string[] {
  return ids.flatMap(id => GROUPS[id] ?? [id]);
}
