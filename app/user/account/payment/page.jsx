"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import PaymentSubmission from '@/components/payment/PaymentSubmission';
import WaterWave from '@/components/WaterWaveWrapper';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.semaphore2k26.in';

export default function PaymentPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/user/register');
      return;
    }

    const verifyUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verifyuser`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (!response.ok) throw new Error(data.message || 'Session expired');
      } catch (err) {
        setError(err.message);
        localStorage.removeItem('token');
        setTimeout(() => router.push('/user/register'), 1500);
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-cyan-400 font-bold tracking-widest uppercase animate-pulse">Verifying Access...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-black/40 backdrop-blur-xl p-8 rounded-3xl border border-red-500/50 text-center max-w-sm w-full shadow-lg">
          <p className="text-red-400 font-bold mb-3">{error}</p>
          <p className="text-gray-400 font-medium text-sm">Redirecting to login...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-black overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Decorative noise/texture overlay for the background */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none z-0"></div>

      {/* Water Wave Effect (Darkened via overlay) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-auto">
        <WaterWave
          imageUrl="/assets/images/payment_bg.png"
          dropRadius={25}
          perturbance={0.03}
          resolution={512}
          className="absolute inset-0 w-full h-full opacity-90 bg-cover bg-center"
          style={{ backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          {() => <div className="w-full h-full bg-black/30 pointer-events-none" />}
        </WaterWave>
      </div>
      
      <div className="w-full max-w-6xl relative z-10 flex flex-col lg:flex-row items-stretch justify-center gap-8 lg:gap-12">
        {/* Left side: QR Code */}
        <div className="flex-1 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-sm">
          <h2 className="text-2xl font-extrabold text-white mb-6 tracking-wide uppercase text-center">Scan to Pay</h2>
          
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-cyan-500/30 mb-6 relative group cursor-pointer transition-all hover:scale-105">
            <Image 
              src="/QR_code.jpeg" 
              alt="Payment QR Code" 
              width={224}
              height={224}
              unoptimized
              className="w-56 h-56 object-contain"
            />
          </div>
          
          <div className="w-full bg-cyan-500/10 p-5 rounded-xl border border-cyan-500/30 space-y-4 text-sm text-left">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Name of the Account</span>
              <span className="font-bold text-cyan-300">Nitte Deemed to be University</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account No</span>
              <span className="font-bold text-cyan-300 font-mono tracking-widest text-lg">02452200058171</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bank & Branch</span>
              <span className="font-bold text-cyan-300 leading-relaxed">Canara Bank, ABSMIDS Branch, Deralakatte</span>
            </div>
            
            <div className="flex flex-row flex-wrap gap-4">
              <div className="flex-1 min-w-[120px] flex flex-col gap-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">IFSC Code</span>
                <span className="font-bold text-cyan-300 font-mono">CNRB0010245</span>
              </div>
              <div className="flex-1 min-w-[120px] flex flex-col gap-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">MICR Code</span>
                <span className="font-bold text-cyan-300 font-mono">575015123</span>
              </div>
            </div>
            
            <div className="flex flex-row flex-wrap gap-4">
              <div className="flex-1 min-w-[120px] flex flex-col gap-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">NDU GST No</span>
                <span className="font-bold text-cyan-300 font-mono text-[13px]">29AABTN0060A1Z5</span>
              </div>
              <div className="flex-1 min-w-[120px] flex flex-col gap-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">NDU PAN</span>
                <span className="font-bold text-cyan-300 font-mono text-[13px]">AABTN0060A</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-1 pt-1 border-t border-cyan-500/20">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-2">Email</span>
              <a href="mailto:cb10245@canarabank.com" className="font-bold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors">
                cb10245@canarabank.com
              </a>
            </div>
          </div>
          
          <p className="text-sm text-gray-400 font-medium text-center mt-6">
            Scan the QR code or use the account details to pay for your registered events. After successful payment, enter the exact UTR transaction number in the form.
          </p>
        </div>

        {/* Right side: Payment Form */}
        <div className="flex-1">
          <PaymentSubmission />
        </div>
      </div>
    </main>
  );
}
