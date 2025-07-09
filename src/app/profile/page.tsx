'use client';

import React from 'react';
import ProfilePage from '../components/Profile';
import { useAccount } from 'wagmi';

export default function Profile() {
  const { address } = useAccount();
  return <ProfilePage walletAddress={address} />;
}