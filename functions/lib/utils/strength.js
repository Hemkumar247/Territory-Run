"use strict";
/**
 * Territory strength calculation utilities for Territory Run Cloud Functions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecencyScore = getRecencyScore;
exports.calculateStrength = calculateStrength;
exports.applyStrengthDecay = applyStrengthDecay;
// ---------------------------------------------------------------------------
// Recency score
// ---------------------------------------------------------------------------
/**
 * Returns the recency component of the strength formula:
 *  - 100  if the user was active in the last 24 h
 *  -  70  if the user was active in the last 48 h
 *  -  40  if the user was active in the last 7 days
 *  -  10  otherwise
 */
function getRecencyScore(lastActiveMs) {
    const diffHours = (Date.now() - lastActiveMs) / (1000 * 60 * 60);
    if (diffHours <= 24)
        return 100;
    if (diffHours <= 48)
        return 70;
    if (diffHours <= 168)
        return 40; // 7 × 24 h
    return 10;
}
// ---------------------------------------------------------------------------
// Strength formula
// ---------------------------------------------------------------------------
/**
 * Calculates territory strength using:
 *   strength = (totalDistanceMeters × 0.4) + (sessionCount × 0.3) + (recencyScore × 0.3)
 *
 * The three weighted terms are intentionally heterogeneous (distance in metres,
 * a session count, and a bounded score); the game design normalises them
 * implicitly through typical player behaviour ranges.
 */
function calculateStrength(params) {
    const recencyScore = getRecencyScore(params.lastActiveMs);
    return (params.totalDistanceMeters * 0.4 +
        params.sessionCount * 0.3 +
        recencyScore * 0.3);
}
// ---------------------------------------------------------------------------
// Strength decay
// ---------------------------------------------------------------------------
/**
 * Applies inactivity-based strength decay and returns the new strength value.
 *
 * Decay schedule (based on `lastActiveMs`):
 *  - ≥ 90 days : set to 10  (minimum floor)
 *  - ≥ 30 days : × 0.50
 *  - ≥  7 days : × 0.80
 *  - ≥  2 days : × 0.95
 *  - < 2 days  : no change (return unchanged)
 *
 * Territories are never deleted — only strength is reduced.
 */
function applyStrengthDecay(strength, lastActiveMs) {
    const diffDays = (Date.now() - lastActiveMs) / (1000 * 60 * 60 * 24);
    if (diffDays >= 90)
        return 10;
    if (diffDays >= 30)
        return strength * 0.50;
    if (diffDays >= 7)
        return strength * 0.80;
    if (diffDays >= 2)
        return strength * 0.95;
    return strength;
}
//# sourceMappingURL=strength.js.map