export const FALLEN_DURATION=20;
export const RECOVERY_DELAY=4;

export function pedestrianIncidents(player,time,linger=0){
 return player.struck?.size
  ? [...player.struck.values()].filter(person=>time<person.fallenUntil+linger)
  : [];
}
