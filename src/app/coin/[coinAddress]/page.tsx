import React from 'react';
import CoinDetailPage from '@/app/components/CoinDetails';

type PageProps = {
  params: Promise<{
    coinAddress: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CoinPage({ params }: PageProps) {
  // Properly await the params object before accessing its properties
  const { coinAddress } = await params;
  
  // You can also add any data fetching here if needed
  // const coinData = await fetchCoinData(coinAddress);
  
  return <CoinDetailPage coinAddress={coinAddress} />;
}