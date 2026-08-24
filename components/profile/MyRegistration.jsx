"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://13.201.89.79';

export default function MyRegistration({ user: initialUser }) {
  const [fetchedUserData, setFetchedUserData] = useState(null);
  const [fetchedEvents, setFetchedEvents] = useState(null);
  const [loading, setLoading] = useState(!initialUser);
  const [error, setError] = useState(null);

  // Modal state for viewing payment screenshot & details
  const [activeProofModal, setActiveProofModal] = useState(null);

  const router = useRouter();

  const userData = fetchedUserData || initialUser || null;
  const events = useMemo(
    () => (fetchedEvents !== null ? fetchedEvents : (initialUser?.registeredEvents || initialUser?.registrations || [])),
    [fetchedEvents, initialUser]
  );

  // Fetch verifyuser to get full populated registration & payment details
  useEffect(() => {
    const fetchVerifiedUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No authorization token found");

        const response = await fetch(`${API_BASE_URL}/api/auth/verifyuser`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to verify user registrations");
        }

        const verifiedUserObj = data.user || data;
        setFetchedUserData(verifiedUserObj);

        const regEvents = verifiedUserObj.registeredEvents || data.registeredEvents || data.registrations || [];
        
        // Fetch populated registrations from /api/registrations to ensure payment object (imageUrl, utr, status, amount) is populated
        try {
          const regRes = await fetch(`${API_BASE_URL}/api/registrations`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (regRes.ok) {
            const regData = await regRes.json();
            const fullRegs = regData.registrations || regData.data || [];
            if (Array.isArray(fullRegs) && fullRegs.length > 0) {
              setFetchedEvents(fullRegs);
            } else {
              setFetchedEvents(regEvents);
            }
          } else {
            setFetchedEvents(regEvents);
          }
        } catch (regErr) {
          console.error("Failed to fetch populated registrations", regErr);
          setFetchedEvents(regEvents);
        }
      } catch (err) {
        console.error("verifyuser fetch error:", err);
        // Fallback to /api/registrations if verifyuser fails or doesn't have events
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const fallbackRes = await fetch(`${API_BASE_URL}/api/registrations`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const fallbackData = await fallbackRes.json();
            if (fallbackRes.ok) {
              const regs = fallbackData.registrations || (fallbackData.registration?.events) || fallbackData.data || [];
              setFetchedEvents(regs);
            }
          }
        } catch (fallbackErr) {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVerifiedUserData();
  }, []);

  // Helper to extract clean payment info from a registration item
  const getPaymentInfo = (item) => {
    if (!item) return null;

    let p = item.paymentId || item.payment || item.paymentDetails;
    if (Array.isArray(p)) {
      p = p[0];
    }
    
    // Check if image URL or payment details exist directly on item
    const directImageUrl = item.imageUrl || item.imageurl || item.image || item.proofUrl || item.url;
    const directUtr = item.utr || item.utrNumber;
    const directAmount = item.amount || item.paymentAmount;
    const directStatus = item.paymentStatus || item.status;

    if (!p) {
      if (directImageUrl || directUtr) {
        return {
          id: item._id || 'payment',
          amount: directAmount || null,
          utr: directUtr || null,
          imageUrl: directImageUrl || null,
          status: directStatus || 'pending',
          message: item.message || ''
        };
      }
      return null;
    }

    if (typeof p === 'string') {
      return {
        id: p,
        amount: directAmount || null,
        utr: directUtr || null,
        imageUrl: directImageUrl || null,
        status: directStatus || 'pending',
        message: item.message || ''
      };
    }

    return {
      id: p._id || p.id || 'payment',
      amount: p.amount || directAmount || null,
      utr: p.utr || directUtr || null,
      imageUrl: p.imageUrl || p.imageurl || p.image || p.url || p.proofUrl || directImageUrl || null,
      status: p.status || directStatus || 'pending',
      message: p.message || item.message || ''
    };
  };

  // Group registrations by paymentId so multiple events sharing one payment are grouped together
  const { paidGroups, unpaidEvents } = useMemo(() => {
    const paidGroupsMap = {};
    const unpaidList = [];

    events.forEach(item => {
      const pInfo = getPaymentInfo(item);
      if (pInfo && pInfo.id) {
        if (!paidGroupsMap[pInfo.id]) {
          paidGroupsMap[pInfo.id] = {
            payment: pInfo,
            events: []
          };
        }
        // Avoid duplicate event entries in same payment group
        const exists = paidGroupsMap[pInfo.id].events.some(
          e => (e._id || e.eventId?._id) === (item._id || item.eventId?._id)
        );
        if (!exists) {
          paidGroupsMap[pInfo.id].events.push(item);
        }
      } else {
        unpaidList.push(item);
      }
    });

    return {
      paidGroups: Object.values(paidGroupsMap),
      unpaidEvents: unpaidList
    };
  }, [events]);

  const totalUnpaidAmount = unpaidEvents.reduce((sum, item) => {
    return sum + (item.eventId?.registrationFee || 0);
  }, 0);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <p className="text-cyan-400 font-bold animate-pulse uppercase tracking-widest text-sm">Verifying User & Registrations...</p>
      </div>
    );
  }

  if (error && events.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-black/40 backdrop-blur-md p-6 rounded-3xl border border-red-500/50 text-center shadow-lg max-w-md w-full">
          <p className="text-red-400 font-bold mb-2">Error loading registrations</p>
          <p className="text-xs text-red-500/80">{error}</p>
        </div>
      </div>
    );
  }

  const teamNameStr = userData?.teamName || userData?.team?.name;
  const teamCodeStr = userData?.teamIdString || userData?.team?.teamid;

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-1">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-wide">
          Events Registered ({events.length})
        </h1>
        {teamNameStr && (
          <div className="inline-flex items-center gap-2 bg-white/5 border border-cyan-500/30 px-3.5 py-1.5 rounded-2xl text-xs font-bold text-cyan-400 shadow-sm">
            <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Team: {teamNameStr}</span>
            {teamCodeStr && (
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/30">
                {teamCodeStr}
              </span>
            )}
          </div>
        )}
      </div>

      {events.length === 0 ? (
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-center text-gray-400 font-medium">
          You haven&apos;t registered for any events yet.
        </div>
      ) : (
        <div className="flex flex-col gap-6">

          {/* Render Paid Event Groups (Events sharing the same paymentId grouped together) */}
          {paidGroups.map((group, idx) => {
            const { payment, events: groupEvents } = group;
            const isApproved = payment.status === 'approved' || payment.status === 'verified';
            const isPending = payment.status === 'pending' || payment.status === 'submitted';

            return (
              <div
                key={payment.id || idx}
                className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col gap-5 relative overflow-hidden"
              >
                {/* Group Header: Payment Summary & Proof CTA */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-white">
                        Payment Transaction ({groupEvents.length} Event{groupEvents.length > 1 ? 's' : ''})
                      </span>
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-green-500/10 text-green-400 px-2.5 py-0.5 rounded-full border border-green-500/30">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                          Verified & Approved
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-yellow-500/10 text-yellow-400 px-2.5 py-0.5 rounded-full border border-yellow-500/30">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          Verification Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded-full border border-red-500/30">
                          Payment Status: {payment.status}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs font-medium text-gray-400 flex-wrap mt-1">
                      {payment.utr && (
                        <span><strong className="text-white">UTR:</strong> <code className="bg-white/10 px-1.5 py-0.5 rounded text-cyan-400 font-mono font-bold">{payment.utr}</code></span>
                      )}
                      {payment.amount && (
                        <span><strong className="text-white">Amount:</strong> ₹{payment.amount}</span>
                      )}
                    </div>
                  </div>

                  {/* Payment Image Proof Thumbnail / View Button */}
                  {payment.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setActiveProofModal({ imageUrl: payment.imageUrl, utr: payment.utr, amount: payment.amount, status: payment.status, message: payment.message })}
                      className="flex items-center gap-2 px-3.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-2xl text-xs font-bold transition-all border border-cyan-500/30 shadow-sm shrink-0"
                    >
                      <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>View Full Screenshot ↗</span>
                    </button>
                  )}
                </div>

                {/* Embedded Uploaded Screenshot Display */}
                {payment.imageUrl && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
                    <div
                      className="relative group cursor-pointer shrink-0"
                      onClick={() => setActiveProofModal({ imageUrl: payment.imageUrl, utr: payment.utr, amount: payment.amount, status: payment.status, message: payment.message })}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={payment.imageUrl}
                        alt="Submitted Payment Proof"
                        className="w-28 h-28 object-cover rounded-xl border border-white/20 shadow-md transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                        Click to Enlarge
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-1 text-xs text-gray-300">
                      <span className="font-extrabold text-white text-sm">Uploaded Payment Screenshot</span>
                      <p className="text-gray-400 font-medium">
                        Submitted proof for payment verification. UTR: <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono font-bold text-white">{payment.utr || 'N/A'}</code>
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveProofModal({ imageUrl: payment.imageUrl, utr: payment.utr, amount: payment.amount, status: payment.status, message: payment.message })}
                        className="mt-1 self-start font-bold text-cyan-400 hover:text-white underline"
                      >
                        View full-screen proof details &rarr;
                      </button>
                    </div>
                  </div>
                )}

                {/* List of Events sharing this payment */}
                <div className="flex flex-col gap-3">
                  {groupEvents.map((item, eIdx) => {
                    const ev = item.eventId || {};
                    const dateStr = item.createdAt || item.addedAt 
                      ? new Date(item.createdAt || item.addedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                      : null;
                    const participants = item.participants || [];

                    return (
                      <div key={item._id || eIdx} className="bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 font-extrabold flex items-center justify-center text-lg shrink-0 border border-cyan-500/30">
                              {ev.title ? ev.title.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-base font-extrabold text-white truncate">{ev.title || 'Event Registration'}</h4>
                              <p className="text-xs text-gray-400 font-medium truncate">
                                {ev.registrationFee ? `Fee: ₹${ev.registrationFee}` : 'Registered Event'}
                                {dateStr ? ` • ${dateStr}` : ''}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/30 shrink-0 self-start sm:self-auto mt-1 sm:mt-0">
                            Linked to Payment
                          </span>
                        </div>

                        {/* Participants list */}
                        {Array.isArray(participants) && participants.length > 0 && (
                          <div className="pt-2 border-t border-white/10 flex flex-col gap-1.5">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                              Registered Participants ({participants.length}):
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {participants.map((p, pIdx) => (
                                <span key={pIdx} className="text-xs bg-white/5 border border-white/10 text-gray-300 px-2.5 py-1 rounded-lg font-medium break-all sm:break-normal flex-1 sm:flex-none">
                                  👤 {p.name || `Participant ${pIdx + 1}`} {p.phone ? `• 📞 ${p.phone}` : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Render Unpaid Events Section */}
          {unpaidEvents.map((eventItem, index) => {
            const ev = eventItem.eventId || {};
            const dateStr = eventItem.addedAt || eventItem.createdAt
              ? new Date(eventItem.addedAt || eventItem.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
              })
              : null;
            const participants = eventItem.participants || [];

            return (
              <div key={ev._id || index} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-extrabold text-2xl border border-cyan-500/30 shadow-inner shrink-0">
                    {ev.title ? ev.title.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1.5 gap-2">
                      <h3 className="text-lg font-extrabold text-white">{ev.title || 'Unknown Event'}</h3>
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-red-500/10 text-red-400 px-3 py-1 rounded-full border border-red-500/30 whitespace-nowrap self-start">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Payment Required
                      </span>
                    </div>
                    {dateStr && (
                      <p className="text-sm text-gray-400 flex items-center gap-2.5 mb-1.5 font-medium">
                        <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        Registered: {dateStr}
                      </p>
                    )}
                    <p className="text-sm text-gray-400 flex items-center gap-2.5 font-medium">
                      <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      {ev.location || 'TBA'} {ev.registrationFee ? `| Fee: ₹${ev.registrationFee}` : ''}
                    </p>
                  </div>
                </div>

                {/* Participants list for unpaid event */}
                {Array.isArray(participants) && participants.length > 0 && (
                  <div className="pt-3 border-t border-white/10 flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Registered Participants ({participants.length}):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {participants.map((p, pIdx) => (
                        <span key={pIdx} className="text-xs bg-white/5 border border-white/10 text-gray-300 px-2.5 py-1 rounded-lg font-medium break-all sm:break-normal flex-1 sm:flex-none">
                          👤 {p.name || `Participant ${pIdx + 1}`} {p.phone ? `• 📞 ${p.phone}` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

        </div>
      )}

      {/* Summary & Checkout Section */}
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mt-2 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
          <h3 className="text-lg font-extrabold text-white mt-1">Registration Dues Summary</h3>
          <div className="flex flex-col items-start sm:items-end w-full sm:w-auto">
            <span className="text-lg font-extrabold text-cyan-400 bg-cyan-500/10 px-4 py-1.5 rounded-xl border border-cyan-500/30 shadow-sm w-full sm:w-auto text-center sm:text-right">
              Total Due: ₹{totalUnpaidAmount}
            </span>
          </div>
        </div>
        
        {totalUnpaidAmount > 0 ? (
          <button
            className="w-full py-3.5 rounded-xl border mb-5 uppercase tracking-widest text-sm shadow-inner transition-all bg-cyan-500/20 text-cyan-400 cursor-pointer hover:bg-cyan-500/30 border-cyan-500/50 font-bold"
            onClick={() => {
              const unpaidIds = unpaidEvents.map(item => item.eventId?._id || item.eventId).filter(Boolean);
              sessionStorage.setItem('pendingPaymentAmount', totalUnpaidAmount);
              sessionStorage.setItem('pendingEventIds', JSON.stringify(unpaidIds));
              router.push('/user/account/payment');
            }}
          >
            <span className="flex items-center justify-center gap-2 font-bold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
              Pay Dues to Confirm Registrations (₹{totalUnpaidAmount})
            </span>
          </button>
        ) : (
          <button
            className="w-full py-3.5 rounded-xl border mb-5 uppercase tracking-widest text-sm shadow-inner transition-all bg-white/5 text-gray-500 border-white/10 cursor-not-allowed font-bold"
            disabled
          >
            <span className="flex items-center justify-center gap-2 font-bold">
              All Registrations Paid & Up to Date
            </span>
          </button>
        )}
      </div>

      {/* Payment Proof Modal Lightbox */}
      {activeProofModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-black/90 backdrop-blur-2xl border border-white/20 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-lg font-extrabold text-white uppercase tracking-wide">
                Payment Proof Screenshot
              </h3>
              <button
                onClick={() => setActiveProofModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>

            {/* Screenshot Display */}
            <div className="relative w-full max-h-80 overflow-hidden rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeProofModal.imageUrl}
                alt="Payment Proof Screenshot"
                className="max-h-72 w-auto object-contain rounded-xl shadow-md"
              />
            </div>

            {/* Proof Metadata */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2 text-xs text-gray-300 font-medium">
              {activeProofModal.utr && (
                <div className="flex justify-between items-center">
                  <span className="font-bold uppercase tracking-wider text-gray-400">UTR Number:</span>
                  <code className="bg-black/50 px-2 py-0.5 rounded border border-white/10 font-mono font-bold text-white">{activeProofModal.utr}</code>
                </div>
              )}
              {activeProofModal.amount && (
                <div className="flex justify-between items-center">
                  <span className="font-bold uppercase tracking-wider text-gray-400">Amount Paid:</span>
                  <span className="font-extrabold text-cyan-400 text-sm">₹{activeProofModal.amount}</span>
                </div>
              )}
              {activeProofModal.status && (
                <div className="flex justify-between items-center">
                  <span className="font-bold uppercase tracking-wider text-gray-400">Status:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[11px] uppercase ${
                    ['approved', 'verified'].includes(activeProofModal.status) 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
                      : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {activeProofModal.status}
                  </span>
                </div>
              )}
              {activeProofModal.message && (
                <div className="flex flex-col gap-0.5 pt-1 border-t border-white/10">
                  <span className="font-bold uppercase tracking-wider text-gray-400">Remarks:</span>
                  <p className="text-gray-300 font-normal">{activeProofModal.message}</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center gap-3 pt-2">
              <a
                href={activeProofModal.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-xl font-bold text-xs uppercase tracking-wider border border-cyan-500/30 transition-all"
              >
                Open Original Image ↗
              </a>
              <button
                onClick={() => setActiveProofModal(null)}
                className="py-2.5 px-6 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
