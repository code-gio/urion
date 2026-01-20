import type { PageServerLoad } from "./$types";
import { getToolByIdOrSlug } from "$lib/server/tools.js";

export const load: PageServerLoad = async ({ parent, locals }) => {
  const parentData = await parent();
  const { workspace, project, userRole } = parentData;

  // Determine if user can edit
  //   const canEdit = userRole === "admin" || userRole === "owner";
  const canEdit = true;

  // Load project queries
  const { data: queries, error } = await locals.supabase
    .from("project_queries")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  // Load ai-citations tool and its activation
  const tool = await getToolByIdOrSlug(locals.supabase, "ai-citations");
  let toolActivation = null;
  
  if (tool) {
    const { data: activation, error: activationError } = await locals.supabase
      .from("project_tools")
      .select("*")
      .eq("project_id", project.id)
      .eq("tool_id", tool.id)
      .maybeSingle();
    
    if (!activationError && activation) {
      toolActivation = activation;
    }
  }

  return {
    workspace,
    project,
    userRole,
    canEdit,
    queries: queries || [],
    tool,
    toolActivation,
  };
};
