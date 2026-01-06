import { redirect } from "@sveltejs/kit";

export const GET = async (event) => {
  const {
    url,
    locals: { supabase, safeGetSession },
  } = event;
  const code = url.searchParams.get("code") as string;
  const next = url.searchParams.get("next");

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Auto-accept pending invitations
      try {
        const { data: user } = await safeGetSession();
        if (user?.email) {
          await supabase.rpc('accept_workspace_invitation', {
            user_uuid: user.id,
            user_email: user.email,
          });
        }
      } catch {
        // Silently fail
      }

      // Use the next parameter if provided and valid
      if (next && next.startsWith('/')) {
        throw redirect(303, next);
      }

      // Smart redirect based on workspace count
      const { data: user } = await safeGetSession();
      if (user) {
        const { data: workspaces } = await supabase.rpc('get_user_workspaces', {
          user_uuid: user.id,
        });

        if (!workspaces || workspaces.length === 0) {
          throw redirect(303, '/');
        }

        if (workspaces.length === 1) {
          throw redirect(303, `/w/${workspaces[0].workspace_slug}`);
        }
      }

      throw redirect(303, '/');
    }
  }

  // Return the user to an error page with instructions
  throw redirect(303, "/auth/error");
};
