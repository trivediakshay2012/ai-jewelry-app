import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { buildCadSpec } from '../../lib/cadSpecBuilder';
import { createPricingEstimate } from '../../lib/jewelryPricing';
import {
  createLocalQuote,
  getLocalLeadById,
  listLocalQuotesByLeadId,
} from '../../lib/localWorkflowStore';
import { createNotificationEvent } from '../../lib/notificationEvents';
import { createOrderDraft } from '../../lib/orderFlow';
import { supabase } from '../../lib/supabase';

type Lead = {
  id: string;
  vendor_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  design_title?: string | null;
  design_summary?: string | null;
  design_image?: string | null;
  design_images?: string[] | null;
  jewelry_type?: string | null;
  metal?: string | null;
  stone?: string | null;
  budget?: number | null;
  timeline?: string | null;
  notes?: string | null;
  status?: string | null;
  created_at?: string | null;
  selected_specs?: Record<string, unknown> | null;
};

type VendorQuote = {
  id: string;
  quote_amount: number;
  currency: string;
  timeline?: string | null;
  status?: string | null;
  notes?: string | null;
  deposit_percent?: number | null;
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function asMoney(value: string | number | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function moneyLabel(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function showMessage(title: string, message: string, onDone?: () => void) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
    onDone?.();
    return;
  }

  Alert.alert(title, message, [{ text: 'OK', onPress: () => onDone?.() }]);
}


async function sendQuoteDeliveryAlerts(input: {
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  designTitle?: string | null;
  quoteAmount: number;
  depositPercent: number;
  timeline?: string | null;
  vendorId?: string | null;
  leadId?: string | null;
  quoteId?: string | null;
}) {
  try {
    const { data, error } = await supabase.functions.invoke('send-quote-notification', {
      body: {
        customerName: input.customerName || null,
        customerEmail: input.customerEmail || null,
        customerPhone: input.customerPhone || null,
        designTitle: input.designTitle || 'your custom jewelry request',
        quoteAmount: Number(input.quoteAmount || 0),
        depositPercent: Number(input.depositPercent || 0),
        timeline: input.timeline || null,
        vendorId: input.vendorId || null,
        leadId: input.leadId || null,
        quoteId: input.quoteId || null,
      },
    });

    if (error) {
      console.log('send-quote-notification invoke error', error);
      return {
        ok: false,
        emailSent: false,
        smsSent: false,
        message: error.message || 'Notification function failed',
      };
    }

    return {
      ok: Boolean((data as any)?.ok),
      emailSent: Boolean((data as any)?.emailSent),
      smsSent: Boolean((data as any)?.smsSent),
      message: String((data as any)?.message || ''),
    };
  } catch (error: any) {
    console.log('sendQuoteDeliveryAlerts error', error);
    return {
      ok: false,
      emailSent: false,
      smsSent: false,
      message: error?.message || 'Quote delivery alerts failed',
    };
  }
}


export default function VendorLeadDetailScreen() {
  const params = useLocalSearchParams();

  const leadId = getSingleParam(params.leadId as any);
  const vendorIdParam = getSingleParam(params.vendorId as any);
  const customerNameParam = getSingleParam(params.customerName as any);
  const customerEmailParam = getSingleParam(params.customerEmail as any);
  const customerPhoneParam = getSingleParam(params.customerPhone as any);
  const designTitleParam = getSingleParam(params.designTitle as any);
  const designSummaryParam = getSingleParam(params.designSummary as any);
  const jewelryTypeParam = getSingleParam(params.jewelryType as any);
  const metalParam = getSingleParam(params.metal as any);
  const stoneParam = getSingleParam(params.stone as any);
  const budgetParam = getSingleParam(params.budget as any);
  const timelineParam = getSingleParam(params.timeline as any);
  const notesParam = getSingleParam(params.notes as any);
  const statusParam = getSingleParam(params.status as any);

  const hasLoadedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lead, setLead] = useState<Lead | null>(null);
  const [existingQuote, setExistingQuote] = useState<VendorQuote | null>(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [depositPercent, setDepositPercent] = useState('50');
  const [timeline, setTimeline] = useState('4-6 weeks from deposit');
  const [responseNotes, setResponseNotes] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [manualLabor, setManualLabor] = useState('');
  const [rushFee, setRushFee] = useState('0');
  const [customMarkupPercent, setCustomMarkupPercent] = useState('');
  const [customTaxPercent, setCustomTaxPercent] = useState('');

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    let active = true;

    (async () => {
      try {
        setLoading(true);

        let resolvedLead: Lead | null = null;

        if (leadId) {
          const { data: leadRow, error: leadError } = await supabase
            .from('vendor_leads')
            .select('*')
            .eq('id', leadId)
            .maybeSingle();

          if (leadError) {
            console.log('Lead detail load warning:', leadError);
          }

          if (leadRow) {
            resolvedLead = leadRow as Lead;
          }
        }

        if (!resolvedLead && leadId) {
          const localLead = await getLocalLeadById(leadId);
          if (localLead) {
            resolvedLead = localLead as unknown as Lead;
          }
        }

        if (!resolvedLead && (customerNameParam || customerEmailParam || designTitleParam)) {
          resolvedLead = {
            id: leadId || `local-${Date.now()}`,
            vendor_id: vendorIdParam || '',
            customer_name: customerNameParam || 'Customer',
            customer_email: customerEmailParam || '',
            customer_phone: customerPhoneParam || null,
            design_title: designTitleParam || 'Custom jewelry request',
            design_summary: designSummaryParam || null,
            jewelry_type: jewelryTypeParam || null,
            metal: metalParam || null,
            stone: stoneParam || null,
            budget: budgetParam ? Number(budgetParam) : null,
            timeline: timelineParam || null,
            notes: notesParam || null,
            status: statusParam || 'submitted',
            created_at: new Date().toISOString(),
          };
        }

        if (!active) return;

        setLead(resolvedLead);

        if (resolvedLead) {
          const estimate = createPricingEstimate({
            jewelryType: resolvedLead.jewelry_type,
            metal: resolvedLead.metal,
            stone: resolvedLead.stone,
            budget: resolvedLead.budget,
          });

          setQuoteAmount(String(Math.round(Number(estimate?.total || 0))));
          setTimeline(resolvedLead.timeline || '4-6 weeks from deposit');
          const laborLine = (estimate?.lines || []).find((line) =>
            String(line.label || '').toLowerCase().includes('labor')
          );
          setManualLabor(String(Math.round(Number(laborLine?.value || 0))));
          setCustomMarkupPercent('55');
          setCustomTaxPercent(String(Number(estimate?.taxRatePercent || 0)));
        }

        if (leadId) {
          const { data: quoteRow } = await supabase
            .from('vendor_quotes')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          let resolvedQuote = quoteRow as VendorQuote | null;

          if (!resolvedQuote) {
            const localQuotes = await listLocalQuotesByLeadId(leadId);
            resolvedQuote = (localQuotes[0] || null) as VendorQuote | null;
          }

          if (!active) return;

          if (resolvedQuote) {
            setExistingQuote(resolvedQuote);
            setQuoteAmount(String(resolvedQuote.quote_amount || ''));
            setDepositPercent(String(resolvedQuote.deposit_percent || 50));
            setTimeline(resolvedQuote.timeline || '4-6 weeks from deposit');
            setResponseNotes(resolvedQuote.notes || '');
          }
        }
      } catch (error: any) {
        showMessage('Could not load lead', error?.message || 'Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [
    leadId,
    vendorIdParam,
    customerNameParam,
    customerEmailParam,
    customerPhoneParam,
    designTitleParam,
    designSummaryParam,
    jewelryTypeParam,
    metalParam,
    stoneParam,
    budgetParam,
    timelineParam,
    notesParam,
    statusParam,
  ]);

  const pricingEstimate = useMemo(
    () =>
      createPricingEstimate({
        jewelryType: lead?.jewelry_type,
        metal: lead?.metal,
        stone: lead?.stone,
        budget: lead?.budget,
      }),
    [lead]
  );

  const rawCadSpec: any = useMemo(
    () =>
      buildCadSpec({
        jewelryType: lead?.jewelry_type,
        metal: lead?.metal,
        stone: lead?.stone,
        designTitle: lead?.design_title,
        budget: lead?.budget,
      }),
    [lead]
  );

  const cadSpec = useMemo(
    () => ({
      primaryDimensions: Array.isArray(rawCadSpec?.primaryDimensions) ? rawCadSpec.primaryDimensions : [],
      productionNotes: Array.isArray(rawCadSpec?.productionNotes) ? rawCadSpec.productionNotes : [],
      productionWorkflow: Array.isArray(rawCadSpec?.productionWorkflow) ? rawCadSpec.productionWorkflow : [],
    }),
    [rawCadSpec]
  );

  const pricingWorkbench = useMemo(() => {
    const baseSubtotal = asMoney(pricingEstimate?.subtotal);
    const baseTaxRate = asMoney(pricingEstimate?.taxRatePercent);
    const defaultLabor = asMoney(
      (pricingEstimate?.lines || []).find((line: any) => String(line.label || '').toLowerCase().includes('labor'))
        ?.value
    );
    const labor = manualLabor.trim() ? asMoney(manualLabor) : defaultLabor;
    const rush = asMoney(rushFee);
    const markupPercent = customMarkupPercent.trim() ? asMoney(customMarkupPercent) : 55;
    const taxRate = customTaxPercent.trim() ? asMoney(customTaxPercent) : baseTaxRate;

    const nonLaborBase = Math.max(baseSubtotal - defaultLabor, 0);
    const preMarkup = nonLaborBase + labor + rush;
    const subtotal = preMarkup * (1 + markupPercent / 100);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    const depositAmount = total * (asMoney(depositPercent || 50) / 100);
    const balanceAmount = Math.max(total - depositAmount, 0);

    return {
      defaultLabor,
      labor,
      rush,
      markupPercent,
      taxRate,
      preMarkup,
      subtotal,
      taxAmount,
      total,
      depositAmount,
      balanceAmount,
    };
  }, [pricingEstimate, manualLabor, rushFee, customMarkupPercent, customTaxPercent, depositPercent]);

  const pricingSummaryText = useMemo(() => {
    const budget = asMoney(lead?.budget);
    const budgetSentence = budget > 0
      ? pricingWorkbench.total <= budget
        ? `This quote stays within the customer's stated budget of ${moneyLabel(budget)}.`
        : `This quote is ${moneyLabel(pricingWorkbench.total - budget)} above the customer's stated budget of ${moneyLabel(budget)} because of metal, stone, labor, or rush requirements.`
      : 'No customer budget was provided, so the quote is based on design scope and production requirements.';

    return [
      `AI pricing baseline came in at ${moneyLabel(asMoney(pricingEstimate?.total))}.`,
      `Vendor-adjusted labor is ${moneyLabel(pricingWorkbench.labor)}, markup is ${pricingWorkbench.markupPercent.toFixed(2)}%, tax is ${pricingWorkbench.taxRate.toFixed(2)}%, and rush fee is ${moneyLabel(pricingWorkbench.rush)}.`,
      budgetSentence,
      'CAD guidance below should be reviewed against final bench, stone sourcing, and finishing decisions before production starts.',
    ].join(' ');
  }, [lead?.budget, pricingEstimate?.total, pricingWorkbench]);

  useEffect(() => {
    const computed = pricingWorkbench.total;
    if (!Number.isFinite(computed) || computed <= 0) return;
    setQuoteAmount((current) => {
      const currentValue = asMoney(current);
      if (Math.abs(currentValue - computed) < 0.01) return current;
      return computed.toFixed(2);
    });
  }, [pricingWorkbench.total]);

  const orderDraft = useMemo(
    () =>
      createOrderDraft({
        quoteAmount: Number(quoteAmount || 0),
        depositPercent: Number(depositPercent || 50),
        leadId: lead?.id,
        vendorId: lead?.vendor_id,
        customerName: lead?.customer_name,
        designTitle: lead?.design_title,
        timeline,
      }),
    [quoteAmount, depositPercent, lead, timeline]
  );

  const resetWorkbench = () => {
    const laborLine = (pricingEstimate?.lines || []).find((line: any) =>
      String(line.label || '').toLowerCase().includes('labor')
    );
    setManualLabor(String(Math.round(Number(laborLine?.value || 0))));
    setRushFee('0');
    setCustomMarkupPercent('55');
    setCustomTaxPercent(String(Number(pricingEstimate?.taxRatePercent || 0)));
    setStatusMessage('Pricing reset back to the AI baseline plus default vendor markup.');
  };

  const handleSendQuote = async () => {
    if (!lead) return;

    if (!quoteAmount || Number(quoteAmount) <= 0) {
      showMessage('Missing quote amount', 'Please enter a valid quote amount.');
      return;
    }

    try {
      setSaving(true);
      setStatusMessage('Saving quote...');

      const enrichedNotes = [
        responseNotes?.trim(),
        '',
        'Pricing workbench summary:',
        pricingSummaryText,
        `Deposit due now: ${moneyLabel(pricingWorkbench.depositAmount)}. Remaining balance: ${moneyLabel(pricingWorkbench.balanceAmount)}.`,
      ]
        .filter(Boolean)
        .join('\n');

      const payload = {
        vendor_id: lead.vendor_id,
        lead_id: lead.id,
        quote_amount: Number(quoteAmount || 0),
        currency: 'usd',
        timeline,
        notes: enrichedNotes,
        deposit_percent: Number(depositPercent || 50),
        status: 'sent',
        created_at: new Date().toISOString(),
      };

      let savedQuoteId = existingQuote?.id || '';

      const result = existingQuote
        ? await supabase
            .from('vendor_quotes')
            .update(payload)
            .eq('id', existingQuote.id)
            .select('*')
            .maybeSingle()
        : await supabase.from('vendor_quotes').insert([payload]).select('*').single();

      if (result.error) {
        console.log('Quote save fallback:', result.error);
        const localQuote = await createLocalQuote(payload as any);
        savedQuoteId = localQuote.id;
      } else if (result.data) {
        savedQuoteId = (result.data as any).id || savedQuoteId;
      }

      await supabase.from('vendor_leads').update({ status: 'quoted' }).eq('id', lead.id);

      await createNotificationEvent({
        audience: 'customer',
        title: existingQuote ? 'Your quote was updated' : 'Your quote is ready',
        body: `Your quote for ${lead.design_title || 'your jewelry request'} is ready to review at ${moneyLabel(Number(quoteAmount || 0))}.`,
        recipientEmail: lead.customer_email || null,
        referenceType: 'vendor_quote',
        referenceId: savedQuoteId || lead.id,
        metadata: {
          leadId: lead.id,
          quoteAmount: Number(quoteAmount || 0),
          depositPercent: Number(depositPercent || 50),
        },
      }).catch((e) => console.log('customer notification skipped', e));

      await createNotificationEvent({
        audience: 'vendor',
        title: existingQuote ? 'Quote updated successfully' : 'Quote sent successfully',
        body: `${lead.customer_name || 'Customer'} was quoted ${moneyLabel(Number(quoteAmount || 0))} for ${lead.design_title || 'their jewelry request'}.`,
        recipientVendorId: lead.vendor_id || null,
        recipientEmail: lead.customer_email || null,
        referenceType: 'vendor_quote',
        referenceId: savedQuoteId || lead.id,
        metadata: {
          leadId: lead.id,
          quoteAmount: Number(quoteAmount || 0),
        },
      }).catch((e) => console.log('vendor notification skipped', e));

      const deliveryResult = await sendQuoteDeliveryAlerts({
        customerName: lead.customer_name || null,
        customerEmail: lead.customer_email || null,
        customerPhone: lead.customer_phone || null,
        designTitle: lead.design_title || 'Custom jewelry request',
        quoteAmount: Number(quoteAmount || 0),
        depositPercent: Number(depositPercent || 50),
        timeline,
        vendorId: lead.vendor_id || null,
        leadId: lead.id,
        quoteId: savedQuoteId || lead.id,
      });

      const deliverySummary = [
        deliveryResult.emailSent ? 'email sent' : 'email not sent',
        lead.customer_phone ? (deliveryResult.smsSent ? 'SMS sent' : 'SMS not sent') : 'no customer phone for SMS',
      ].join(' • ');

      setStatusMessage(`Quote saved. Customer delivery status: ${deliverySummary}.`);

      showMessage(
        deliveryResult.emailSent || deliveryResult.smsSent ? 'Quote sent' : 'Quote saved with delivery warning',
        `${existingQuote ? 'The quote was updated.' : 'The quote was submitted successfully.'}

Customer delivery: ${deliverySummary}.${deliveryResult.message ? `

${deliveryResult.message}` : ''}`,
        () => router.replace('/vendor-dashboard' as any)
      );
    } catch (error: any) {
      setStatusMessage('Quote save failed.');
      showMessage('Could not send quote', error?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateOrderDraft = async () => {
    if (!lead) return;

    try {
      setSaving(true);
      setStatusMessage('Creating order draft...');

      const payload = {
        vendor_id: lead.vendor_id,
        lead_id: lead.id,
        customer_name: lead.customer_name,
        customer_email: lead.customer_email,
        design_title: lead.design_title || 'Custom jewelry project',
        quote_amount: Number(quoteAmount || 0),
        deposit_amount: orderDraft.depositAmount,
        balance_amount: orderDraft.balanceAmount,
        order_number: orderDraft.orderNumber,
        timeline: orderDraft.timeline,
        status: 'awaiting_deposit',
        summary: `${orderDraft.summary} ${pricingSummaryText}`,
        created_at: new Date().toISOString(),
      };

      const primary = await supabase.from('vendor_orders').insert([payload]);
      const insertError = primary.error ? (await supabase.from('orders').insert([payload])).error : null;

      if (primary.error && insertError) {
        throw insertError;
      }

      await supabase.from('vendor_leads').update({ status: 'order_created' }).eq('id', lead.id);

      await createNotificationEvent({
        audience: 'customer',
        title: 'Order draft created',
        body: `${orderDraft.orderNumber} is ready. Deposit due now: ${moneyLabel(orderDraft.depositAmount)}.`,
        recipientEmail: lead.customer_email || null,
        referenceType: 'vendor_order',
        referenceId: orderDraft.orderNumber,
        metadata: {
          leadId: lead.id,
          depositAmount: orderDraft.depositAmount,
          balanceAmount: orderDraft.balanceAmount,
        },
      }).catch((e) => console.log('order notification skipped', e));

      setStatusMessage(`Order draft ${orderDraft.orderNumber} created successfully.`);
      showMessage('Order draft created', `${orderDraft.orderNumber} is ready. Next step: collect deposit.`);
    } catch (error: any) {
      setStatusMessage('Order draft could not be created.');
      showMessage(
        'Order draft not saved',
        error?.message || 'You may need to create vendor_orders or orders table using the SQL file.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Loading lead...</Text>
      </View>
    );
  }

  if (!lead) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Lead not found</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>VENDOR QUOTE BUILDER</Text>
      <Text style={styles.title}>{lead.design_title || 'Custom jewelry request'}</Text>
      <Text style={styles.subtitle}>
        Respond with pricing, CAD guidance, timeline, and an order-ready quote.
      </Text>

      {!!statusMessage ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>{statusMessage}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Customer</Text>
        <Text style={styles.detail}>{lead.customer_name}</Text>
        <Text style={styles.detail}>{lead.customer_email}</Text>
        {!!lead.customer_phone ? <Text style={styles.detail}>{lead.customer_phone}</Text> : null}
        {!!lead.notes ? <Text style={styles.noteText}>Customer notes: {lead.notes}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Design request</Text>
        <Text style={styles.detail}>Type: {lead.jewelry_type || 'Not specified'}</Text>
        <Text style={styles.detail}>Metal: {lead.metal || 'Not specified'}</Text>
        <Text style={styles.detail}>Stone: {lead.stone || 'Not specified'}</Text>
        {!!lead.budget ? <Text style={styles.detail}>Budget: ${lead.budget}</Text> : null}
        {!!lead.timeline ? <Text style={styles.detail}>Requested timeline: {lead.timeline}</Text> : null}
        {!!lead.design_summary ? <Text style={styles.noteText}>{lead.design_summary}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>AI pricing baseline</Text>
        {(pricingEstimate?.lines || []).map((line: any) => (
          <View key={line.label} style={styles.row}>
            <Text style={styles.rowLabel}>{line.label}</Text>
            <Text style={styles.rowValue}>${Number(line.value || 0).toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.rowLabelStrong}>Subtotal</Text>
          <Text style={styles.rowValueStrong}>{moneyLabel(Number(pricingEstimate?.subtotal || 0))}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabelStrong}>Tax ({pricingEstimate?.taxRatePercent || 0}%)</Text>
          <Text style={styles.rowValueStrong}>{moneyLabel(Number(pricingEstimate?.taxAmount || 0))}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabelStrong}>Estimated total</Text>
          <Text style={styles.rowValueStrong}>{moneyLabel(Number(pricingEstimate?.total || 0))}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.rowHeader}>
          <Text style={styles.cardTitle}>Vendor price workbench</Text>
          <TouchableOpacity style={styles.inlineButton} onPress={resetWorkbench}>
            <Text style={styles.inlineButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.noteText}>
          This is your editable pricing engine for launch. Adjust labor, markup, tax, or rush fee and the final quote will update automatically.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Bench labor override"
          keyboardType="numeric"
          value={manualLabor}
          onChangeText={setManualLabor}
        />
        <TextInput
          style={styles.input}
          placeholder="Markup %"
          keyboardType="numeric"
          value={customMarkupPercent}
          onChangeText={setCustomMarkupPercent}
        />
        <TextInput
          style={styles.input}
          placeholder="Tax %"
          keyboardType="numeric"
          value={customTaxPercent}
          onChangeText={setCustomTaxPercent}
        />
        <TextInput
          style={styles.input}
          placeholder="Rush / special sourcing fee"
          keyboardType="numeric"
          value={rushFee}
          onChangeText={setRushFee}
        />
        <View style={styles.divider} />
        <View style={styles.row}><Text style={styles.rowLabel}>Pre-markup production cost</Text><Text style={styles.rowValue}>{moneyLabel(pricingWorkbench.preMarkup)}</Text></View>
        <View style={styles.row}><Text style={styles.rowLabel}>Vendor subtotal</Text><Text style={styles.rowValue}>{moneyLabel(pricingWorkbench.subtotal)}</Text></View>
        <View style={styles.row}><Text style={styles.rowLabel}>Tax amount</Text><Text style={styles.rowValue}>{moneyLabel(pricingWorkbench.taxAmount)}</Text></View>
        <View style={styles.row}><Text style={styles.rowLabelStrong}>Recommended final quote</Text><Text style={styles.rowValueStrong}>{moneyLabel(pricingWorkbench.total)}</Text></View>
        <View style={styles.row}><Text style={styles.rowLabel}>Deposit due now</Text><Text style={styles.rowValue}>{moneyLabel(pricingWorkbench.depositAmount)}</Text></View>
        <View style={styles.row}><Text style={styles.rowLabel}>Balance later</Text><Text style={styles.rowValue}>{moneyLabel(pricingWorkbench.balanceAmount)}</Text></View>
        <Text style={styles.helpText}>{pricingSummaryText}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>CAD technical sheet</Text>
        <Text style={styles.detail}>
          Primary dimensions: {cadSpec.primaryDimensions.length ? cadSpec.primaryDimensions.join(' • ') : 'Not available yet'}
        </Text>
        <Text style={styles.detail}>
          Production notes: {cadSpec.productionNotes.length ? cadSpec.productionNotes.join(' • ') : 'Not available yet'}
        </Text>
        <Text style={styles.detail}>
          Recommended workflow: {cadSpec.productionWorkflow.length ? cadSpec.productionWorkflow.join(' → ') : 'Not available yet'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Vendor quote</Text>
        <TextInput
          style={styles.input}
          placeholder="Quote amount"
          keyboardType="numeric"
          value={quoteAmount}
          onChangeText={setQuoteAmount}
        />
        <TextInput
          style={styles.input}
          placeholder="Deposit percent"
          keyboardType="numeric"
          value={depositPercent}
          onChangeText={setDepositPercent}
        />
        <TextInput style={styles.input} placeholder="Timeline" value={timeline} onChangeText={setTimeline} />
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Vendor notes to customer"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          value={responseNotes}
          onChangeText={setResponseNotes}
        />
        <TouchableOpacity
          style={[styles.primaryButton, saving && styles.buttonDisabled]}
          onPress={handleSendQuote}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>
            {saving ? 'Saving...' : existingQuote ? 'Update Quote' : 'Send Quote to Customer'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Order draft</Text>
        <Text style={styles.detail}>Order number: {orderDraft.orderNumber}</Text>
        <Text style={styles.detail}>Deposit amount: {moneyLabel(Number(orderDraft.depositAmount || 0))}</Text>
        <Text style={styles.detail}>Balance amount: {moneyLabel(Number(orderDraft.balanceAmount || 0))}</Text>
        <Text style={styles.detail}>Timeline: {orderDraft.timeline}</Text>

        <TouchableOpacity
          style={[styles.secondaryButton, saving && styles.buttonDisabled]}
          onPress={handleCreateOrderDraft}
          disabled={saving}
        >
          <Text style={styles.secondaryButtonText}>Create Order Draft</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/vendor-orders' as any)}>
          <Text style={styles.secondaryButtonText}>Open Orders</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40, gap: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, padding: 24 },
  eyebrow: { color: '#8a6b2f', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '800', color: '#111' },
  subtitle: { color: '#555', lineHeight: 22 },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EADAC0',
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#111' },
  detail: { fontSize: 14, color: '#444' },
  noteText: { color: '#555', lineHeight: 20 },
  helpText: { color: '#3c2a19', lineHeight: 21, marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  rowLabel: { color: '#555', flex: 1 },
  rowValue: { color: '#111', fontWeight: '600' },
  rowLabelStrong: { color: '#111', fontWeight: '700', flex: 1 },
  rowValueStrong: { color: '#111', fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  multiline: { minHeight: 120 },
  successBox: {
    backgroundColor: '#ECFDF3',
    borderWidth: 1,
    borderColor: '#ABEFC6',
    borderRadius: 14,
    padding: 14,
  },
  successText: { color: '#067647', fontWeight: '600' },
  muted: { color: '#666' },
  primaryButton: {
    backgroundColor: '#111',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButtonText: { color: '#111', fontWeight: '700', fontSize: 15 },
  inlineButton: {
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  inlineButtonText: { color: '#111', fontWeight: '700' },
  buttonDisabled: { opacity: 0.7 },
});
