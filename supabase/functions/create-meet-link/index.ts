import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateMeetRequest {
  booking_id: string;
  title?: string;
  start_time: string;
  end_time: string;
  attendees?: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const googleServiceAccountKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { booking_id, title, start_time, end_time, attendees } =
      (await req.json()) as CreateMeetRequest;

    if (!booking_id || !start_time || !end_time) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if Google Service Account is configured
    if (!googleServiceAccountKey) {
      // Fallback: Generate a manual meet link placeholder
      // Admin can configure the key later
      const meetLink = `https://meet.google.com/lookup/${booking_id.slice(0, 10)}`;
      
      // Check if meeting already exists
      const { data: existingMeeting } = await supabase
        .from("meetings")
        .select("id")
        .eq("booking_id", booking_id)
        .single();

      if (existingMeeting) {
        await supabase
          .from("meetings")
          .update({ meet_link: meetLink, start_time, end_time })
          .eq("id", existingMeeting.id);
      } else {
        await supabase.from("meetings").insert({
          booking_id,
          meet_link: meetLink,
          start_time,
          end_time,
        });
      }

      // Update booking status
      await supabase
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", booking_id);

      return new Response(
        JSON.stringify({
          success: true,
          meet_link: meetLink,
          note: "Google Service Account not configured. Using placeholder link. Admin needs to add GOOGLE_SERVICE_ACCOUNT_KEY secret.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse Google Service Account credentials
    let credentials;
    try {
      credentials = JSON.parse(googleServiceAccountKey);
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid GOOGLE_SERVICE_ACCOUNT_KEY format" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate JWT for Google API authentication
    const jwt = await createGoogleJWT(credentials);
    
    // Get access token
    const tokenResponse = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
          assertion: jwt,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("Token error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to get Google access token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { access_token } = await tokenResponse.json();

    // Create Google Calendar event with Meet link
    const calendarEvent = {
      summary: title || "LinguaViet - Buổi học trực tuyến",
      start: {
        dateTime: start_time,
        timeZone: "Asia/Ho_Chi_Minh",
      },
      end: {
        dateTime: end_time,
        timeZone: "Asia/Ho_Chi_Minh",
      },
      conferenceData: {
        createRequest: {
          requestId: booking_id,
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
      attendees: attendees?.map((email) => ({ email })) || [],
    };

    const calendarResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(calendarEvent),
      }
    );

    if (!calendarResponse.ok) {
      const error = await calendarResponse.text();
      console.error("Calendar error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create calendar event" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const eventData = await calendarResponse.json();
    const meetLink = eventData.conferenceData?.entryPoints?.find(
      (e: any) => e.entryPointType === "video"
    )?.uri || eventData.hangoutLink;

    if (!meetLink) {
      return new Response(
        JSON.stringify({ error: "No Meet link generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save meeting to database
    const { data: existingMeeting } = await supabase
      .from("meetings")
      .select("id")
      .eq("booking_id", booking_id)
      .single();

    if (existingMeeting) {
      await supabase
        .from("meetings")
        .update({
          meet_link: meetLink,
          calendar_event_id: eventData.id,
          start_time,
          end_time,
        })
        .eq("id", existingMeeting.id);
    } else {
      await supabase.from("meetings").insert({
        booking_id,
        meet_link: meetLink,
        calendar_event_id: eventData.id,
        start_time,
        end_time,
      });
    }

    // Update booking status to confirmed
    await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", booking_id);

    // Send notification to user
    const { data: booking } = await supabase
      .from("bookings")
      .select("user_id, booking_date, booking_time")
      .eq("id", booking_id)
      .single();

    if (booking) {
      await supabase.from("notifications").insert({
        user_id: booking.user_id,
        title: "Buổi học đã được xác nhận",
        message: `Link Google Meet đã sẵn sàng cho buổi học ngày ${booking.booking_date} lúc ${booking.booking_time}`,
        type: "success",
        link: "/learn/zoom",
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        meet_link: meetLink,
        calendar_event_id: eventData.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper function to create Google JWT
async function createGoogleJWT(credentials: any): Promise<string> {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    sub: credentials.client_email,
    scope: "https://www.googleapis.com/auth/calendar",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header));
  const payloadB64 = btoa(JSON.stringify(payload));
  const signInput = `${headerB64}.${payloadB64}`;

  // Import private key
  const privateKeyPem = credentials.private_key;
  const pemContents = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(signInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}
