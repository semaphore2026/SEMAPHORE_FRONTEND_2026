"use client";
import Footer from "@/components/Footer";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import MyRegistration from '@/components/profile/MyRegistration';
import SetTeamCard from '@/components/profile/SetTeamCard';
import WaterWave from '@/components/WaterWaveWrapper';


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://13.201.89.79';

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
    <main className="relative min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
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

      <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row gap-8">
        <ProfileSidebar user={user} />
        <div className="flex-1 flex flex-col">
          <SetTeamCard user={user} onUserUpdate={handleUserUpdate} />
          <MyRegistration user={user} />
        </div>
      </div>
      <div className="mt-12">
  <Footer />
</div>
    </main>
  );
}

