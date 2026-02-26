import type { Config } from "@netlify/functions";

/**
 * Scheduled function that triggers a site rebuild every 2 hours
 * so new Feishu content is automatically fetched and published.
 *
 * Requires BUILD_HOOK_URL environment variable to be set.
 * Create a build hook in Netlify Dashboard:
 *   Site Settings > Build & deploy > Build hooks > Add build hook
 * Then set the resulting URL as BUILD_HOOK_URL env var.
 */
export default async (req: Request) => {
  const hookUrl = Netlify.env.get("BUILD_HOOK_URL");

  if (!hookUrl) {
    console.error(
      "BUILD_HOOK_URL is not set. Create a build hook in the Netlify dashboard and set the URL as an environment variable."
    );
    return;
  }

  try {
    const response = await fetch(hookUrl, { method: "POST" });

    if (response.ok) {
      console.log("Rebuild triggered successfully");
    } else {
      console.error(
        `Failed to trigger rebuild: ${response.status} ${response.statusText}`
      );
    }
  } catch (error) {
    console.error("Error triggering rebuild:", error);
  }
};

export const config: Config = {
  schedule: "0 */2 * * *",
};
