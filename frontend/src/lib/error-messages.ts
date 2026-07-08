/**
 * Fehlercode-Mapping: Backend-Codes  nutzerfreundliche deutsche Texte mit Recovery-Aktion.
 * Quelle: UX_ONBOARDING_SPEC §7
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ErrorMapping {
  title: string;
  message: string;
  recovery?: string;
  action?: ErrorAction;
}

export type ErrorAction =
  | { type: "retry"; label?: string }
  | { type: "link"; href: string; label: string }
  | { type: "redirect"; href: string; label: string };

// ---------------------------------------------------------------------------
// Error Code  German Message Map
// ---------------------------------------------------------------------------

const ERROR_MAP: Record<string, ErrorMapping> = {
  // --- OAuth Errors ---
  ACCESS_DENIED: {
    title: "Access not granted",
    message:
      "The connection was declined. Without access to your data, PWBS cannot create a briefing.",
    recovery: "You can try again at any time.",
    action: { type: "retry", label: "Reconnect" },
  },
  TOKEN_EXCHANGE_FAILED: {
    title: "Connection failed",
    message:
      "The connection could not be established. This may be due to a temporary outage.",
    recovery: "Please try again in a minute.",
    action: { type: "retry", label: "Try again" },
  },
  TOKEN_EXCHANGE_NETWORK_ERROR: {
    title: "Connection failed",
    message:
      "The connection could not be established. This may be due to a temporary outage.",
    recovery: "Please try again in a minute.",
    action: { type: "retry", label: "Try again" },
  },
  GOOGLE_TOKEN_EXCHANGE_FAILED: {
    title: "Google connection failed",
    message:
      "The connection to Google could not be established. Please try again.",
    action: { type: "retry", label: "Try again" },
  },
  POPUP_BLOCKED: {
    title: "Pop-up blocked",
    message:
      "Your browser blocked the sign-in window. Please allow pop-ups for this site and try again.",
    recovery:
      "To allow pop-ups: browser settings  allow pop-ups",
    action: { type: "retry", label: "Try again" },
  },
  GOOGLE_OAUTH_NOT_CONFIGURED: {
    title: "Google sign-in unavailable",
    message:
      "Google sign-in is currently not configured. Please use email and password instead.",
  },
  INVALID_STATE: {
    title: "Session expired",
    message:
      "The connection request has expired. Please start the process again.",
    action: { type: "retry", label: "Try again" },
  },
  NO_OAUTH_SUPPORT: {
    title: "OAuth not supported",
    message:
      "This connector does not support automatic connection. Please use manual configuration.",
  },

  // --- Connector / Sync Errors ---
  CONNECTION_NOT_FOUND: {
    title: "Connection not found",
    message:
      "The requested data source was not found. It may have already been removed.",
    action: {
      type: "link",
      href: "/connectors",
      label: "Go to data sources",
    },
  },
  CONNECTION_NOT_ACTIVE: {
    title: "Connection inactive",
    message:
      "This data source is currently inactive. Please reconnect it.",
    action: { type: "retry", label: "Reconnect" },
  },
  CONNECTION_EXISTS: {
    title: "Already connected",
    message: "This data source is already connected to your account.",
  },
  SYNC_RATE_LIMITED: {
    title: "Syncing too frequently",
    message:
      "Please wait a moment before syncing again. Automatic sync continues to run in the background.",
  },
  NO_MARKDOWN_FILES: {
    title: "No Obsidian vault found",
    message:
      "The specified path does not contain a valid Obsidian vault. Please check that the path is correct and contains Markdown files.",
    recovery:
      'An Obsidian vault contains an ".obsidian" folder and ".md" files.',
    action: { type: "retry", label: "Fix path" },
  },
  UNKNOWN_CONNECTOR_TYPE: {
    title: "Unknown data source",
    message:
      "This data source type is not supported. Please choose a different source.",
    action: {
      type: "link",
      href: "/connectors",
      label: "View available sources",
    },
  },

  // --- Briefing Errors ---
  BRIEFING_NOT_FOUND: {
    title: "Briefing not found",
    message:
      "The requested briefing could not be found. It may have already been deleted.",
  },
  LLM_TIMEOUT: {
    title: "Generation is taking a bit longer",
    message:
      "Your briefing is being generated, but the AI service needs a little more time.",
    recovery: "You can wait or try again later.",
    action: { type: "retry", label: "Try again" },
  },
  LLM_ERROR: {
    title: "Briefing could not be created",
    message:
      "The AI service is temporarily unavailable. Your briefing will be created automatically as soon as the service is reachable again.",
    action: { type: "retry", label: "Try again" },
  },
  DEPENDENCY_MISSING: {
    title: "Service unavailable",
    message:
      "A required service is temporarily unreachable. Please try again shortly.",
    action: { type: "retry", label: "Try again" },
  },

  // --- Auth Errors ---
  INVALID_CREDENTIALS: {
    title: "Sign-in failed",
    message: "Incorrect email or password. Please try again.",
    action: { type: "retry", label: "Try again" },
  },
  INVALID_PASSWORD: {
    title: "Invalid password",
    message:
      "The password does not meet the requirements. At least 8 characters with uppercase and lowercase letters and a number.",
  },
  SESSION_EXPIRED: {
    title: "Session expired",
    message:
      "Your session has expired. Please sign in again to continue. Your data and settings are safely stored.",
    action: { type: "redirect", href: "/login?expired=1", label: "Go to sign-in" },
  },
  ADMIN_REQUIRED: {
    title: "Permission required",
    message:
      "You need administrator privileges to perform this action.",
  },
  FORBIDDEN: {
    title: "Access denied",
    message: "You do not have permission to perform this action.",
  },

  // --- Rate Limiting ---
  RATE_LIMIT_EXCEEDED: {
    title: "Too many requests",
    message:
      "To ensure quality for all users, a short limit applies. Please wait a moment and then try again.",
  },
  RATE_LIMITED: {
    title: "Too many requests",
    message:
      "Please wait a moment and then try again.",
  },

  // --- Validation Errors ---
  VALIDATION_ERROR: {
    title: "Invalid input",
    message: "Please check your input and try again.",
  },

  // --- System / Generic Errors ---
  INTERNAL_ERROR: {
    title: "Internal error",
    message:
      "An unexpected error occurred. Please try again. If the problem persists, contact support.",
    action: { type: "retry", label: "Try again" },
  },
  NETWORK_ERROR: {
    title: "No internet connection",
    message:
      "Please check your network connection. PWBS requires an active internet connection to sync your data and create briefings.",
  },
};

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

const FALLBACK: ErrorMapping = {
  title: "An error occurred",
  message: "Something went wrong. Please try again.",
  action: { type: "retry" },
};

/**
 * Resolve an error code (from backend {code} field) to a user-facing German
 * error message with optional recovery hint and action.
 */
export function resolveError(code: string | undefined | null): ErrorMapping {
  if (!code) return FALLBACK;
  return ERROR_MAP[code] ?? FALLBACK;
}

/**
 * Resolve from an ApiClientError-style object.
 * Checks data.code first, then falls back to HTTP-status heuristics.
 */
export function resolveApiError(err: {
  status?: number;
  data?: { code?: string; message?: string };
  message?: string;
}): ErrorMapping {
  // Backend error code available
  if (err.data?.code && ERROR_MAP[err.data.code]) {
    return ERROR_MAP[err.data.code];
  }

  // HTTP status heuristics
  if (err.status === 401) {
    return ERROR_MAP.SESSION_EXPIRED;
  }
  if (err.status === 403) {
    return ERROR_MAP.FORBIDDEN;
  }
  if (err.status === 429) {
    return ERROR_MAP.RATE_LIMIT_EXCEEDED;
  }
  if (err.status === 503) {
    return ERROR_MAP.DEPENDENCY_MISSING;
  }

  // Network error (no status = fetch failed)
  if (!err.status && err.message?.includes("fetch")) {
    return ERROR_MAP.NETWORK_ERROR;
  }

  return FALLBACK;
}
