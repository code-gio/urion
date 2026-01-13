import type { PageServerLoad } from './$types';
import type { ProjectSettingsRow } from "$lib/types/project-settings.js";

export const load: PageServerLoad = async ({ parent, locals }) => {
  const parentData = await parent();
  const { workspace, project } = parentData;

  // Fetch project settings for overview tab (default)
  const { data: projectSettings } = await locals.supabase
    .from("project_settings")
    .select("*")
    .eq("project_id", project.id)
    .eq("workspace_id", workspace.id)
    .single();

  return {
    workspace: parentData.workspace,
    project: parentData.project,
    canEdit: parentData.canEdit,
    projectSettings: projectSettings as ProjectSettingsRow | null,
  };
};
