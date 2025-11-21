import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateAdminRequest {
  email: string;
  password: string;
  adminCode: string;
  name: string;
  phone?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      throw new Error("Unauthorized: Admin access required");
    }

    const { email, password, adminCode, name, phone }: CreateAdminRequest = await req.json();

    // Create the new admin user using admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    });

    if (createError) throw createError;
    if (!newUser.user) throw new Error("Failed to create user");

    // Create admin record
    const { error: adminError } = await supabaseAdmin
      .from("admins")
      .insert({
        admin_code: adminCode,
        name,
        email,
        phone,
        status: "active",
      });

    if (adminError) throw adminError;

    // Assign admin role
    const { error: roleInsertError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: newUser.user.id,
        role: "admin",
      });

    if (roleInsertError) throw roleInsertError;

    // Log the activity
    const { data: adminData } = await supabaseAdmin
      .from("admins")
      .select("id")
      .eq("admin_code", adminCode)
      .single();

    if (adminData) {
      await supabaseAdmin.from("admin_activity_log").insert({
        admin_id: adminData.id,
        action: "ADMIN_CREATED",
        details: { email, adminCode, createdBy: user.id },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin created successfully",
        userId: newUser.user.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error creating admin:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
