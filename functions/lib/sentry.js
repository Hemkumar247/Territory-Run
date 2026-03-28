"use strict";
/**
 * Sentry integration for Cloud Functions.
 *
 * Call `initSentry()` once at module load time (before exporting any function).
 * In development / test environments set SENTRY_DSN to an empty string to
 * disable Sentry without changing code.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSentry = initSentry;
exports.captureException = captureException;
const Sentry = __importStar(require("@sentry/node"));
let initialised = false;
function initSentry() {
    if (initialised)
        return;
    initialised = true;
    const dsn = process.env.SENTRY_DSN;
    if (!dsn) {
        console.log('[Sentry] SENTRY_DSN not set — error reporting disabled.');
        return;
    }
    Sentry.init({
        dsn,
        environment: process.env.APP_ENV ?? 'production',
        release: process.env.APP_VERSION,
        tracesSampleRate: 0.2,
        integrations: [
            Sentry.httpIntegration(),
        ],
    });
    console.log('[Sentry] Initialised for Cloud Functions.');
}
/**
 * Captures an exception and flushes Sentry before the Cloud Function runtime
 * tears down the process (Sentry buffers events asynchronously).
 */
async function captureException(err) {
    Sentry.captureException(err);
    await Sentry.flush(2000);
}
//# sourceMappingURL=sentry.js.map