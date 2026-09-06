"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WaterWave from '@/components/WaterWaveWrapper';
import { TEAM_REGISTRATION_FEE } from '@/constants/pricing';
import { fetchPaymentDone } from '@/lib/paymentStatus';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.semaphore2k26.in';

const pageCss = `
  /* ---------- Layout ----------
     Anything a media query needs to change lives here rather than in the inline
     styles object: an inline style beats a stylesheet rule, so a value set
     inline makes the matching breakpoint silently do nothing. */
  .reg-layout {
    display: grid; grid-template-columns: minmax(0, 1fr) 360px;
    gap: 24px; align-items: start; padding-bottom: 24px;
  }
  /* Left column: team card + every event. It deliberately has no scroller of its
     own — the page scrolls it, and that is what gives the sticky summary beside
     it something to pin against. */
  .reg-main { display: flex; flex-direction: column; gap: 24px; min-width: 0; }
  .reg-gridwrap { min-width: 0; }
  /* Cards share a height so each row reads as one band regardless of how long a
     title or description runs. The card is a flex column with margin-top:auto on
     its action button, so the extra height pushes every button onto a common
     baseline instead of leaving a ragged edge.
     A card must never span the full row when it opens: grid cannot keep a
     full-row item in a half-row slot, so it would be bumped to a new row below
     its neighbour and visibly jump down under the cursor. */
  .reg-grid {
    display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px; align-items: stretch; grid-auto-rows: 1fr;
  }
  /* An open card is legitimately far taller than the rest. Matching heights then
     would balloon every card in its row to the height of the form, so uniform
     heights are dropped for exactly as long as a form is open. */
  .reg-grid.is-open { align-items: start; grid-auto-rows: auto; }

  /* ---------- Progress stepper ----------
     One pip per selectable event. At zero a single flat bar just reads as a
     broken divider, whereas empty pips show how many slots are waiting. */
  .reg-steps { display: flex; gap: 5px; width: 100%; }
  .reg-step {
    flex: 1 1 0; height: 6px; border-radius: 999px;
    background: rgba(255,255,255,0.10);
    transition: background .3s ease, box-shadow .3s ease;
  }
  .reg-step.is-done {
    background: linear-gradient(90deg, #22d3ee, #0e7490);
    box-shadow: 0 0 10px -1px rgba(34,211,238,0.6);
  }

  /* ---------- Sticky checkout ---------- */
  .reg-summary { position: sticky; top: 20px; align-self: start; min-width: 0; }
  /* The pinned card must never outgrow the viewport, or its lower half (the
     total + checkout button) would sit permanently below the fold. */
  .reg-summary-card { max-height: calc(100vh - 40px); overflow: hidden; }
  .reg-summary-list {
    flex: 1 1 auto; min-height: 0;
    max-height: 240px; overflow-y: auto;
    padding-right: 4px; overscroll-behavior: contain;
  }

  /* ---------- Custom scrollbars ---------- */
  .reg-scroll { scrollbar-width: thin; scrollbar-color: rgba(34,211,238,0.55) transparent; scroll-behavior: smooth; }
  .reg-scroll::-webkit-scrollbar { width: 9px; }
  .reg-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.06); border-radius: 999px; }
  .reg-scroll::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #22d3ee, #0e7490);
    border-radius: 999px; border: 2px solid transparent; background-clip: padding-box;
  }
  .reg-scroll::-webkit-scrollbar-thumb:hover { background: #22d3ee; background-clip: padding-box; }

  /* ---------- Cards ---------- */
  .reg-card {
    transition: transform .28s cubic-bezier(.34,1.4,.64,1), box-shadow .28s ease, border-color .28s ease;
    will-change: transform;
  }
  .reg-card:hover { transform: translateY(-6px); box-shadow: 0 22px 44px -18px rgba(0,0,0,0.85); border-color: rgba(255,255,255,0.18); }
  .reg-card.is-open { transform: none; box-shadow: 0 26px 50px -20px rgba(0,0,0,0.8); }
  .reg-card.is-ready { box-shadow: 0 0 0 2px rgba(34,211,238,0.30), 0 14px 30px -16px rgba(0,0,0,0.75); }

  /* ---------- Buttons ---------- */
  .reg-btn { transition: transform .18s ease, filter .18s ease, box-shadow .18s ease; }
  .reg-btn:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.08); box-shadow: 0 12px 24px -12px rgba(0,0,0,0.65); }
  .reg-btn:active:not(:disabled) { transform: translateY(0) scale(.985); }
  .reg-add { transition: background-color .2s ease, border-color .2s ease, color .2s ease; }
  .reg-add:hover { background-color: rgba(34,211,238,0.10); border-color: rgba(34,211,238,0.55); color: #a5f3fc; }

  /* ---------- Inputs ---------- */
  .reg-input { transition: border-color .18s ease, box-shadow .18s ease, background-color .18s ease; }
  .reg-input::placeholder { color: rgba(148,163,184,0.75); }
  .reg-input:focus { border-color: rgba(34,211,238,0.65); background-color: rgba(255,255,255,0.09); box-shadow: 0 0 0 3px rgba(34,211,238,0.18); }
  .reg-participant { transition: border-color .2s ease, background-color .2s ease; }
  .reg-participant:focus-within { border-color: rgba(34,211,238,0.45); background-color: rgba(255,255,255,0.07); }

  /* ---------- Summary items ---------- */
  .reg-summary-item { transition: background-color .2s ease, transform .2s ease, border-color .2s ease; }
  .reg-summary-item:hover { background-color: rgba(34,211,238,0.10); border-color: rgba(34,211,238,0.40); transform: translateX(3px); }

  /* ---------- Animations ---------- */
  @keyframes regPop { 0% { transform: scale(.82); opacity: .35; } 60% { transform: scale(1.09); } 100% { transform: scale(1); opacity: 1; } }
  .reg-pop { display: inline-block; animation: regPop .38s cubic-bezier(.34,1.5,.64,1); }
  @keyframes regSpin { to { transform: rotate(360deg); } }
  .reg-spinner {
    width: 38px; height: 38px; border-radius: 50%;
    border: 3px solid rgba(255,255,255,0.15); border-top-color: #22d3ee;
    animation: regSpin .9s linear infinite; display: inline-block;
  }

  /* ---------- Responsive ---------- */
  /* Tablet: the summary drops below the events and stops being sticky — pinning it
     in a short column would just trap it against the fold. Both panes now scroll
     with the page. */
  @media (max-width: 1024px) {
    .reg-layout { display: flex; flex-direction: column-reverse; gap: 24px; }
    .reg-main { gap: 18px; width: 100%; }
    .reg-summary { position: static; }
    .reg-summary-card { max-height: none; overflow: visible; }
    .reg-summary-list { max-height: none; overflow: visible; }
  }
  @media (max-width: 720px) {
    .reg-grid { grid-template-columns: minmax(0, 1fr); }
    .reg-input-row { flex-direction: column; }
  }
  @media (prefers-reduced-motion: reduce) {
    .reg-card, .reg-btn, .reg-summary-item, .reg-pop, .reg-spinner { transition: none !important; animation: none !important; }
  }
`;

