import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

// GET - List queries for a project
export const GET: RequestHandler = async ({ locals, params, url }) => {
  const { safeGetSession, supabase } = locals;
  const { session } = await safeGetSession();

  if (!session) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, projectId } = params;

  // Check permissions
  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .single();

  if (!member) {
    return json({ error: "Forbidden" }, { status: 403 });
  }

  // Get queries
  const { data: queries, error } = await supabase
    .from("project_queries")
    .select("*")
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    return json({ error: error.message }, { status: 500 });
  }

  return json(queries);
};

// POST - Create a new query
export const POST: RequestHandler = async ({ locals, params, request }) => {
  const { safeGetSession, supabase } = locals;
  const { session } = await safeGetSession();

  if (!session) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, projectId } = params;

  // Check permissions (owner, admin, or editor can add)
  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .single();

  if (!member || !["owner", "admin", "editor"].includes(member.role)) {
    return json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { query_text, query_key, topic, location, tags, is_active } = body;

  if (!query_text || !query_text.trim()) {
    return json({ error: "Query text is required" }, { status: 400 });
  }

  // Insert query
  const { data: query, error } = await supabase
    .from("project_queries")
    .insert({
      workspace_id: workspaceId,
      project_id: projectId,
      query_text: query_text.trim(),
      query_key: query_key || "geo_audit",
      topic: topic || null,
      location: location || null,
      tags: tags || [],
      is_active: is_active !== undefined ? is_active : true,
    })
    .select()
    .single();

  if (error) {
    // Check for unique constraint violation
    if (error.code === "23505") {
      return json(
        { error: "This query already exists for this project" },
        { status: 409 }
      );
    }
    return json({ error: error.message }, { status: 500 });
  }

  return json(query, { status: 201 });
};

// PATCH - Update a query
export const PATCH: RequestHandler = async ({
  locals,
  params,
  request,
  url,
}) => {
  const { safeGetSession, supabase } = locals;
  const { session } = await safeGetSession();

  if (!session) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, projectId } = params;
  const queryId = url.searchParams.get("id");

  if (!queryId) {
    return json({ error: "Query ID is required" }, { status: 400 });
  }

  // Check permissions
  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .single();

  if (!member || !["owner", "admin", "editor"].includes(member.role)) {
    return json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const updates: any = {};

  if (body.query_text !== undefined)
    updates.query_text = body.query_text.trim();
  if (body.query_key !== undefined) updates.query_key = body.query_key;
  if (body.topic !== undefined) updates.topic = body.topic || null;
  if (body.location !== undefined) updates.location = body.location || null;
  if (body.tags !== undefined) updates.tags = body.tags;
  if (body.is_active !== undefined) updates.is_active = body.is_active;

  // Update query
  const { data: query, error } = await supabase
    .from("project_queries")
    .update(updates)
    .eq("id", queryId)
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return json(
        { error: "This query already exists for this project" },
        { status: 409 }
      );
    }
    return json({ error: error.message }, { status: 500 });
  }

  if (!query) {
    return json({ error: "Query not found" }, { status: 404 });
  }

  return json(query);
};

// DELETE - Delete a query
export const DELETE: RequestHandler = async ({ locals, params, url }) => {
  const { safeGetSession, supabase } = locals;
  const { session } = await safeGetSession();

  if (!session) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, projectId } = params;
  const queryId = url.searchParams.get("id");

  if (!queryId) {
    return json({ error: "Query ID is required" }, { status: 400 });
  }

  // Check permissions (owner and admin can delete)
  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .single();

  if (!member || !["owner", "admin", "editor"].includes(member.role)) {
    return json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete query
  const { error } = await supabase
    .from("project_queries")
    .delete()
    .eq("id", queryId)
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId);

  if (error) {
    return json({ error: error.message }, { status: 500 });
  }

  return json({ success: true });
};
