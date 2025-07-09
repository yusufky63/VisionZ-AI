import { NextRequest, NextResponse } from "next/server";
import { getCoinDetails } from "../../services/sdk/getCoins";
import { getZoraProfile, getProfileBalance } from "../../services/sdk/getProfiles";

import { getETHPrice } from "../../services/ethPrice";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (!action) {
      return NextResponse.json(
        { error: "Action parametresi gerekli" },
        { status: 400 }
      );
    }

    // ETH fiyatını getir
    if (action === "ethPrice") {
      const price = await getETHPrice();
      return NextResponse.json({ price });
    }

    // Coin detaylarını getir
    else if (action === "coinDetails") {
      const address = searchParams.get("address");
      if (!address) {
        return NextResponse.json(
          { error: "Address parametresi gerekli" },
          { status: 400 }
        );
      }

      const coinData = await getCoinDetails(address);
      return NextResponse.json(coinData);
    }

    // Profil bilgilerini getir
    else if (action === "profile") {
      const address = searchParams.get("address");
      if (!address) {
        return NextResponse.json(
          { error: "Address parametresi gerekli" },
          { status: 400 }
        );
      }

      const profileData = await getZoraProfile(address);
      return NextResponse.json(profileData);
    }

    // Profil bakiyesini getir
    else if (action === "balance") {
      const address = searchParams.get("address");
      if (!address) {
        return NextResponse.json(
          { error: "Address parametresi gerekli" },
          { status: 400 }
        );
      }

      const balanceData = await getProfileBalance(address);
      return NextResponse.json(balanceData);
    } else {
      return NextResponse.json(
        { error: "Geçersiz action değeri" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Zora API hatası:", error);
    return NextResponse.json(
      { error: "İşlem sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}
