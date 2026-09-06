// One team pays the registration fee once.
//
// The backend decides this, not the client: GET /api/registrations/is-payment-done
// looks at every payment belonging to the user AND to their team-mates, direct or
// linked through an event registration, and reports whether any is approved, plus
// the full list of payment records. So a user whose team-mate paid, or who paid for
// an earlier event, is already covered — registering for another event must not
// send them back to the payment page.
//
// Approved is not the only state that means "stop asking for money". A payment that
// has been submitted but not yet reviewed by an admin ALSO means the user has paid;
// billing them again while their screenshot sits in the approval queue would take
// ₹2000 twice. So the fee counts as handled when a payment is approved OR pending,
// and only a rejected/failed payment puts the user back on the hook.
//
// Every "pay ₹2000" surface funnels through this helper so they cannot disagree
// with each other about whether money is still owed.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.semaphore2k26.in';

const APPROVED_STATUSES = ['approved', 'verified'];
// Everything an admin has not acted on yet. Kept generous on purpose: an unknown
// status is far more likely to be a queue state than a rejection, and the cost of
// guessing wrong is charging someone a second time.
const PENDING_STATUSES = ['pending', 'submitted', 'processing', 'under_review', 'in_review', 'awaiting_approval'];

const normalize = (value) => String(value || '').toLowerCase().trim();

const EMPTY = {
  isPaymentDone: false,
  isPaymentPending: false,
  feeHandled: false,
  status: 'none',
  checked: false,
};

/**
 * Ask the backend where this user (or their team) stands on the registration fee.
 * Never throws — a failed check resolves to "nothing paid", which keeps the payment
 * flow reachable rather than locking someone out of paying because of a hiccup.
 *
 * @returns {Promise<{isPaymentDone: boolean, isPaymentPending: boolean, feeHandled: boolean, status: string, checked: boolean}>}
 *   isPaymentDone    — an admin has approved a payment
 *   isPaymentPending — a payment is submitted and waiting on approval
 *   feeHandled       — either of the above: do NOT ask this user to pay again
 */
export async function fetchPaymentDone(token) {
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  if (!authToken) return { ...EMPTY };

  try {
    const res = await fetch(`${API_BASE_URL}/api/registrations/is-payment-done`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) return { ...EMPTY };

    const data = await res.json();

    // The endpoint returns the approved answer under several keys for compatibility.
    const isPaymentDone = Boolean(
      data?.is_payment_done ?? data?.isPaymentDone ?? data?.is_payment_approved ?? data?.hasApprovedPayment
    );

    // Pending is not a field on the response, so read it off the payment records the
    // endpoint already sends back. Falling back to the summary `status` string covers
    // a response that omits the list.
    const payments = Array.isArray(data?.payments) ? data.payments : [];
    const isPaymentPending = payments.length > 0
      ? payments.some((p) => PENDING_STATUSES.includes(normalize(p?.status)))
      : PENDING_STATUSES.includes(normalize(data?.status));

    const status = isPaymentDone
      ? 'approved'
      : isPaymentPending
        ? 'pending'
        : normalize(data?.status) || 'none';

    return {
      isPaymentDone,
      isPaymentPending,
      feeHandled: isPaymentDone || isPaymentPending,
      status,
      checked: true,
    };
  } catch (err) {
    console.error('Failed to check payment status:', err);
    return { ...EMPTY };
  }
}

/** True when a payment record counts as approved. */
export function isApprovedStatus(status) {
  return APPROVED_STATUSES.includes(normalize(status));
}

/** True when a payment record is submitted and still waiting on an admin. */
export function isPendingStatus(status) {
  return PENDING_STATUSES.includes(normalize(status));
}
