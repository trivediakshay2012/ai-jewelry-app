export type OrderDraftInput = {
  quoteAmount: number;
  depositPercent?: number | null;
  leadId?: string | null;
  vendorId?: string | null;
  customerName?: string | null;
  designTitle?: string | null;
  timeline?: string | null;
};

export type OrderDraft = {
  orderNumber: string;
  depositAmount: number;
  balanceAmount: number;
  productionStatus: string;
  timeline: string;
  summary: string;
};

function orderSequence() {
  return `${Date.now()}`.slice(-8);
}

export function createOrderDraft(input: OrderDraftInput): OrderDraft {
  const total = Number(input.quoteAmount) || 0;
  const depositPercent = input.depositPercent && input.depositPercent > 0 ? input.depositPercent : 50;
  const depositAmount = total * (depositPercent / 100);
  const balanceAmount = Math.max(total - depositAmount, 0);
  const orderNumber = `JWL-${orderSequence()}`;
  const timeline = input.timeline || '4-6 weeks from deposit';
  const summary = `${input.designTitle || 'Custom jewelry project'} for ${input.customerName || 'customer'} was converted from quote to order draft. ${depositPercent}% deposit due now, remaining balance due before shipping or pickup.`;

  return {
    orderNumber,
    depositAmount,
    balanceAmount,
    productionStatus: 'deposit_pending',
    timeline,
    summary,
  };
}
