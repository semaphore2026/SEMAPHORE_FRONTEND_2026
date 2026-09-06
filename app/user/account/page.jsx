"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import MyRegistration from '@/components/profile/MyRegistration';
import SetTeamCard from '@/components/profile/SetTeamCard';
import WaterWave from '@/components/WaterWaveWrapper';
import Footer from '@/components/Footer';


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.semaphore2k26.in';

export default function MyRegistrationPage() {
  const [user, setUser] = useState(null);
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
        setUser(data.user || data);
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

  const handleUserUpdate = (updatedUserData) => {
    setUser(prev => ({
      ...prev,
      ...updatedUserData
    }));
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-cyan-400 font-bold tracking-widest uppercase animate-pulse">Loading Dashboard...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-black/40 backdrop-blur-xl p-8 rounded-3xl border border-white/10 text-center max-w-sm w-full shadow-lg">
          <p className="text-red-500 font-bold mb-3">{error}</p>
          <p className="text-cyan-400/80 font-medium text-sm">Redirecting to login...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-black pt-12 flex flex-col overflow-x-clip">
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

      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row gap-8 flex-grow pb-24">
        <ProfileSidebar user={user} />
        <div className="flex-1 flex flex-col">
          <SetTeamCard user={user} onUserUpdate={handleUserUpdate} />
          <MyRegistration user={user} />
        </div>
      </div>

      <div className="w-full z-20 relative mt-auto">
        <Footer />
      </div>
    </main>
  );
}

