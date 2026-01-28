import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create admin client with service role for user updates
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create regular client to verify the requesting user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get the requesting user
    const {
      data: { user: requestingUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !requestingUser) {
      throw new Error("Unauthorized");
    }

    // Check if requesting user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) throw roleError;
    if (!roleData) {
      throw new Error("Only admins can update users");
    }

    const { userId, email, password, fullName, companyName, phone } = await req.json();

    if (!userId) {
      throw new Error("User ID is required");
    }

    console.log(`Admin ${requestingUser.id} updating user ${userId}`);

    // Update auth user if email or password provided
    const authUpdates: { email?: string; password?: string } = {};
    if (email) authUpdates.email = email;
    if (password) authUpdates.password = password;

    if (Object.keys(authUpdates).length > 0) {
      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        authUpdates
      );

      if (updateAuthError) {
        console.error("Error updating auth user:", updateAuthError);
        throw updateAuthError;
      }
      console.log("Auth user updated successfully");
    }

    // Update profile if name, company or phone provided
    const profileUpdates: { full_name?: string; company_name?: string; phone?: string } = {};
    if (fullName !== undefined) profileUpdates.full_name = fullName;
    if (companyName !== undefined) profileUpdates.company_name = companyName;
    if (phone !== undefined) profileUpdates.phone = phone;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: updateProfileError } = await supabaseAdmin
        .from("profiles")
        .update(profileUpdates)
        .eq("user_id", userId);

      if (updateProfileError) {
        console.error("Error updating profile:", updateProfileError);
        throw updateProfileError;
      }
      console.log("Profile updated successfully");
    }

    return new Response(
      JSON.stringify({ success: true, message: "User updated successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in update-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
