export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = "GNOSIS AI";

// Logo da GNOSIS AI
export const APP_LOGO = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663169314957/eRLFubileexzOKHZ.png";

// Manus OAuth login URL - Uses Manus API OAuth endpoint
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL || "https://api.manus.im";
  const appId = import.meta.env.VITE_APP_ID || "Ab5C8Nq9pGbzQm4EwPJGu4";
  const redirectUri = encodeURIComponent(window.location.origin + "/api/oauth/callback");
  return `${oauthPortalUrl}/oauth/authorize?client_id=${appId}&redirect_uri=${redirectUri}&response_type=code`;
};

