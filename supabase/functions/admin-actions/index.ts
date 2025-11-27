import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PATCH',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Create a Supabase client with the Auth context of the logged-in user
    const supabaseClient = createClient(
      // @ts-ignore: Deno env access
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore: Deno env access
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 2. Get the user from the request context
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // 3. Verify the user is a super_admin by checking the profiles table
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: "Forbidden: Requires Super Admin privileges." }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Initialize Admin Client (Service Role)
    const supabaseAdmin = createClient(
      // @ts-ignore: Deno env access
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore: Deno env access
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, targetUserId, targetEmail, newRole, newPassword } = await req.json();

    let userId = targetUserId;

    // If no ID provided but email is, try to find the user
    if (!userId && targetEmail) {
        // Note: listUsers requires service role, which we have in supabaseAdmin
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;
        
        const foundUser = users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase());
        if (foundUser) {
            userId = foundUser.id;
        } else {
            throw new Error(`User with email ${targetEmail} not found.`);
        }
    }

    if (!userId) {
      throw new Error("Target User ID or Email is required.");
    }

    // 5. Handle Actions
    if (action === 'DELETE_USER') {
        // CLEANUP: Delete related records in public tables to prevent FK violations
        // (In case ON DELETE CASCADE is not configured in the database)
        const tablesToCleanup = ['profiles', 'song_favorites', 'song_ratings', 'ai_song_queue'];
        
        for (const table of tablesToCleanup) {
            // We ignore errors here because the record might not exist or the table might not have the user_id column in the way we expect (though we know they do from schema)
            // Using 'requested_by' for ai_song_queue, 'user_id' for others.
            const column = table === 'ai_song_queue' ? 'requested_by' : 'user_id';
            const idColumn = table === 'profiles' ? 'id' : column; // profiles uses 'id' as user_id

            await supabaseAdmin.from(table).delete().eq(idColumn, userId);
        }

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteError) throw deleteError;

        return new Response(JSON.stringify({ message: "User deleted successfully." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }
    
    if (action === 'UPDATE_ROLE') {
        if (!newRole) throw new Error("New role is required.");
        
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);
            
        if (updateError) throw updateError;
        
        return new Response(JSON.stringify({ message: "User role updated successfully." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    if (action === 'RESET_PASSWORD') {
        if (!newPassword) throw new Error("New password is required.");

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        );

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ message: "Password reset successfully." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    // If no action was handled, return an error
    return new Response(JSON.stringify({ error: "Invalid action." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });

  } catch (error: any) {
    const errorMessage = error.message || "An unexpected error occurred.";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
