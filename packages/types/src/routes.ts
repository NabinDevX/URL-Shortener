export const API_ROUTES = {
  USER: {
    SEND_OTP: "/user/sendOtp",
    SIGNUP: "/user/signup",
    SIGNIN: "/user/signin",
    SIGNOUT: "/user/signout",
    GOOGLE_AUTH_URL: "/user/googleAuthUrl",
    GOOGLE_AUTH_CODE: "/user/googleAuthCode",
    GET_PROFILE: "/user/getProfile",
    UPDATE_ACCOUNT: "/user/updateAccount",
    CHANGE_PASSWORD: "/user/changePassword",
    GET_API_KEY: "/user/getApiKey",
    REGENERATE_API_KEY: "/user/regenerateApiKey",
  },

  URL: {
    GENERATE_SHORT_URL: "/url",
    GET_ALL_URLS: "/url/all",
    GET_URL_BY_SHORT_ID: "/url/:shortId",
    GET_URL_ANALYTICS: "/url/:shortId/analytics",
    UPDATE_URL: "/url/:shortId",
    DELETE_URL: "/url/:shortId",
  },

  SUBSCRIPTION: {
    CREATE: "/subscription/create",
    GET: "/subscription",
    GET_PLANS: "/subscription/plans",
    CANCEL: "/subscription/cancel",
    PAUSE: "/subscription/pause",
    RESUME: "/subscription/resume",
    GET_HISTORY: "/subscription/history",
  },

  STATIC: {
    SHORT_URL: "/s/:shortId",
  },
};

export const SUBSCRIPTION_PLANS = {
  BASIC: "basic_20",
  PRO: "pro_50",
} as const;

export const SUBSCRIPTION_STATUS = {
  ACTIVE: "active",
  PAUSED: "paused",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
  HALTED: "halted",
} as const;

export const OAUTH_MODES = {
  SIGNIN: "signin",
  SIGNUP: "signup",
} as const;
