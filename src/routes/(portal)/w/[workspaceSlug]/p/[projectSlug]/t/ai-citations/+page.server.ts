import type { PageServerLoad } from "./$types";

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

  console.log("=== AI Citations Page Server Load ===");
  console.log("project.id:", project.id);
  console.log("queries data:", queries);
  console.log("queries error:", error);
  console.log("queries count:", queries?.length || 0);
  console.log("=====================================");

  return {
    workspace,
    project,
    userRole,
    canEdit,
    queries: queries || [],
  };
};
