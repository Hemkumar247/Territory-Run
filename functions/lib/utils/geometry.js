"use strict";
/**
 * Geometry utilities for Territory Run Cloud Functions.
 *
 * Implements the Sutherland-Hodgman polygon clipping algorithm to compute
 * the intersection of two polygons without any external geometry library.
 *
 * Coordinate convention: { lat: number, lng: number }
 *   lat = y-axis  (-90 to 90)
 *   lng = x-axis  (-180 to 180)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sutherlandHodgman = sutherlandHodgman;
exports.polygonArea = polygonArea;
exports.isPointInPolygon = isPointInPolygon;
exports.polygonsOverlap = polygonsOverlap;
exports.subtractPolygon = subtractPolygon;
// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
/**
 * Returns true if `point` is on the inside (left side) of the directed edge
 * from `edgeStart` to `edgeEnd`.
 *
 * Uses the 2-D cross product: (B − A) × (P − A).
 * Positive result ⟹ P is to the left of AB (counterclockwise winding).
 * Zero result ⟹ P is on the edge.
 */
function isInsideEdge(point, edgeStart, edgeEnd) {
    return ((edgeEnd.lng - edgeStart.lng) * (point.lat - edgeStart.lat) -
        (edgeEnd.lat - edgeStart.lat) * (point.lng - edgeStart.lng)) >= 0;
}
/**
 * Computes the intersection of the line through p1→p2 and the line through
 * p3→p4, using the parametric form P = p1 + t·(p2 − p1).
 *
 * Falls back to p1 when the lines are parallel (denominator ≈ 0).
 */
function lineIntersection(p1, p2, p3, p4) {
    const d1Lat = p2.lat - p1.lat;
    const d1Lng = p2.lng - p1.lng;
    const d2Lat = p4.lat - p3.lat;
    const d2Lng = p4.lng - p3.lng;
    const denom = d1Lng * d2Lat - d1Lat * d2Lng;
    if (Math.abs(denom) < 1e-10) {
        return { lat: p1.lat, lng: p1.lng }; // parallel lines — return p1 as a safe default
    }
    const t = ((p3.lng - p1.lng) * d2Lat - (p3.lat - p1.lat) * d2Lng) / denom;
    return {
        lat: p1.lat + t * d1Lat,
        lng: p1.lng + t * d1Lng,
    };
}
// ---------------------------------------------------------------------------
// Sutherland-Hodgman algorithm
// ---------------------------------------------------------------------------
/**
 * Clips the `subject` polygon against the convex `clip` polygon and returns
 * the intersection polygon.
 *
 * Algorithm: for each directed edge of the clip polygon, discard subject
 * vertices that are "outside" the half-plane defined by that edge.  Whenever
 * a subject edge crosses the clip edge, the crossing point is added to the
 * output.
 *
 * Preconditions:
 *  - `clip` polygon must be **convex**.
 *  - Both polygons should share the same winding order (counterclockwise).
 *    If your input is clockwise, reverse both arrays before calling.
 *
 * @param subject - The polygon to be clipped (may be non-convex).
 * @param clip    - The convex clipping polygon.
 * @returns       The intersection polygon, or [] if there is no intersection.
 */
function sutherlandHodgman(subject, clip) {
    if (subject.length === 0 || clip.length < 3)
        return [];
    let output = [...subject];
    for (let i = 0; i < clip.length; i++) {
        if (output.length === 0)
            return [];
        const input = output;
        output = [];
        const edgeStart = clip[i];
        const edgeEnd = clip[(i + 1) % clip.length];
        for (let j = 0; j < input.length; j++) {
            const current = input[j];
            const previous = input[(j + input.length - 1) % input.length];
            if (isInsideEdge(current, edgeStart, edgeEnd)) {
                if (!isInsideEdge(previous, edgeStart, edgeEnd)) {
                    // Previous was outside → add intersection point before current
                    output.push(lineIntersection(previous, current, edgeStart, edgeEnd));
                }
                output.push(current);
            }
            else if (isInsideEdge(previous, edgeStart, edgeEnd)) {
                // Previous was inside, current is outside → add intersection point
                output.push(lineIntersection(previous, current, edgeStart, edgeEnd));
            }
        }
    }
    return output;
}
// ---------------------------------------------------------------------------
// Polygon area (Shoelace formula)
// ---------------------------------------------------------------------------
/**
 * Computes the signed area of a polygon using the Shoelace formula.
 * Returns a positive value regardless of winding order.
 *
 * The result is in the same units as lat/lng (degrees²).  Multiply by
 * ~(111_000)² to convert to m² near the equator if needed.
 */
function polygonArea(polygon) {
    if (polygon.length < 3)
        return 0;
    let area = 0;
    const n = polygon.length;
    for (let i = 0; i < n; i++) {
        const curr = polygon[i];
        const next = polygon[(i + 1) % n];
        area += curr.lng * next.lat;
        area -= next.lng * curr.lat;
    }
    return Math.abs(area) / 2;
}
// ---------------------------------------------------------------------------
// Ray-casting: point-in-polygon test
// ---------------------------------------------------------------------------
/**
 * Returns true if `point` is strictly inside `polygon` (ray-casting algorithm).
 * Works for both convex and concave polygons.
 */
function isPointInPolygon(point, polygon) {
    const { lat: py, lng: px } = point;
    let inside = false;
    const n = polygon.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const { lat: iy, lng: ix } = polygon[i];
        const { lat: jy, lng: jx } = polygon[j];
        if (((iy > py) !== (jy > py)) &&
            (px < ((jx - ix) * (py - iy)) / (jy - iy) + ix)) {
            inside = !inside;
        }
    }
    return inside;
}
// ---------------------------------------------------------------------------
// High-level helpers
// ---------------------------------------------------------------------------
/**
 * Returns true when the two polygons have a non-trivial intersection
 * (at least three points in common — i.e., overlapping area > 0).
 */
function polygonsOverlap(poly1, poly2) {
    const intersection = sutherlandHodgman(poly1, poly2);
    return intersection.length >= 3;
}
/**
 * Returns the vertices of `subject` that fall **outside** the `clip` polygon.
 *
 * This is used by the conflict-resolution function to "remove" the overlapping
 * portion from a territory by filtering out its vertices that lie within the
 * rival's polygon.
 */
function subtractPolygon(subject, clip) {
    return subject.filter((pt) => !isPointInPolygon(pt, clip));
}
//# sourceMappingURL=geometry.js.map