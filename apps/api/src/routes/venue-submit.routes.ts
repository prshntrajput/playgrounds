import { Hono } from "hono";
import { VenueSubmitSchema } from "@playgrounds/shared";
import { jsonResponse, errorResponse } from "../lib/responses";
import type { AppEnv } from "../types";

export function venueSubmitRoutes(app: Hono<AppEnv>) {
  /**
   * POST /venues/submit
   * Any visitor can submit a new venue or claim an existing one.
   * Saves a PENDING record in venue_submissions for admin review.
   */
  app.post("/venues/submit", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    const parsed = VenueSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.message, 400);
    }

    const d = parsed.data;
    const user = c.get("user"); // may be null for guests

    const { createClient } = await import("@supabase/supabase-js");
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await supabase
      .from("venue_submissions")
      .insert({
        user_id:          user?.id ?? null,
        owner_name:       d.ownerName,
        owner_email:      d.ownerEmail,
        contact_phone:    d.contactPhone ?? null,
        contact_whatsapp: d.contactWhatsapp ?? null,
        venue_id:         d.venueId ?? null,
        name:             d.name ?? null,
        type:             d.type ?? null,
        address:          d.address ?? null,
        city:             d.city ?? null,
        country:          d.country ?? null,
        latitude:         d.latitude ?? null,
        longitude:        d.longitude ?? null,
        description:      d.description ?? null,
        opening_hours:    d.openingHours ?? null,
        price_per_hour:   d.pricePerHour ?? null,
        amenities:        d.amenities,
        proof_text:       d.proofText ?? null,
        status:           "PENDING",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[venue-submit]", error.message);
      return errorResponse("Failed to save submission", 500);
    }

    return jsonResponse(
      {
        id:      data.id,
        status:  "PENDING",
        message: d.venueId
          ? "Claim submitted! Our team will verify your ownership within 2-3 business days."
          : "Venue submitted! Our team will review and publish it within 2-3 business days.",
      },
      201
    );
  });

  /**
   * GET /venues/submissions (admin only)
   */
  app.get("/venues/submissions", async (c) => {
    const user = c.get("user");
    if (!user || user.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const { createClient } = await import("@supabase/supabase-js");
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    const status = new URL(c.req.url).searchParams.get("status") ?? "PENDING";

    const { data, error } = await supabase
      .from("venue_submissions")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ submissions: data ?? [] });
  });

  /**
   * PATCH /venues/submissions/:id — admin approve or reject
   * On approval of a new venue: auto-inserts into venues table.
   */
  app.patch("/venues/submissions/:id", async (c) => {
    const user = c.get("user");
    if (!user || user.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const { id } = c.req.param();
    let body: { status: "APPROVED" | "REJECTED"; adminNotes?: string };
    try { body = await c.req.json(); } catch { return errorResponse("Invalid JSON", 400); }
    if (!["APPROVED", "REJECTED"].includes(body.status)) {
      return errorResponse("status must be APPROVED or REJECTED", 400);
    }

    const { createClient } = await import("@supabase/supabase-js");
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // Fetch submission first
    const { data: sub, error: fetchErr } = await supabase
      .from("venue_submissions")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !sub) return errorResponse("Submission not found", 404);

    // If approving a NEW venue (no venue_id → not a claim), create the venue
    if (body.status === "APPROVED" && !sub.venue_id && sub.name && sub.type) {
      const { data: newVenue, error: venueErr } = await supabase
        .from("venues")
        .insert({
          name:              sub.name,
          type:              sub.type,
          latitude:          sub.latitude  ?? 28.6139,
          longitude:         sub.longitude ?? 77.2090,
          address:           sub.address,
          city:              sub.city,
          country:           sub.country,
          description:       sub.description,
          status:            "UNKNOWN",
          reliability_score: 0.5,
          source:            "COMMUNITY",
        })
        .select("id")
        .single();

      if (venueErr) {
        console.error("[submission-approve] venue insert:", venueErr.message);
        return errorResponse("Failed to create venue", 500);
      }

      // Insert amenities
      if (sub.amenities?.length > 0 && newVenue?.id) {
        await supabase.from("venue_amenities").insert(
          sub.amenities.map((a: string) => ({ venue_id: newVenue.id, amenity: a }))
        );
      }
    }

    // Update submission status
    const { error: updateErr } = await supabase
      .from("venue_submissions")
      .update({
        status:      body.status,
        admin_notes: body.adminNotes ?? null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) return errorResponse(updateErr.message, 500);

    return jsonResponse({ ok: true, status: body.status });
  });
}
