import { readFile } from "node:fs/promises";
import path from "node:path";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { ApiError } from "@/utils/apiError";
import type { GoogleAuthUrlInput } from "@/types";

interface GoogleClientSecretPayload {
  client_id: string;
  client_secret: string;
  redirect_uris?: string[];
}

interface GoogleClientSecretFile {
  installed?: GoogleClientSecretPayload;
  web?: GoogleClientSecretPayload;
}

export interface GoogleUserProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
}

let cachedConfig: GoogleClientSecretPayload | null = null;

const getClientSecretPath = (): string => {
  const directPath = path.resolve(process.cwd(), "config/client_secret.json");
  const parentPath = path.resolve(
    process.cwd(),
    "../config/client_secret.json"
  );
  return process.cwd().includes("backend") ? parentPath : directPath;
};

const loadGoogleClientConfig = async (): Promise<GoogleClientSecretPayload> => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const candidatePaths = [
    path.resolve(process.cwd(), "config/client_secret.json"),
    path.resolve(process.cwd(), "../config/client_secret.json"),
    getClientSecretPath(),
  ];

  let parsed: GoogleClientSecretFile | null = null;

  for (const filePath of candidatePaths) {
    try {
      const raw = await readFile(filePath, "utf-8");
      parsed = JSON.parse(raw) as GoogleClientSecretFile;
      break;
    } catch {
      continue;
    }
  }

  const config = parsed?.installed ?? parsed?.web;

  if (!config?.client_id || !config?.client_secret) {
    throw new ApiError(
      500,
      "Google OAuth is not configured correctly. Check config/client_secret.json"
    );
  }

  cachedConfig = config;
  return config;
};

const resolveRedirectUri = (
  config: GoogleClientSecretPayload,
  redirectUri?: string
): string => {
  return (
    redirectUri ??
    process.env.GOOGLE_REDIRECT_URI ??
    config.redirect_uris?.[0] ??
    ""
  );
};

const getOauthClient = async (redirectUri?: string): Promise<OAuth2Client> => {
  const config = await loadGoogleClientConfig();
  const finalRedirectUri = resolveRedirectUri(config, redirectUri);

  if (!finalRedirectUri) {
    throw new ApiError(
      500,
      "Google redirect URI is missing. Set GOOGLE_REDIRECT_URI or add redirect_uris in client_secret.json"
    );
  }

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
      audience: config.client_id,
    });
  } catch {
    throw new ApiError(
      401,
      "Unable to verify Google identity (client_id mismatch or invalid token). Ensure your web UI Google Client ID matches backend config/client_secret.json"
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
      audience: config.client_id,
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
