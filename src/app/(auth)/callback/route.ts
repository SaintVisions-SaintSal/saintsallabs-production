import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

// Service-role client for profile updates (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GHL_API = "https://services.leadconnectorhq.com";
const GHL_TOKEN = process.env.GHL_PRIVATE_TOKEN!;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || "oRA8vL3OSiCPjpwmEC0V";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({ name, value: "", ...options });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get the authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check if profile already has Stripe customer ID
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("stripe_customer_id, ghl_contact_id")
          .eq("id", user.id)
          .single();

        // FIX 3: Create Stripe customer on signup
        if (!existingProfile?.stripe_customer_id) {
          try {
            const customer = await stripe.customers.create({
              email: user.email!,
              name:
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email!,
              metadata: {
                supabase_user_id: user.id,
                plan_tier: "free",
                source: "saintsallabs_signup",
              },
            });

            await supabaseAdmin
              .from("profiles")
              .update({
                stripe_customer_id: customer.id,
                updated_at: new Date().toISOString(),
              })
              .eq("id", user.id);

            console.log(
              `[Auth Callback] Stripe customer created: ${customer.id} for user ${user.id}`
            );
          } catch (stripeErr) {
            console.error(
              "[Auth Callback] Stripe customer creation failed:",
              stripeErr
            );
          }
        }

        // FIX 5: Create GHL contact on signup
        if (!existingProfile?.ghl_contact_id) {
          try {
            const fullName =
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              "User";
            const nameParts = fullName.split(" ");
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(" ") || "";

            const ghlResponse = await fetch(`${GHL_API}/contacts/`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${GHL_TOKEN}`,
                "Content-Type": "application/json",
                Version: "2021-07-28",
              },
              body: JSON.stringify({
                firstName,
                lastName,
                email: user.email,
                locationId: GHL_LOCATION_ID,
                tags: ["saintsallabs", "new-signup", "free-tier"],
                source: "SaintSalLabs Signup",
              }),
            });

            if (ghlResponse.ok) {
              const ghlData = await ghlResponse.json();
              const contactId = ghlData.contact?.id || ghlData.id;

              if (contactId) {
                await supabaseAdmin
                  .from("profiles")
                  .update({
                    ghl_contact_id: contactId,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", user.id);

                console.log(
                  `[Auth Callback] GHL contact created: ${contactId} for user ${user.id}`
                );
              }
            }
          } catch (ghlErr) {
            console.error(
              "[Auth Callback] GHL contact creation failed:",
              ghlErr
            );
          }
        }
      }

      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
