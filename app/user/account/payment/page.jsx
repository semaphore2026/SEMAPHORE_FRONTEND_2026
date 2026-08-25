"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import PaymentSubmission from '@/components/payment/PaymentSubmission';
import WaterWave from '@/components/WaterWaveWrapper';
import Footer from '@/components/Footer';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://13.201.89.79';

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
    <main className="relative min-h-screen bg-black overflow-hidden flex flex-col pt-12 px-4 sm:px-6 lg:px-8">
      {/* Decorative noise/texture overlay for the background */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none z-0"></div>

      {/* Water Wave Effect (Darkened via overlay) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-auto">
        <WaterWave
          imageUrl="/water.jpg"
          dropRadius={25}
          perturbance={0.03}
          resolution={512}
          className="absolute inset-0 w-full h-full opacity-90 bg-cover bg-center"
          style={{ backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          {() => <div className="w-full h-full bg-black/80 pointer-events-none" />}
        </WaterWave>
      </div>
      
      <div className="flex-grow flex items-center justify-center w-full z-10 relative">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row items-stretch justify-center gap-8 lg:gap-12 py-8">
          {/* Left side: QR Code */}
        <div className="flex-1 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-sm">
          <h2 className="text-2xl font-extrabold text-white mb-6 tracking-wide uppercase text-center">Scan to Pay</h2>
          
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-cyan-500/30 mb-6 relative group cursor-pointer transition-all hover:scale-105">
            <Image 
              src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=semaphore@upi&pn=Semaphore&cu=INR" 
              alt="Payment QR Code" 
              width={224}
              height={224}
              unoptimized
              className="w-56 h-56 object-contain"
            />
          </div>
          
          <div className="w-full bg-cyan-500/10 p-4 rounded-xl border border-cyan-500/30 text-center">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">UPI ID</p>
              <p className="text-lg font-bold text-cyan-400 tracking-wider font-mono">semaphore@upi</p>
          </div>
          <p className="text-sm text-gray-400 font-medium text-center mt-6">
            Scan the QR code using any UPI app to pay for your registered events. After successful payment, enter the exact amount and the UTR transaction number in the form.
          </p>
        </div>

        {/* Right side: Payment Form */}
        <div className="flex-1">
          <PaymentSubmission />
        </div>
      </div>
      </div>
      <div className="w-full relative z-10 mt-auto">
        <Footer />
      </div>
    </main>
  );
}
