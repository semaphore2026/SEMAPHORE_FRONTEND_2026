"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WaterWave from '@/components/WaterWaveWrapper';
import Footer from "@/components/Footer";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://13.201.89.79';

export default function EventsPage() {
  const router = useRouter();

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [registeredEventIds, setRegisteredEventIds] = useState([]);
  const [registeredEventMap, setRegisteredEventMap] = useState({});
  const [globalPaymentStatus, setGlobalPaymentStatus] = useState(null);
  const [globalPendingAmount, setGlobalPendingAmount] = useState(0);

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
        } else {
          setEvents([]);
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
        console.error("Failed to load events", err);
      } finally {
        setLoadingEvents(false);
      }
    }
    fetchEventsAndUserData();
  }, [router]);

  if (!isAuthorized) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <p style={{ color: '#8fb3c7', textAlign: 'center', marginTop: 40 }}>Redirecting to login...</p>
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
        const initialParticipants = Array.from({ length: minLen }).map((_, idx) => ({
          name: idx === 0 ? (userProfile?.name || '') : '',
          phone: idx === 0 ? (userProfile?.phone || '') : ''
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
    const updated = [...currentList];
    updated[index][field] = value;
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
      if (!p.name || !p.name.trim() || !p.phone || !p.phone.trim()) {
        return false;
      }
    }
    return true;
  };

  // Calculate Total Amount based on correctly filled events
  const calculateTotal = () => {
    let total = 0;
    for (const event of events) {
      if (!registeredEventIds.includes(event._id) && isFormValid(event._id)) {
        total += (event.registrationFee || 0);
      }
    }
    return total;
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
        ? firstForm.participants.map(p => ({ name: p.name.trim(), phone: p.phone.trim() }))
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
            phone: p.phone.trim(),
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
      const newlyRegisteredFee = validForms.reduce((sum, f) => sum + (f.event.registrationFee || 0), 0);

      setRegisteredEventIds(prev => Array.from(new Set([...prev, ...newlyRegisteredIds])));

      // Update registered map for newly registered items
      setRegisteredEventMap(prev => {
        const nextMap = { ...prev };
        newlyRegisteredIds.forEach(id => {
          nextMap[id] = { status: 'unpaid' };
        });
        return nextMap;
      });

      setGlobalSuccess(data.message || `Successfully registered for ${validForms.length} event(s)! Redirecting to payment...`);
      localStorage.removeItem('event_cart_draft'); // Clear global draft

      setTimeout(() => {
        sessionStorage.setItem('pendingPaymentAmount', newlyRegisteredFee);
        sessionStorage.setItem('pendingEventIds', JSON.stringify(newlyRegisteredIds));
        router.push('/user/account/payment');
      }, 1500);

    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = calculateTotal();
  const validFormsCount = getValidForms().length;

  return (
    <div style={styles.page} className="p-4 sm:p-6 md:p-10">
      {/* Water Wave Background Layer */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-auto">
        <WaterWave
          imageUrl="/water.jpg"
          dropRadius={25}
          perturbance={0.03}
          resolution={512}
          className="absolute inset-0 w-full h-full  bg-cover bg-center"
          style={{ backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          {() => <div className="w-full h-full" />}
        </WaterWave>
      </div>

      {/* Existing radial gradient as a semi-transparent overlay to preserve the theme's colors slightly */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
      />

      <div style={{ ...styles.container, position: 'relative', zIndex: 10 }}>
        <div style={styles.header}>
          <h1 style={styles.pageTitle}>Events</h1>
          <p style={styles.pageSubtitle}>Discover and register for the latest events.</p>
        </div>

        {/* Team Banner / Team Setup Card */}
        <div className="mb-8 p-6 bg-white/90 backdrop-blur-xl border border-white/70 rounded-3xl shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-100/90 border border-cyan-300 flex items-center justify-center text-cyan-800 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-cyan-950">
                  {hasTeam ? `Active Team: ${teamName || "Set"}` : "Team Registration Required"}
                </h3>
                <p className="text-xs text-cyan-800/90 font-medium">
                  {hasTeam
                    ? "Your team is set. All event registrations will be grouped under this team."
                    : "You must create or enter a Team Name before registering for events."}
                </p>
              </div>
            </div>
            {hasTeam && (
              <span className="px-3.5 py-1 bg-teal-100/90 text-teal-800 border border-teal-300 font-bold text-xs rounded-full shrink-0">
                ✓ Team Ready
              </span>
            )}
          </div>

          {!hasTeam && (
            <form onSubmit={handleSetTeam} className="border-black-900 flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-cyan-200/60">
              <input
                type="text"
                value={newTeamInput}
                onChange={(e) => setNewTeamInput(e.target.value)}
                placeholder="Enter Team Name (e.g. CyberKnights)"
                className="flex-1 px-4 py-2.5 bg-white/70 hover:bg-white focus:bg-white border border-blue-200 rounded-xl text-sm font-medium text-cyan-950 focus:outline-none placeholder-cyan-800/40"
                required
              />
              <button
                type="submit"
                disabled={settingTeam || !newTeamInput.trim()}
                className="px-6 py-2.5 bg-blue-900 hover:bg-purple-800  text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all border border-teal-500/40 "
              >
                {settingTeam ? "Setting Team..." : "Set Team & Continue"}
              </button>
            </form>
          )}

          {teamError && <div className="mt-3 p-2.5 text-xs text-red-700 bg-red-100/70 border border-red-300 rounded-xl font-medium">⚠ {teamError}</div>}
          {teamSuccess && <div className="mt-3 p-2.5 text-xs text-teal-800 bg-teal-100/70 border border-teal-300 rounded-xl font-medium">✓ {teamSuccess}</div>}
        </div>

        {loadingEvents ? (
          <p style={{ color: '#ffffffff', textAlign: 'center', marginTop: 40 }}>Loading events...</p>
        ) : (
          <div style={styles.grid}>
            {events.map((event) => {
              const isExpanded = expandedEventId === event._id;
              const participants = formsData[event._id] || [];
              const isValid = isFormValid(event._id);
              const isRegistered = registeredEventIds.includes(event._id);
              const eventRegInfo = registeredEventMap[event._id];
              const pStatus = eventRegInfo?.status || 'unpaid';

              return (
                <div key={event._id} style={{ ...styles.card, borderColor: isRegistered ? '#10b981' : isValid ? '#0ea5e9' : '#1e293b' }}>
                  <div style={styles.cardHeader}>
                    <h2 style={styles.cardTitle}>{event.title}</h2>
                    <span style={styles.feeBadge}>
                      {event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free'}
                    </span>
                  </div>

                  <p style={styles.description}>{event.description}</p>

                  <div style={styles.detailsRow}>
                    <span style={styles.detailTag}>
                      {event.minParticipants === event.maxParticipants
                        ? `Team Size: ${event.minParticipants}`
                        : `Team Size: ${event.minParticipants} - ${event.maxParticipants}`}
                    </span>
                    {isValid && !isRegistered && <span style={{ ...styles.detailTag, backgroundColor: 'rgba(175, 247, 223, 0.89)', color: '#067651ff' }}>✓ Ready to Checkout</span>}
                  </div>

                  {isRegistered ? (
                    pStatus === 'approved' ? (
                      <button
                        disabled
                        style={{ ...styles.actionBtn, backgroundColor: '#024c33ff', opacity: 0.9, cursor: 'not-allowed' }}
                      >
                        ✓ Registered & Verified
                      </button>
                    ) : pStatus === 'pending' ? (
                      <button
                        disabled
                        style={{ ...styles.actionBtn, backgroundColor: '#b45309', opacity: 0.9, cursor: 'not-allowed' }}
                      >
                        ⏳ Payment Verification Pending
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const amountToPay = event.registrationFee || 0;
                          sessionStorage.setItem('pendingPaymentAmount', amountToPay);
                          sessionStorage.setItem('pendingEventIds', JSON.stringify([event._id]));
                          router.push('/user/account/payment');
                        }}
                        style={{ ...styles.actionBtn, backgroundColor: '#d97706', opacity: 1, cursor: 'pointer' }}
                      >
                        Complete Payment (₹{event.registrationFee || 0})
                      </button>
                    )
                  ) : !isExpanded ? (
                    <button
                      onClick={() => toggleEventForm(event)}
                      style={{ ...styles.actionBtn, backgroundColor: participants.length > 0 ? '#1e293b' : '#0c4db5ff' }}
                    >
                      {participants.length > 0 ? 'Edit Registration' : 'Register Now'}
                    </button>
                  ) : (
                    <div style={styles.formContainer}>
                      <div style={styles.formDivider} />
                      <h3 style={styles.formTitle}>Registration Details</h3>

                      <div style={styles.form}>
                        {participants.map((p, index) => (
                          <div key={index} style={styles.participantBlock}>
                            <div style={styles.participantHeader}>
                              <span style={styles.participantLabel}>
                                Participant {index + 1} {index === 0 && "(Lead)"}
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

                            <div style={styles.row}>
                              <input
                                style={styles.inputHalf}
                                placeholder="Full Name"
                                value={p.name}
                                onChange={(e) => handleChange(index, 'name', e.target.value, event._id)}
                              />
                              <input
                                style={styles.inputHalf}
                                type="tel"
                                placeholder="Phone Number"
                                value={p.phone}
                                onChange={(e) => handleChange(index, 'phone', e.target.value, event._id)}
                              />
                            </div>
                          </div>
                        ))}

                        {participants.length < event.maxParticipants && (
                          <button
                            type="button"
                            onClick={() => handleAddParticipant(event)}
                            style={styles.addBtn}
                          >
                            + Add Team Member
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setExpandedEventId(null)}
                          style={styles.collapseBtn}
                        >
                          Minimize Event Form
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Global Footer Checkout Bar */}
        {!loadingEvents && (
          <div style={styles.footerBar}>
            <div style={styles.footerContainer}>
              <div style={styles.footerInfo}>
                <h3 style={styles.footerTotal}>Total Amount: <span>₹{totalAmount}</span></h3>
                <p style={styles.footerSub}>({validFormsCount} event(s) ready for checkout)</p>
              </div>

              <div style={styles.footerActions}>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  style={styles.draftBtn}
                  className="text-sm sm:text-[15px] px-3 sm:px-6 py-2.5 sm:py-3"
                >
                  Save Draft
                </button>
                <button
                  onClick={handleCheckout}
                  style={{
                    ...styles.checkoutBtn,
                    opacity: submitting || validFormsCount === 0 ? 0.6 : 1,
                    pointerEvents: submitting || validFormsCount === 0 ? 'none' : 'auto',
                  }}
                  className="text-sm sm:text-[15px] px-3 sm:px-6 py-2.5 sm:py-3"
                >
                  {submitting ? 'Processing...' : 'Save & Make Payment'}
                </button>
              </div>
            </div>

            {globalError && <div style={styles.globalError}>⚠ {globalError}</div>}
            {globalSuccess && <div style={styles.globalSuccess}>✓ {globalSuccess}</div>}
          </div>
        )}

      </div>
      <div className="mt-12">
  <Footer />
</div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    width: '100%',
    color: '#0f172a',
    boxSizing: 'border-box',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  container: {
    maxWidth: 1000,
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: 48,
    marginTop: 40,
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: 800,
    margin: '0 0 12px',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#334155',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 400px), 1fr))',
    gap: 24,
    alignItems: 'start',
  },
  card: {
    backgroundColor: 'rgba(229, 252, 251, 0.88)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    borderRadius: "10px 30px ",
    padding: '18px', // Reduced padding for mobile
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.2s',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    backdropFilter: 'blur(16px)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
    color: '#0f172a',
  },
  feeBadge: {
    backgroundColor: 'rgba(14, 218, 233, 0.5)',
    color: '#014062ff',
    padding: '4px 10px',
    borderRadius: "10px",
    fontSize: 13,
    fontWeight: 600,
    border: '1px solid rgba(3, 54, 78, 0.3)',
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 1.5,
    margin: '0 0 10px',
  },
  detailsRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 15,
  },
  detailTag: {
    fontSize: 12,
    color: '#0f172a',
    backgroundColor: 'rgba(220, 232, 111, 0.96)',
    padding: '4px 8px',
    borderRadius: 6,
    fontWeight: 600,
  },
  actionBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#0ea5e9',
    color: 'white',
    border: 'none',
    borderRadius: "8px 10px 10px 15px",
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: 'auto',
  },

  // Inline Form Styles
  formContainer: {
    marginTop: 'auto',
  },
  formDivider: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.3)',
    margin: '0 0 20px 0',
  },
  formTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#0f172a',
    margin: '0 0 16px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  participantBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 16,
    borderRadius: 10,
    border: '1px solid rgba(148, 163, 184, 0.4)',
  },
  participantHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    fontSize: 12,
    cursor: 'pointer',
    padding: 0,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid rgba(148, 163, 184, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#0f172a',
    fontSize: 14,
    boxSizing: 'border-box',
    outline: 'none',
  },
  row: {
    display: 'flex',
    gap: 10,
  },
  inputHalf: {
    width: '100%',
    flex: 1,
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid rgba(148, 163, 184, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#0f172a',
    fontSize: 14,
    boxSizing: 'border-box',
    outline: 'none',
  },
  addBtn: {
    background: 'none',
    color: '#0284c7',
    border: '1px dashed #94a3b8',
    borderRadius: 8,
    padding: '10px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  collapseBtn: {
    padding: '10px',
    backgroundColor: 'transparent',
    color: '#475569',
    border: '1px solid #94a3b8',
    borderRadius: "8px 10px 10px 20px",
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8,
  },

  // Footer Styles
  footerBar: {
    marginTop: 40,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    width: '100%',
  },
  footerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.9)',
    padding: '16px 20px', // Reduced from 24px 32px
    borderRadius: 16,
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    backdropFilter: 'blur(16px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 16,
    width: 450,
    maxWidth: '100%',
    boxSizing: 'border-box',
  },
  footerInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    textAlign: 'right',
  },
  footerTotal: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: '#070124ff',
  },
  footerSub: {
    margin: '4px 0 0',
    fontSize: 13,
    color: '#475569',
  },
  footerActions: {
    display: 'flex',
    gap: 12,
    width: '100%',
  },
  draftBtn: {
    backgroundColor: 'rgba(27, 110, 149, 0.36)',
    color: '#042332ff',
    border: '1px solid rgba(1, 36, 52, 0.41)',
    borderRadius: 10,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    flex: '1 1 100px',
    textAlign: 'center',
  },
  checkoutBtn: {
    backgroundColor: '#006443ff',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    flex: '2 1 160px',
    textAlign: 'center',
  },
  globalError: {
    width: '100%',
    margin: '8px 0 0',
    padding: '10px 14px',
    backgroundColor: 'rgba(248,113,113,0.1)',
    border: '1px solid rgba(248,113,113,0.2)',
    borderRadius: 8,
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    boxSizing: 'border-box',
    wordWrap: 'break-word',
  },
  globalSuccess: {
    width: '100%',
    margin: '8px 0 0',
    padding: '10px 14px',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: 8,
    color: '#10b981',
    fontSize: 14,
    textAlign: 'center',
    boxSizing: 'border-box',
    wordWrap: 'break-word',
  }
};
