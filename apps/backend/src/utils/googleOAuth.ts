import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { ApiError } from "@/utils/apiError";
import type { GoogleAuthUrlInput } from "@/types";

interface GoogleOAuthConfig {
  client_id: string;
  client_secret: string;
  all_client_ids: string[];
}

export interface GoogleUserProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
}

let cachedConfig: GoogleOAuthConfig | null = null;

const loadGoogleClientConfig = async (): Promise<GoogleOAuthConfig> => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const client_secret = process.env.GOOGLE_WEB_CLIENT_SECRET ?? "";

  const all_client_ids: string[] = [];
  for (const [key, value] of Object.entries(process.env)) {
    if (
      key.startsWith("NEXT_PUBLIC_GOOGLE_") &&
      key.endsWith("_CLIENT_ID") &&
      typeof value === "string" &&
      value.trim() !== ""
    ) {
      all_client_ids.push(value.trim());
    }
  }

  const client_id =
    process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? all_client_ids[0] ?? "";

  const config: GoogleOAuthConfig = {
    client_id,
    client_secret,
    all_client_ids: Array.from(new Set(all_client_ids)),
  };

  if (!config?.client_id || !config?.client_secret) {
    throw new ApiError(
      500,
      "Google OAuth is not configured correctly. Set NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment"
    );
  }

  cachedConfig = config;
  return config;
};

const resolveRedirectUri = (redirectUri?: string): string => {
  return redirectUri ?? "postmessage";
};

const getOauthClient = async (redirectUri?: string): Promise<OAuth2Client> => {
  const config = await loadGoogleClientConfig();
  const finalRedirectUri = resolveRedirectUri(redirectUri);

  return new google.auth.OAuth2(
    config.client_id,
    config.client_secret,
    finalRedirectUri
  );
};

export const buildGoogleAuthUrl = async (
  input?: GoogleAuthUrlInput
): Promise<string> => {
  const oauthClient = await getOauthClient(input?.redirectUri);

  return oauthClient.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["openid", "email", "profile"],
    state: input?.state,
  });
};

export const exchangeCodeForGoogleProfile = async (
  code: string,
  redirectUri?: string
): Promise<GoogleUserProfile> => {
  if (!code) {
    throw new ApiError(400, "Google authorization code is required");
  }

  const config = await loadGoogleClientConfig();
  const oauthClient = await getOauthClient(redirectUri);

  let tokens;
  try {
    const tokenResponse = await oauthClient.getToken(code);
    tokens = tokenResponse.tokens;
  } catch {
    throw new ApiError(401, "Invalid or expired Google authorization code");
  }

  if (!tokens?.id_token) {
    throw new ApiError(401, "Google did not return a valid id_token");
  }

  oauthClient.setCredentials(tokens);

  let ticket;
  try {
    const verifier = new OAuth2Client(config.client_id);
    ticket = await verifier.verifyIdToken({
      idToken: tokens.id_token,
      audience: config.all_client_ids,
    });
  } catch {
    throw new ApiError(
      401,
      "Unable to verify Google identity (client_id mismatch or invalid token). Ensure your web UI Google Client ID matches backend GOOGLE_CLIENT_ID"
    );
  }

  const payload = ticket.getPayload();
  if (!payload?.sub) {
    throw new ApiError(401, "Unable to verify Google identity");
  }

  let userInfoEmail: string | undefined;
  let userInfoName: string | undefined;
  let userInfoPicture: string | undefined;

  try {
    const oauth2 = google.oauth2({ version: "v2", auth: oauthClient });
    const { data } = await oauth2.userinfo.get();
    userInfoEmail = data.email ?? undefined;
    userInfoName = data.name ?? undefined;
    userInfoPicture = data.picture ?? undefined;
  } catch {
    userInfoEmail = undefined;
  }

  const email = (payload.email ?? userInfoEmail) as string;
  if (!email) {
    throw new ApiError(400, "Google account email is unavailable");
  }

  const nameValue = payload.name ?? userInfoName ?? email.split("@")[0];
  const name = (nameValue || email.split("@")[0]) as string;
  return {
    googleId: payload.sub,
    email,
    emailVerified: Boolean(payload.email_verified),
    name,
    picture: payload.picture ?? userInfoPicture,
  };
};

export const verifyGoogleIdToken = async (
  idToken: string
): Promise<GoogleUserProfile> => {
  if (!idToken) {
    throw new ApiError(400, "Google ID token is required");
  }

  try {
    const config = await loadGoogleClientConfig();
    const verifier = new OAuth2Client(config.client_id);

    const ticket = await verifier.verifyIdToken({
      idToken: idToken,
      audience: config.all_client_ids,
    });

    const payload = ticket.getPayload();
    if (!payload?.sub) {
      throw new ApiError(401, "Unable to verify Google identity");
    }

    const email = payload.email as string;
    if (!email) {
      throw new ApiError(400, "Google account email is unavailable");
    }

    const name = (payload.name ?? email.split("@")[0]) as string;
    return {
      googleId: payload.sub,
      email,
      emailVerified: Boolean(payload.email_verified),
      name,
      picture: payload.picture as string | undefined,
    };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, "Invalid or expired Google ID token");
  }
};
