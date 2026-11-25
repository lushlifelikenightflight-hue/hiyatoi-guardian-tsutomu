export const WRECK_DURATION = .72;

export function bodyOpacity(body, time) {
 if (!body.broken && body.health !== 0) return 1;
 const age = time - (body.breakdownAt ?? body.wreckedAt ?? -Infinity);
 return .62 * Math.max(0, Math.min(1, (WRECK_DURATION - age) / (WRECK_DURATION - .22)));
}
