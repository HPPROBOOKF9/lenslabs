import { supabase } from "@/integrations/supabase/client";

interface LogActivityParams {
  action: string;
  section: "create_listing" | "assign" | "pr" | "nr" | "np" | "clicks";
  details?: Record<string, any>;
}

export const logAdminActivity = async ({ action, section, details }: LogActivityParams) => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get admin record
    const { data: adminData } = await supabase
      .from("admins")
      .select("id")
      .eq("email", user.email)
      .single();

    if (!adminData) return;

    // Log the activity
    await supabase.from("admin_activity_log").insert({
      admin_id: adminData.id,
      action,
      section,
      details: details || {},
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};
