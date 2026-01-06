import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({
  locals: { safeGetSession },
  url,
}) => {
  const { session, user } = await safeGetSession();
  // if the user is already logged in return them to the home page
  if (session) {
    redirect(303, "/");
  }

  return { url: url.origin };
};