// ---------------------------------------------------------------- phone rules
// Participants are Indian mobile numbers: 10 digits starting 6-9.
// Keep only digits while typing, but leave room for a pasted 91/+91 or a leading
// 0 so a number copied from a contacts app is not silently truncated.
const sanitizePhoneInput = (value) => String(value ?? '').replace(/\D/g, '').slice(0, 12);

// Reduce any accepted format down to the bare 10-digit subscriber number.
const normalizePhone = (value) => {
  const digits = sanitizePhoneInput(value);
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
};

const isValidPhone = (value) => /^[6-9]\d{9}$/.test(normalizePhone(value));

export default function EventsPage() {
  const router = useRouter();

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [registeredEventIds, setRegisteredEventIds] = useState([]);
  const [registeredEventMap, setRegisteredEventMap] = useState({});
  const [globalPaymentStatus, setGlobalPaymentStatus] = useState(null);
  const [globalPendingAmount, setGlobalPendingAmount] = useState(0);
  // The team fee is charged once. If a payment already exists for this user or their
  // team, every "pay ₹2000" prompt on this page has to disappear — a second event
  // must not be billed a second time. This holds while the payment is still waiting
  // on admin approval too: the money has left the user's account either way.
  const [feeHandled, setFeeHandled] = useState(false);
  const [feeAwaitingApproval, setFeeAwaitingApproval] = useState(false);

  // User profile and team status
  const [userProfile, setUserProfile] = useState(null);
  const [hasTeam, setHasTeam] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [newTeamInput, setNewTeamInput] = useState("");
  const [settingTeam, setSettingTeam] = useState(false);
  const [teamError, setTeamError] = useState(null);
  const [teamSuccess, setTeamSuccess] = useState(null);

  // Track which event has its registration form open
  const [expandedEventId, setExpandedEventId] = useState(null);

  // Registration form state for all events (Dictionary: eventId -> participants array)
  const [formsData, setFormsData] = useState({});

  // Global submit state
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [globalSuccess, setGlobalSuccess] = useState(null);

  const handleSetTeam = async (e) => {
    if (e) e.preventDefault();
    if (!newTeamInput.trim()) {
      setTeamError("Please enter a valid team name.");
      return;
    }
    setSettingTeam(true);
    setTeamError(null);
    setTeamSuccess(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/teams/set-team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ teamName: newTeamInput.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setHasTeam(true);
        const name = data?.team?.name || newTeamInput.trim();
        setTeamName(name);
        setTeamSuccess(`Team '${name}' created and set successfully! You can now register for events.`);
        setNewTeamInput("");
        setGlobalError(null);
      } else {
        setTeamError(data.message || 'Failed to set team');
      }
    } catch (err) {
      setTeamError(err.message || 'An error occurred while setting team');
    } finally {
      setSettingTeam(false);
    }
  };

  useEffect(() => {
    // Auth check
    const token = localStorage.getItem('token');
    if (!token) {
      const redirectUrl = encodeURIComponent(window.location.pathname);
      router.push(`/user/register?redirect=${redirectUrl}`);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsAuthorized(true);

    async function fetchEventsAndUserData() {
      try {
        // Fetch User Info & Team Status
        try {
          const userRes = await fetch(`${API_BASE_URL}/api/auth/verifyuser`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            const u = userData.user || userData;
            setUserProfile(u);
            const userHasTeam = Boolean(userData.hasTeam || u?.teamid || u?.teamName || u?.team);
            setHasTeam(userHasTeam);
            const tName = userData.teamName || u?.teamName || u?.team?.name || (typeof u?.teamid === 'object' ? u?.teamid?.name : "");
            setTeamName(tName);
          }
        } catch (err) {
          console.error("Failed to verify user status", err);
        }

        const res = await fetch(`${API_BASE_URL}/api/events`);
        const data = await res.json();

        if (res.ok) {
          setEvents(data.events || data.data || []);
          setEventsError(null);
        } else {
          setEvents([]);
          setEventsError(data.message || `Server responded with ${res.status}.`);
          console.error("Failed to load events", data);
        }

        // Check for global draft in localStorage
        const savedDraft = localStorage.getItem('event_cart_draft');
        if (savedDraft) {
          try {
            const parsed = JSON.parse(savedDraft);
            if (typeof parsed === 'object') {
              setFormsData(parsed);
            }
          } catch (err) {
            console.error("Failed to parse draft", err);
          }
        }

        // Does the team already have a payment on file — approved, or submitted and
        // still in the approval queue? Asked before the registrations are mapped, so
        // the per-event status below can be marked covered instead of payment due.
        let paidAndApproved = false;
        let paidAwaitingApproval = false;
        try {
          const { isPaymentDone, isPaymentPending } = await fetchPaymentDone(token);
          paidAndApproved = isPaymentDone;
          paidAwaitingApproval = isPaymentPending;
          setFeeHandled(isPaymentDone || isPaymentPending);
          setFeeAwaitingApproval(!isPaymentDone && isPaymentPending);
        } catch (err) {
          console.error("Failed to check payment status", err);
        }

        // Fetch user registrations
        try {
          const regRes = await fetch(`${API_BASE_URL}/api/registrations`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (regRes.ok) {
            const regData = await regRes.json();
            const regList = regData.registrations || (regData.registration?.events) || regData.data || [];

            const ids = [];
            const map = {};
            let pendingSum = 0;

            regList.forEach(reg => {
              const evObj = reg.eventId;
              const evId = typeof evObj === 'object' ? evObj?._id : evObj;
              if (evId) {
                ids.push(evId);
                const payments = Array.isArray(reg.paymentId)
                  ? reg.paymentId
                  : (reg.paymentId ? [reg.paymentId] : []);

                let pStatus = 'unpaid';
                if (payments.length > 0) {
                  const hasApproved = payments.some(p => p.status === 'approved' || p.status === 'verified');
                  const hasPending = payments.some(p => p.status === 'pending' || p.status === 'submitted');
                  pStatus = hasApproved ? 'approved' : (hasPending ? 'pending' : 'unpaid');
                }

                // No payment record of its own, but the team has already paid:
                // the event is covered, not owed. An approved payment confirms it
                // outright; one still in the queue leaves it verifying, which is the
                // same state an event with its own unapproved payment sits in.
                if (pStatus === 'unpaid' && paidAndApproved) {
                  pStatus = 'covered';
                } else if (pStatus === 'unpaid' && paidAwaitingApproval) {
                  pStatus = 'pending';
                }

                if (pStatus === 'unpaid') {
                  const fee = typeof evObj === 'object' ? (evObj.registrationFee || 0) : 0;
                  pendingSum += fee;
                }

                map[evId] = {
                  status: pStatus,
                  registration: reg
                };
              }
            });

            setRegisteredEventIds(ids);
            setRegisteredEventMap(map);
            setGlobalPendingAmount(pendingSum);
          }
        } catch (err) {
          console.error("Failed to fetch registrations", err);
        }
      } catch (err) {
        setEvents([]);
        setEventsError(`Could not reach the server at ${API_BASE_URL}. ${err.message || ''}`.trim());
        console.error("Failed to load events", err);
      } finally {
        setLoadingEvents(false);
      }
    }
    fetchEventsAndUserData();
  }, [router, reloadKey]);

  if (!isAuthorized) {
    return (
      <div style={styles.page} className="bg-black">
        <div style={styles.container}>
          <p className="text-cyan-400 font-bold tracking-widest uppercase animate-pulse" style={{ textAlign: 'center', marginTop: 40 }}>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const toggleEventForm = (event) => {
    if (expandedEventId === event._id) {
      setExpandedEventId(null);
    } else {
      setExpandedEventId(event._id);

      // Initialize participants if not already present in formsData
      if (!formsData[event._id]) {
        const minLen = event.minParticipants || 1;
        const initialParticipants = Array.from({ length: minLen }).map(() => ({
          name: '',
          phone: ''
        }));
        setFormsData(prev => ({
          ...prev,
          [event._id]: initialParticipants
        }));
      }
    }
  };

  const handleAddParticipant = (event) => {
    const currentList = formsData[event._id] || [];
    if (currentList.length < event.maxParticipants) {
      setFormsData({
        ...formsData,
        [event._id]: [...currentList, { name: '', phone: '' }]
      });
    }
  };

  const handleRemoveParticipant = (index, event) => {
    const currentList = formsData[event._id] || [];
    if (currentList.length > event.minParticipants) {
      const updated = [...currentList];
      updated.splice(index, 1);
      setFormsData({
        ...formsData,
        [event._id]: updated
      });
    }
  };

  const handleChange = (index, field, value, eventId) => {
    const currentList = formsData[eventId] || [];
    // Copy the row being edited instead of writing through to it: the old code
    // mutated the object still held in state before calling setFormsData.
    const updated = currentList.map((p, i) =>
      i === index ? { ...p, [field]: field === 'phone' ? sanitizePhoneInput(value) : value } : p
    );
    setFormsData({
      ...formsData,
      [eventId]: updated
    });
  };

  const handleSaveDraft = () => {
    localStorage.setItem('event_cart_draft', JSON.stringify(formsData));
    setGlobalSuccess("Draft saved securely to your browser.");
    setTimeout(() => setGlobalSuccess(null), 3000);
  };

  // Validation function for a single event form
  const isFormValid = (eventId) => {
    const participants = formsData[eventId];
    if (!participants || !Array.isArray(participants)) return false;

    const event = events.find(e => e._id === eventId);
    if (!event) return false;

    const min = event.minParticipants || 1;
    const max = event.maxParticipants || 100;
    if (participants.length < min || participants.length > max) return false;

    for (let p of participants) {
      if (!p.name || !p.name.trim()) return false;
      // An event only counts as ready once every phone is a real mobile number,
      // so a typo cannot reach checkout as a "completed" event.
      if (!isValidPhone(p.phone)) return false;
    }

    // The same number twice in one team is nearly always a copy-paste slip.
    const numbers = participants.map((p) => normalizePhone(p.phone));
    if (new Set(numbers).size !== numbers.length) return false;

    return true;
  };

  const getValidForms = () => {
    const valid = [];
    for (const event of events) {
      if (!registeredEventIds.includes(event._id) && isFormValid(event._id)) {
        valid.push({ event, participants: formsData[event._id] });
      }
    }
    return valid;
  };

  const handleCheckout = async () => {
    setSubmitting(true);
    setGlobalError(null);
    setGlobalSuccess(null);

    if (!hasTeam) {
      setGlobalError("Team ID is required before event registration. Please set your team name above first.");
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const validForms = getValidForms();

    if (validForms.length === 0) {
      setGlobalError("You haven't correctly filled out all participant details (Name & Phone) for any event.");
      setSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("You must be logged in to register.");

      // Format payload to satisfy backend eventId, eventIds, and events parsing
      const allEventIds = validForms.map(f => f.event._id || f.event.id);
      const firstForm = validForms[0];
      const singleEventId = validForms.length === 1 ? (firstForm.event._id || firstForm.event.id) : undefined;
      const singleParticipants = validForms.length === 1
        ? firstForm.participants.map(p => ({ name: p.name.trim(), phone: normalizePhone(p.phone) }))
        : undefined;

      const payload = {
        eventId: singleEventId,
        eventIds: allEventIds,
        participants: singleParticipants,
        events: validForms.map(({ event, participants }) => ({
          eventId: event._id || event.id,
          _id: event._id || event.id,
          participants: participants.map(p => ({
            name: p.name.trim(),
            // Send the bare 10 digits whatever the user pasted in.
            phone: normalizePhone(p.phone),
          }))
        }))
      };

      const response = await fetch(`${API_BASE_URL}/api/registrations/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.message && data.message.includes("Team ID")) {
          setHasTeam(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        throw new Error(data.message || 'Registration failed');
      }

      // Extract newly registered event IDs
      const newlyRegisteredIds = validForms.map(f => f.event._id);

      setRegisteredEventIds(prev => Array.from(new Set([...prev, ...newlyRegisteredIds])));

      // Update registered map for newly registered items
      setRegisteredEventMap(prev => {
        const nextMap = { ...prev };
        newlyRegisteredIds.forEach(id => {
          nextMap[id] = { status: feeHandled ? (feeAwaitingApproval ? 'pending' : 'covered') : 'unpaid' };
        });
        return nextMap;
      });

      localStorage.removeItem('event_cart_draft'); // Clear global draft

      // Re-check rather than trusting the flag from page load: the user may have paid
      // (or had a payment approved) while this tab sat open, and a stale "false"
      // would bill them a second time for a fee they have already settled.
      const { isPaymentDone, isPaymentPending } = await fetchPaymentDone(token);
      if (isPaymentDone || isPaymentPending) {
        setFeeHandled(true);
        setFeeAwaitingApproval(!isPaymentDone && isPaymentPending);
        setRegisteredEventMap(prev => {
          const nextMap = { ...prev };
          newlyRegisteredIds.forEach(id => {
            nextMap[id] = { status: isPaymentDone ? 'covered' : 'pending' };
          });
          return nextMap;
        });
        setGlobalPendingAmount(0);
        setFormsData({});
        setExpandedEventId(null);
        setGlobalSuccess(
          isPaymentDone
            ? `Successfully registered for ${validForms.length} event(s)! Your registration fee is already paid, so there is nothing more to pay.`
            : `Successfully registered for ${validForms.length} event(s)! Your payment is already submitted and awaiting approval — don't pay again.`
        );
        return;
      }

      setGlobalSuccess(data.message || `Successfully registered for ${validForms.length} event(s)! Redirecting to payment...`);

      setTimeout(() => {
        // One team fee covers the whole registration, however many events it holds.
        sessionStorage.setItem('pendingPaymentAmount', TEAM_REGISTRATION_FEE);
        sessionStorage.setItem('pendingEventIds', JSON.stringify(newlyRegisteredIds));
        router.push('/user/account/payment');
      }, 1500);

    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Smoothly bring a card into view inside the scrollable events pane
  const scrollToEvent = (eventId) => {
    if (typeof document === 'undefined') return;
    const el = document.getElementById(`event-card-${eventId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const validFormsCount = getValidForms().length;
  const checkoutDisabled = submitting || validFormsCount === 0;

  return (
    <div style={styles.page} className="relative bg-black overflow-x-clip p-4 sm:p-6 md:p-10">
      <style>{pageCss}</style>

      {/* Decorative noise/texture overlay for the background */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none z-0"></div>

      {/* Water Wave Effect */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-auto">
        <WaterWave
          imageUrl="/profile_bg.jpg"
          dropRadius={25}
          perturbance={0.03}
          resolution={1024}
          className="absolute inset-0 w-full h-full opacity-100 bg-cover bg-center"
          style={{ backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          {() => <div className="w-full h-full pointer-events-none" />}
        </WaterWave>
      </div>

      <div style={{ ...styles.container, position: 'relative', zIndex: 10 }}>
        <div style={styles.header}>
          <h1 style={styles.pageTitle}>Events</h1>
          <p style={styles.pageSubtitle}>Discover and register for the latest events.</p>
        </div>

        {/* ===== MAIN LAYOUT: team + events scroll together | summary stays pinned ===== */}
        <div className="reg-layout">

          {/* -------- LEFT: team card + events, scrolled by the page -------- */}
          <div className="reg-main">
            {/* Team Banner / Team Setup Card — scrolls away with the events */}
            <div className="p-6 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-lg">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white tracking-wide">
                      {hasTeam ? `Active Team: ${teamName || "Set"}` : "Team Registration Required"}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">
                      {hasTeam
                        ? "Your team is set. All event registrations will be grouped under this team."
                        : "You must create or enter a Team Name before registering for events."}
                    </p>
                  </div>
                </div>
                {hasTeam && (
                  <span className="px-3.5 py-1 bg-teal-500/10 text-teal-300 border border-teal-500/30 font-bold text-xs rounded-full shrink-0">
                    ✓ Team Ready
                  </span>
                )}
              </div>

              {!hasTeam && (
                <form onSubmit={handleSetTeam} className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-white/10">
                  <input
                    type="text"
                    value={newTeamInput}
                    onChange={(e) => setNewTeamInput(e.target.value)}
                    placeholder="Enter Team Name (e.g. CyberKnights)"
                    className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 focus:border-cyan-500/50 rounded-xl text-sm font-medium text-white focus:outline-none placeholder-gray-500 transition-colors"
                    required
                  />
                  <button
                    type="submit"
                    disabled={settingTeam || !newTeamInput.trim()}
                    className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition-all border border-cyan-400/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {settingTeam ? "Setting Team..." : "Set Team & Continue"}
                  </button>
                </form>
              )}

              {teamError && <div className="mt-3 p-2.5 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl font-medium">⚠ {teamError}</div>}
              {teamSuccess && <div className="mt-3 p-2.5 text-xs text-teal-300 bg-teal-500/10 border border-teal-500/30 rounded-xl font-medium">✓ {teamSuccess}</div>}
            </div>

            {loadingEvents ? (
              <div style={styles.loadingBox}>
                <span className="reg-spinner" />
                <p style={styles.loadingText}>Loading events…</p>
              </div>
            ) : (
              <section style={styles.eventsPane} className="reg-pane">
                <div style={styles.paneHeader}>
                  <div>
                    <h2 style={styles.paneTitle}>Choose Your Events</h2>
                    <p style={styles.paneHint}>Fill in participant details to add an event to your cart.</p>
                  </div>
                  <span style={styles.paneCount}>{events.length} available</span>
                </div>

                <div className="reg-gridwrap">
                  <div className={`reg-grid${expandedEventId !== null ? ' is-open' : ''}`}>
                    {events.length === 0 && (
                      <div style={styles.noEvents}>
                        {eventsError ? (
                          <>
                            <span style={styles.noEventsIcon}>⚠</span>
                            <p style={styles.noEventsTitle}>Couldn&apos;t load events</p>
                            <p style={styles.noEventsSub}>{eventsError}</p>
                            <button
                              type="button"
                              className="reg-btn"
                              style={styles.retryBtn}
                              onClick={() => {
                                setLoadingEvents(true);
                                setEventsError(null);
                                setReloadKey((k) => k + 1);
                              }}
                            >
                              Retry
                            </button>
                          </>
                        ) : (
                          <>
                            <span style={styles.noEventsIcon}>🌊</span>
                            <p style={styles.noEventsTitle}>No events published yet</p>
                            <p style={styles.noEventsSub}>Check back soon.</p>
                          </>
                        )}
                      </div>
                    )}

                    {events.map((event) => {
                      const isExpanded = expandedEventId === event._id;
                      const participants = formsData[event._id] || [];
                      const isValid = isFormValid(event._id);
                      const isRegistered = registeredEventIds.includes(event._id);
                      const eventRegInfo = registeredEventMap[event._id];
                      const pStatus = eventRegInfo?.status || 'unpaid';

                      const accent = isRegistered
                        ? (pStatus === 'approved' || pStatus === 'covered' ? '#10b981' : pStatus === 'pending' ? '#f59e0b' : '#fb923c')
                        : isValid
                          ? '#22d3ee'
                          : 'rgba(255,255,255,0.10)';

                      const statusChip = isRegistered
                        ? (pStatus === 'approved'
                          ? { text: 'Confirmed', bg: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: 'rgba(16,185,129,0.40)' }
                          : pStatus === 'covered'
                            ? { text: 'Fee paid', bg: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: 'rgba(16,185,129,0.40)' }
                            : pStatus === 'pending'
                              ? { text: 'Verifying', bg: 'rgba(245,158,11,0.15)', color: '#fcd34d', border: 'rgba(245,158,11,0.40)' }
                              : { text: 'Payment due', bg: 'rgba(249,115,22,0.15)', color: '#fdba74', border: 'rgba(249,115,22,0.40)' })
                        : isValid
                          ? { text: '✓ In cart', bg: 'rgba(34,211,238,0.15)', color: '#67e8f9', border: 'rgba(34,211,238,0.40)' }
                          : participants.length > 0
                            ? { text: 'Draft', bg: 'rgba(148,163,184,0.14)', color: '#cbd5e1', border: 'rgba(148,163,184,0.30)' }
                            : null;

                      return (
                        <article
                          key={event._id}
                          id={`event-card-${event._id}`}
                          className={`reg-card${isExpanded ? ' is-open' : ''}${isValid && !isRegistered ? ' is-ready' : ''}`}
                          style={{
                            ...styles.card,
                            borderColor: accent,
                          }}
                        >
                          <div style={styles.cardHeader}>
                            <h3 style={styles.cardTitle}>{event.title}</h3>

                          </div>

                          <p style={styles.description}>{event.description}</p>

                          <div style={styles.detailsRow}>
                            <span style={styles.detailTag}>
                              {event.minParticipants === event.maxParticipants
                                ? `Team Size: ${event.minParticipants}`
                                : `Team Size: ${event.minParticipants} - ${event.maxParticipants}`}
                            </span>
                            {statusChip && (
                              <span
                                style={{
                                  ...styles.statusChip,
                                  backgroundColor: statusChip.bg,
                                  color: statusChip.color,
                                  borderColor: statusChip.border,
                                }}
                              >
                                {statusChip.text}
                              </span>
                            )}
                          </div>

                          {isRegistered ? (
                            pStatus === 'approved' ? (
                              <button disabled style={{ ...styles.actionBtn, background: 'rgba(16,185,129,0.18)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.35)', cursor: 'not-allowed' }}>
                                ✓ Registered &amp; Verified
                              </button>
                            ) : pStatus === 'covered' ? (
                              // The fee is already settled for this team, so this event
                              // costs nothing extra — never show a payment button here.
                              <button disabled style={{ ...styles.actionBtn, background: 'rgba(16,185,129,0.18)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.35)', cursor: 'not-allowed' }}>
                                ✓ Registered — Fee Already Paid
                              </button>
                            ) : pStatus === 'pending' ? (
                              <button disabled style={{ ...styles.actionBtn, background: 'rgba(245,158,11,0.18)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.35)', cursor: 'not-allowed' }}>
                                ⏳ Payment Verification Pending
                              </button>
                            ) : (
                              <button
                                className="reg-btn"
                                onClick={() => {
                                  sessionStorage.setItem('pendingPaymentAmount', TEAM_REGISTRATION_FEE);
                                  sessionStorage.setItem('pendingEventIds', JSON.stringify([event._id]));
                                  router.push('/user/account/payment');
                                }}
                                style={{ ...styles.actionBtn, background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                              >
                                Complete Payment (₹{TEAM_REGISTRATION_FEE})
                              </button>
                            )
                          ) : !isExpanded ? (
                            <button
                              className="reg-btn"
                              onClick={() => toggleEventForm(event)}
                              style={{
                                ...styles.actionBtn,
                                background: isValid
                                  ? 'linear-gradient(135deg, #0d9488, #0f766e)'
                                  : participants.length > 0
                                    ? 'rgba(255,255,255,0.08)'
                                    : 'linear-gradient(135deg, #0891b2, #0e7490)',
                                border: !isValid && participants.length > 0 ? '1px solid rgba(255,255,255,0.15)' : 'none',
                              }}
                            >
                              {isValid ? 'Edit Details ✓' : participants.length > 0 ? 'Continue Registration' : 'Register Now'}
                            </button>
                          ) : (
                            <div style={styles.formContainer}>
                              <div style={styles.formDivider} />
                              <div style={styles.formTitleRow}>
                                <h4 style={styles.formTitle}>Registration Details</h4>
                                <span style={styles.formCounter}>
                                  {participants.length}/{event.maxParticipants} members
                                </span>
                              </div>

                              <div style={styles.form}>
                                {participants.map((p, index) => {
                                  const phoneDigits = normalizePhone(p.phone);
                                  const isDuplicatePhone =
                                    phoneDigits.length === 10 &&
                                    participants.some((other, i) => i !== index && normalizePhone(other.phone) === phoneDigits);
                                  const phoneError = !p.phone
                                    ? null
                                    : !isValidPhone(p.phone)
                                      ? 'Enter a valid 10-digit mobile number.'
                                      : isDuplicatePhone
                                        ? 'This number is already used by another participant.'
                                        : null;

                                  return (
                                    <div key={index} style={styles.participantBlock} className="reg-participant">
                                      <div style={styles.participantHeader}>
                                        <span style={styles.participantLabel}>
                                          Participant {index + 1} {index === 0 && '(Lead)'}
                                        </span>
                                        {participants.length > event.minParticipants && (
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveParticipant(index, event)}
                                            style={styles.removeBtn}
                                          >
                                            Remove
                                          </button>
                                        )}
                                      </div>

                                      <div style={styles.row} className="reg-input-row">
                                        <input
                                          className="reg-input"
                                          style={styles.inputHalf}
                                          placeholder="Full Name"
                                          autoComplete="off"
                                          value={p.name}
                                          onChange={(e) => handleChange(index, 'name', e.target.value, event._id)}
                                        />
                                        <input
                                          className="reg-input"
                                          style={{
                                            ...styles.inputHalf,
                                            ...(phoneError ? styles.inputInvalid : null),
                                          }}
                                          type="tel"
                                          inputMode="numeric"
                                          autoComplete="tel"
                                          maxLength={12}
                                          placeholder="10-digit mobile number"
                                          aria-invalid={phoneError ? 'true' : 'false'}
                                          value={p.phone}
                                          onChange={(e) => handleChange(index, 'phone', e.target.value, event._id)}
                                        />
                                      </div>

                                      {/* Stays quiet until there is something to correct,
                                        so a half-typed number is not flagged mid-entry. */}
                                      {phoneError && (
                                        <span style={styles.fieldError}>{phoneError}</span>
                                      )}
                                    </div>
                                  );
                                })}

                                {participants.length < event.maxParticipants && (
                                  <button type="button" onClick={() => handleAddParticipant(event)} style={styles.addBtn} className="reg-add">
                                    + Add Team Member
                                  </button>
                                )}

                                <button type="button" onClick={() => setExpandedEventId(null)} style={styles.collapseBtn} className="reg-btn">
                                  {isValid ? 'Done' : 'Minimize Event Form'}
                                </button>
                              </div>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* -------- RIGHT: checkout summary, pinned while the left column scrolls -------- */}
          <aside className="reg-summary">
            <div style={styles.summaryCard} className="reg-summary-card">
              {!hasTeam && (
                <div style={styles.teamWarn}>Set your team name above to unlock checkout.</div>
              )}

              <div style={styles.summaryActions}>
                <button type="button" onClick={handleSaveDraft} style={styles.draftBtn} className="reg-btn">
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={checkoutDisabled}
                  className="reg-btn"
                  style={{
                    ...styles.checkoutBtn,
                    ...(checkoutDisabled ? styles.checkoutBtnDisabled : null),
                  }}
                >
                  {submitting
                    ? 'Processing…'
                    : feeHandled
                      ? 'Confirm Registration'
                      : 'Save & Make Payment'}
                </button>
              </div>

              {/* The fee is per team and already settled — say so where the user is
                  about to expect a payment step. A payment still in the approval
                  queue counts: the user has paid, an admin just hasn't looked yet. */}
              {feeHandled && (
                <div style={feeAwaitingApproval ? styles.pendingNotice : styles.paidNotice}>
                  {feeAwaitingApproval
                    ? '⏳ Payment already submitted and awaiting admin approval — do not pay again. New events are covered by it.'
                    : '✓ Registration fee already paid — new events cost you nothing extra.'}
                </div>
              )}

              {/* Say what is blocking checkout. A greyed-out button on its own
                  reads as broken rather than as waiting on the user. */}
              {!submitting && validFormsCount === 0 && hasTeam && (
                <p style={styles.checkoutHint}>Add at least one event to continue.</p>
              )}

              {globalError && <div style={styles.globalError}>⚠ {globalError}</div>}
              {globalSuccess && <div style={styles.globalSuccess}>✓ {globalSuccess}</div>}
            </div>
          </aside>
        </div>


      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    width: '100%',
    color: '#e2e8f0',
    boxSizing: 'border-box',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  container: {
    maxWidth: 1320,
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: 32,
    marginTop: 32,
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: 800,
    margin: '0 0 12px',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#ffffff',
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    margin: 0,
  },

  // ---------- Loading ----------
  loadingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    padding: '60px 0',
  },
  loadingText: {
    color: '#22d3ee',
    fontWeight: 700,
    margin: 0,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // ---------- Left pane (scrollable events) ----------
  eventsPane: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 16,
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    boxShadow: '0 16px 40px -24px rgba(0,0,0,0.9)',
    minWidth: 0,
  },
  paneHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: '4px 6px 14px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  paneTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  paneHint: {
    margin: '3px 0 0',
    fontSize: 12.5,
    color: '#94a3b8',
    fontWeight: 500,
  },
  paneCount: {
    fontSize: 11.5,
    fontWeight: 800,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#67e8f9',
    backgroundColor: 'rgba(34,211,238,0.10)',
    border: '1px solid rgba(34,211,238,0.30)',
    padding: '5px 12px',
    borderRadius: 999,
    whiteSpace: 'nowrap',
  },
  noEvents: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '36px 20px',
    color: '#94a3b8',
    fontWeight: 600,
    border: '1px dashed rgba(255,255,255,0.15)',
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  noEventsIcon: { fontSize: 30, display: 'block', marginBottom: 8 },
  noEventsTitle: { margin: 0, fontSize: 15.5, fontWeight: 800, color: '#e2e8f0' },
  noEventsSub: {
    margin: '6px auto 0',
    fontSize: 12.5,
    fontWeight: 500,
    color: '#94a3b8',
    maxWidth: 380,
    lineHeight: 1.5,
    wordBreak: 'break-word',
  },
  retryBtn: {
    marginTop: 14,
    padding: '9px 22px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #0891b2, #0e7490)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
  },

  // ---------- Event card ----------
  card: {
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: '20px 18px 18px',
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    boxShadow: '0 8px 24px -12px rgba(0,0,0,0.8)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 17.5,
    fontWeight: 800,
    margin: 0,
    lineHeight: 1.25,
    color: '#ffffff',
    letterSpacing: 0.3,
    minWidth: 0,
  },
  feeBadge: {
    backgroundColor: 'rgba(34,211,238,0.12)',
    color: '#67e8f9',
    padding: '4px 10px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    border: '1px solid rgba(34,211,238,0.35)',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  description: {
    fontSize: 13.5,
    color: '#94a3b8',
    lineHeight: 1.5,
    margin: '0 0 12px',
  },
  detailsRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  detailTag: {
    fontSize: 11.5,
    color: '#cbd5e1',
    backgroundColor: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    padding: '4px 9px',
    borderRadius: 8,
    fontWeight: 700,
  },
  statusChip: {
    fontSize: 11.5,
    padding: '4px 9px',
    borderRadius: 999,
    fontWeight: 700,
    border: '1px solid transparent',
  },
  actionBtn: {
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(135deg, #0891b2, #0e7490)',
    color: 'white',
    border: 'none',
    borderRadius: 14,
    fontSize: 14.5,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 'auto',
  },

  // ---------- Inline form ----------
  formContainer: { marginTop: 'auto' },
  formDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    margin: '0 0 14px 0',
  },
  formTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  formTitle: {
    fontSize: 14.5,
    fontWeight: 800,
    color: '#ffffff',
    margin: 0,
  },
  formCounter: {
    fontSize: 11.5,
    fontWeight: 700,
    color: '#67e8f9',
    backgroundColor: 'rgba(34,211,238,0.10)',
    border: '1px solid rgba(34,211,238,0.30)',
    padding: '3px 9px',
    borderRadius: 999,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  participantBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 14,
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.1)',
  },
  participantHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantLabel: {
    fontSize: 11.5,
    fontWeight: 800,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#f87171',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    padding: 0,
  },
  row: {
    display: 'flex',
    gap: 10,
  },
  inputHalf: {
    width: '100%',
    flex: 1,
    minWidth: 0,
    padding: '10px 14px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#f1f5f9',
    fontSize: 14,
    boxSizing: 'border-box',
    outline: 'none',
  },
  inputInvalid: {
    // Full shorthand, not just borderColor: inputHalf sets `border`, and mixing the
    // two means React strips the longhand on rerender while the shorthand stays —
    // which leaves a stale border and logs a styling warning.
    border: '1px solid rgba(248,113,113,0.65)',
    backgroundColor: 'rgba(248,113,113,0.08)',
  },
  fieldError: {
    fontSize: 11.5,
    fontWeight: 600,
    color: '#fca5a5',
    lineHeight: 1.4,
  },
  addBtn: {
    background: 'none',
    color: '#67e8f9',
    border: '1px dashed rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: '10px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  collapseBtn: {
    padding: '10px',
    backgroundColor: 'transparent',
    color: '#cbd5e1',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 14,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },

  // ---------- Right pane (sticky summary) ----------
  summaryCard: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 24,
    boxShadow: '0 24px 50px -24px rgba(0,0,0,0.95)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    boxSizing: 'border-box',
  },
  summaryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  summaryTitle: {
    margin: 0,
    fontSize: 17,
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  summaryBadge: {
    fontSize: 11.5,
    fontWeight: 800,
    color: '#67e8f9',
    backgroundColor: 'rgba(34,211,238,0.10)',
    border: '1px solid rgba(34,211,238,0.30)',
    padding: '4px 11px',
    borderRadius: 999,
    whiteSpace: 'nowrap',
  },
  // Repeats the whole `border` shorthand rather than overriding borderColor:
  // this object is spread in only while the cart is empty, so a longhand here
  // would be *removed* on the render where the first event becomes ready, while
  // summaryBadge's shorthand stayed put. React warns about exactly that, and the
  // dropped colour can fail to repaint.
  summaryBadgeIdle: {
    color: '#94a3b8',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
  },
  progressTrack: {
    height: 7,
    width: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    background: 'linear-gradient(90deg, #22d3ee, #0e7490)',
    transition: 'width .45s cubic-bezier(.4,0,.2,1)',
  },
  progressLabel: {
    margin: 0,
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: 600,
  },
  progressStrong: { color: '#e2e8f0', fontWeight: 800 },
  // max-height / overflow live in .reg-summary-list so the tablet breakpoint can
  // unpin the card and let the list grow.
  summaryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    margin: '2px 0',
  },
  emptyState: {
    textAlign: 'center',
    padding: '18px 14px',
    border: '1px dashed rgba(255,255,255,0.15)',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  emptyIconWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    marginBottom: 10,
    borderRadius: 999,
    color: '#67e8f9',
    backgroundColor: 'rgba(34,211,238,0.10)',
    border: '1px solid rgba(34,211,238,0.25)',
  },
  emptyText: { margin: 0, fontSize: 13.5, fontWeight: 800, color: '#e2e8f0' },
  emptySub: { margin: '4px 0 0', fontSize: 11.5, color: '#94a3b8', lineHeight: 1.45 },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    textAlign: 'left',
    padding: '10px 12px',
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    cursor: 'pointer',
    font: 'inherit',
  },
  summaryItemMain: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 },
  summaryItemTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#f1f5f9',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 200,
  },
  summaryItemMeta: { fontSize: 11, color: '#94a3b8', fontWeight: 600 },
  summaryItemFee: { fontSize: 13.5, fontWeight: 800, color: '#34d399', whiteSpace: 'nowrap' },
  pendingNote: {
    fontSize: 12,
    fontWeight: 600,
    color: '#fcd34d',
    backgroundColor: 'rgba(245,158,11,0.12)',
    border: '1px solid rgba(245,158,11,0.30)',
    borderRadius: 12,
    padding: '8px 10px',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 10,
    paddingTop: 12,
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  totalLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    fontSize: 13.5,
    fontWeight: 700,
    color: '#94a3b8',
  },
  totalMeta: { fontSize: 11, fontWeight: 600, color: '#67e8f9' },
  totalValue: { fontSize: 26, fontWeight: 800, color: '#ffffff', letterSpacing: -0.5 },
  pendingNotice: {
    marginTop: 12,
    padding: '10px 12px',
    borderRadius: 12,
    backgroundColor: 'rgba(245,158,11,0.12)',
    border: '1px solid rgba(245,158,11,0.35)',
    color: '#fcd34d',
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.5,
  },
  paidNotice: {
    marginTop: 12,
    padding: '10px 12px',
    borderRadius: 12,
    backgroundColor: 'rgba(16,185,129,0.12)',
    border: '1px solid rgba(16,185,129,0.35)',
    color: '#6ee7b7',
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.5,
  },
  teamWarn: {
    fontSize: 12,
    fontWeight: 600,
    color: '#fdba74',
    backgroundColor: 'rgba(249,115,22,0.12)',
    border: '1px solid rgba(249,115,22,0.30)',
    borderRadius: 12,
    padding: '8px 10px',
  },
  summaryActions: {
    display: 'flex',
    gap: 10,
    width: '100%',
  },
  draftBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#e2e8f0',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 13.5,
    padding: '12px 10px',
    cursor: 'pointer',
    flex: '1 1 110px',
    textAlign: 'center',
  },
  checkoutBtn: {
    background: 'linear-gradient(135deg, #059669, #047857)',
    color: 'white',
    border: '1px solid rgba(16,185,129,0.45)',
    borderRadius: 12,
    fontWeight: 800,
    fontSize: 13.5,
    padding: '12px 10px',
    cursor: 'pointer',
    flex: '2 1 170px',
    textAlign: 'center',
    boxShadow: '0 10px 22px -12px rgba(5,150,105,0.9)',
  },
  // Blocked, not broken: drop the green entirely rather than fading it, so the
  // button never looks like a failed render of the live one.
  checkoutBtnDisabled: {
    background: 'rgba(255,255,255,0.06)',
    color: '#64748b',
    border: '1px solid rgba(255,255,255,0.10)',
    boxShadow: 'none',
    cursor: 'not-allowed',
  },
  checkoutHint: {
    margin: 0,
    fontSize: 11.5,
    fontWeight: 600,
    color: '#94a3b8',
    textAlign: 'center',
  },
  globalError: {
    width: '100%',
    margin: 0,
    padding: '10px 12px',
    backgroundColor: 'rgba(248,113,113,0.12)',
    border: '1px solid rgba(248,113,113,0.30)',
    borderRadius: 12,
    color: '#fca5a5',
    fontSize: 12.5,
    fontWeight: 600,
    boxSizing: 'border-box',
    wordWrap: 'break-word',
  },
  globalSuccess: {
    width: '100%',
    margin: 0,
    padding: '10px 12px',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16,185,129,0.30)',
    borderRadius: 12,
    color: '#6ee7b7',
    fontSize: 12.5,
    fontWeight: 600,
    boxSizing: 'border-box',
    wordWrap: 'break-word',
  },
};
