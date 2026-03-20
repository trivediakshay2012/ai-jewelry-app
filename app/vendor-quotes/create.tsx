import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { createVendorQuote, updateLeadStatus } from "../../lib/quotes";

export default function CreateVendorQuotePage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    leadId?: string;
    vendorId?: string;
  }>();

  const leadId = Array.isArray(params.leadId) ? params.leadId[0] : params.leadId;
  const vendorId = Array.isArray(params.vendorId) ? params.vendorId[0] : params.vendorId;

  const [quoteAmount, setQuoteAmount] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("");
  const [quoteMessage, setQuoteMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleCreateQuote() {
    try {
      setError("");

      if (!leadId || !vendorId) throw new Error("Lead or vendor is missing.");
      if (!quoteAmount.trim()) throw new Error("Please enter the quote amount.");

      setSubmitting(true);

      await createVendorQuote({
        vendorId,
        leadId,
        quoteAmount: Number(quoteAmount),
        estimatedDays: estimatedDays ? Number(estimatedDays) : null,
        quoteMessage,
      });

      await updateLeadStatus(leadId, "quoted");

      Alert.alert("Quote Created", "The quote has been saved.");
      router.replace("/vendor-dashboard");
    } catch (err: any) {
      setError(err?.message || "Could not create quote.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Quote</Text>

      <TextInput
        style={styles.input}
        placeholder="Quote amount"
        keyboardType="numeric"
        value={quoteAmount}
        onChangeText={setQuoteAmount}
      />

      <TextInput
        style={styles.input}
        placeholder="Estimated days"
        keyboardType="numeric"
        value={estimatedDays}
        onChangeText={setEstimatedDays}
      />

      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Quote message"
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        value={quoteMessage}
        onChangeText={setQuoteMessage}
      />

      {!!error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.primaryButton, submitting && { opacity: 0.7 }]}
        disabled={submitting}
        onPress={handleCreateQuote}
      >
        <Text style={styles.primaryButtonText}>
          {submitting ? "Saving..." : "Save Quote"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  multiline: {
    minHeight: 120,
  },
  error: {
    color: "#b42318",
  },
  primaryButton: {
    backgroundColor: "#c9a15b",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});