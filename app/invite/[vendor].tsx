import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

type VendorRow = {
  id: string;
  business_name: string;
  owner_name: string;
  email: string;
  city: string | null;
  country: string | null;
  website: string | null;
  specialization: string[] | null;
  invite_code: string;
};

export default function InviteVendorPage() {
  const { vendor } = useLocalSearchParams<{ vendor: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [vendorRow, setVendorRow] = useState<VendorRow | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadVendor() {
      try {
        setLoading(true);
        setError("");

        const code = Array.isArray(vendor) ? vendor[0] : vendor;
        if (!code) {
          throw new Error("Invite code missing.");
        }

        const { data, error } = await supabase
          .from("vendors")
          .select("*")
          .eq("invite_code", code)
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error("Vendor not found for this invite link.");

        if (active) {
          setVendorRow(data as VendorRow);
        }
      } catch (err: any) {
        if (active) {
          setError(err?.message || "Could not load vendor.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadVendor();

    return () => {
      active = false;
    };
  }, [vendor]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Loading jeweler invite page...</Text>
      </View>
    );
  }

  if (error || !vendorRow) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Invite Link Not Available</Text>
        <Text style={styles.muted}>{error || "This invite page is not available."}</Text>
      </View>
    );
  }

  const specializationText =
    vendorRow.specialization && vendorRow.specialization.length > 0
      ? vendorRow.specialization.join(", ")
      : "Custom jewelry";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.badge}>INVITED BY JEWELER</Text>
      <Text style={styles.title}>{vendorRow.business_name}</Text>
      <Text style={styles.subtitle}>
        Work directly with {vendorRow.owner_name} and request a custom jewelry quote.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Location</Text>
        <Text style={styles.value}>
          {[vendorRow.city, vendorRow.country].filter(Boolean).join(", ")}
        </Text>

        <Text style={styles.label}>Specialization</Text>
        <Text style={styles.value}>{specializationText}</Text>

        {!!vendorRow.website && (
          <>
            <Text style={styles.label}>Website</Text>
            <Text style={styles.value}>{vendorRow.website}</Text>
          </>
        )}
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() =>
          router.push({
            pathname: "/request-quote",
            params: {
              vendorId: vendorRow.id,
              inviteCode: vendorRow.invite_code,
              vendorName: vendorRow.business_name,
            },
          })
        }
      >
        <Text style={styles.primaryButtonText}>Request a Quote</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() =>
          router.push({
            pathname: "/",
          })
        }
      >
        <Text style={styles.secondaryButtonText}>Start Design First</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  center: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  badge: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#8a6b2f",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111",
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    lineHeight: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: "#e3d7bf",
    borderRadius: 16,
    padding: 16,
    gap: 8,
    backgroundColor: "#fffaf2",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8a6b2f",
    textTransform: "uppercase",
  },
  value: {
    fontSize: 16,
    color: "#222",
    marginBottom: 8,
  },
  muted: {
    color: "#666",
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#c9a15b",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#111",
    fontSize: 16,
    fontWeight: "700",
  },
});