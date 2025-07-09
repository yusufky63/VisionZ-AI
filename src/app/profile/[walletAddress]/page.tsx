import React from 'react';
import ProfilePage from '@/app/components/Profile';

type PageProps = {
  params: Promise<{
    walletAddress: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProfileWithAddress({ params }: PageProps) {
  // Properly await the params object before accessing its properties
  const { walletAddress } = await params;
  
  return <ProfilePage walletAddress={walletAddress} />;
} 