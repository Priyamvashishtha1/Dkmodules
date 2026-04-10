export function calculatePoints(price) {
  return Math.floor(Number(price || 0) / 100);
}

export function calculateRedeemValue(points) {
  return Number(points || 0);
}
