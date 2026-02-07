"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePlace = normalizePlace;
function normalizePlace(rawPlace) {
    if (typeof rawPlace !== 'string') {
        return '';
    }
    const trimmed = rawPlace.trim();
    if (!trimmed) {
        return '';
    }
    return trimmed.replace(/\s+/g, ' ');
}
