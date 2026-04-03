import { createClient } from "@supabase/supabase-js";

const GHL_API = "https://services.leadconnectorhq.com";
const GHL_TOKEN = process.env.GHL_PRIVATE_TOKEN!;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || "oRA8vL3OSiCPjpwmEC0V";
const GHL_COMPANY_ID = process.env.GHL_COMPANY_ID || "FrptZuAoaUjDyOFOeaNZ";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Snapshot IDs per tier — configure these in GHL after creating snapshots
 * Each snapshot contains the workflows, pipelines, and automations for that tier
 */
const TIER_SNAPSHOTS: Record<string, string> = {
  starter: process.env.GHL_SNAPSHOT_STARTER || "",
  pro: process.env.GHL_SNAPSHOT_PRO || "",
  teams: process.env.GHL_SNAPSHOT_TEAMS || "",
  enterprise: process.env.GHL_SNAPSHOT_ENTERPRISE || "",
};

/**
 * Creates a GHL contact for a SaintSalLabs user
 */
export async function createGHLContact(profile: {
  id: string;
  email: string;
  full_name?: string | null;
}): Promise<string | null> {
  const fullName = profile.full_name || "User";
  const [firstName, ...lastParts] = fullName.split(" ");
  const lastName = lastParts.join(" ") || "";

  try {
    const response = await fetch(`${GHL_API}/contacts/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GHL_TOKEN}`,
        "Content-Type": "application/json",
        Version: "2021-07-28",
      },
      body: JSON.stringify({
        firstName,
        lastName,
        email: profile.email,
        locationId: GHL_LOCATION_ID,
        tags: ["saintsallabs", "new-signup"],
        source: "SaintSalLabs Platform",
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const contactId = data.contact?.id || data.id;
      console.log(
        `[GHL] Contact created: ${contactId} for ${profile.email}`
      );
      return contactId;
    } else {
      const errorText = await response.text();
      console.error(`[GHL] Contact creation failed: ${errorText}`);
      return null;
    }
  } catch (err) {
    console.error("[GHL] Contact creation error:", err);
    return null;
  }
}

/**
 * Adds tags to a GHL contact (used to trigger workflows)
 */
export async function addGHLTags(
  contactId: string,
  tags: string[]
): Promise<boolean> {
  try {
    const response = await fetch(`${GHL_API}/contacts/${contactId}/tags`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GHL_TOKEN}`,
        "Content-Type": "application/json",
        Version: "2021-07-28",
      },
      body: JSON.stringify({ tags }),
    });
    return response.ok;
  } catch (err) {
    console.error("[GHL] Tag addition failed:", err);
    return false;
  }
}

/**
 * Updates a GHL contact's custom fields
 */
export async function updateGHLContact(
  contactId: string,
  data: Record<string, string>
): Promise<boolean> {
  try {
    const response = await fetch(`${GHL_API}/contacts/${contactId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GHL_TOKEN}`,
        "Content-Type": "application/json",
        Version: "2021-07-28",
      },
      body: JSON.stringify({
        locationId: GHL_LOCATION_ID,
        ...data,
      }),
    });
    return response.ok;
  } catch (err) {
    console.error("[GHL] Contact update failed:", err);
    return false;
  }
}

/**
 * Full GHL sub-account provisioning pipeline
 * Called when a user upgrades to a paid tier
 *
 * Flow: Create sub-account → Deploy snapshot → Update profile → Trigger welcome
 */
export async function provisionGHLSubAccount(
  userId: string,
  tier: string
): Promise<{ subLocationId?: string; snapshotId?: string } | null> {
  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) {
    console.error(`[GHL Provisioning] No profile found for user ${userId}`);
    return null;
  }

  // Skip if already provisioned
  if (profile.ghl_provisioned) {
    console.log(
      `[GHL Provisioning] User ${userId} already provisioned, skipping`
    );
    return null;
  }

  // Step 1: Ensure GHL contact exists
  let contactId = profile.ghl_contact_id;
  if (!contactId) {
    contactId = await createGHLContact({
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
    });

    if (contactId) {
      await supabase
        .from("profiles")
        .update({ ghl_contact_id: contactId })
        .eq("id", userId);
    }
  }

  // Step 2: Create GHL sub-account (if agency mode)
  let subLocationId: string | null = null;
  try {
    const subAccountRes = await fetch(`${GHL_API}/locations/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GHL_TOKEN}`,
        "Content-Type": "application/json",
        Version: "2021-07-28",
      },
      body: JSON.stringify({
        companyId: GHL_COMPANY_ID,
        name: `${profile.full_name || profile.email} - SaintSalLabs`,
        email: profile.email,
        phone: profile.phone || "",
        settings: {
          allowDuplicateContact: false,
          allowDuplicateOpportunity: false,
        },
      }),
    });

    if (subAccountRes.ok) {
      const subData = await subAccountRes.json();
      subLocationId = subData.id || subData.location?.id;
      console.log(
        `[GHL Provisioning] Sub-account created: ${subLocationId}`
      );
    } else {
      const errText = await subAccountRes.text();
      console.error(
        `[GHL Provisioning] Sub-account creation failed: ${errText}`
      );
      // Continue without sub-account — contact-level provisioning still works
    }
  } catch (err) {
    console.error("[GHL Provisioning] Sub-account error:", err);
  }

  // Step 3: Deploy snapshot to sub-account
  const snapshotId = TIER_SNAPSHOTS[tier];
  if (snapshotId && subLocationId) {
    try {
      await fetch(`${GHL_API}/snapshots/share/${snapshotId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GHL_TOKEN}`,
          "Content-Type": "application/json",
          Version: "2021-07-28",
        },
        body: JSON.stringify({
          locationId: subLocationId,
          type: "own",
        }),
      });
      console.log(
        `[GHL Provisioning] Snapshot ${snapshotId} deployed to ${subLocationId}`
      );
    } catch (err) {
      console.error("[GHL Provisioning] Snapshot deployment failed:", err);
    }
  }

  // Step 4: Update profile with provisioning data
  await supabase
    .from("profiles")
    .update({
      ghl_provisioned: true,
      ghl_location_id: subLocationId || GHL_LOCATION_ID,
      ghl_snapshot: snapshotId || null,
      ghl_vertical: tier,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  // Step 5: Trigger welcome workflow via tags
  if (contactId) {
    await addGHLTags(contactId, [
      "provisioned",
      `tier-${tier}`,
      "send-welcome-email",
    ]);
  }

  console.log(
    `[GHL Provisioning] Complete for user ${userId} | Tier: ${tier} | Location: ${subLocationId}`
  );

  return { subLocationId: subLocationId || undefined, snapshotId };
}

/**
 * Handle tier upgrade — update GHL contact tags and trigger workflows
 */
export async function handleTierChange(
  userId: string,
  newTier: string,
  previousTier: string
): Promise<void> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("ghl_contact_id")
    .eq("id", userId)
    .single();

  if (!profile?.ghl_contact_id) return;

  // Remove old tier tag and add new one
  await addGHLTags(profile.ghl_contact_id, [
    `tier-${newTier}`,
    newTier === "free" ? "downgraded" : "upgraded",
  ]);

  // If upgrading to paid from free, provision sub-account
  if (previousTier === "free" && newTier !== "free") {
    await provisionGHLSubAccount(userId, newTier);
  }
}

/**
 * Handle payment failure — tag contact as at-risk
 */
export async function handlePaymentFailed(userId: string): Promise<void> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("ghl_contact_id")
    .eq("id", userId)
    .single();

  if (!profile?.ghl_contact_id) return;

  await addGHLTags(profile.ghl_contact_id, [
    "payment-failed",
    "at-risk",
  ]);
}
