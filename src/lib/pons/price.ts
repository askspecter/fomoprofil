import { parseAbi, zeroAddress, type Address } from "viem";
import { getCurveState, getLaunchedTokenV2 } from "./readerV2";
import { ponsClient } from "./reader";

/**
 * Per-token price/market-cap read, shared by the feed prices endpoint and the
 * stats endpoint. Kept in one place so both cache the same shape.
 */
const erc20Supply = parseAbi(["function totalSupply() view returns (uint256)"]);

export const PRICE_TTL = 300; // seconds — kept warm by feed views, read by /api/stats
export const priceCacheKey = (t: string) => `price:v2:${t.toLowerCase()}`;

export interface Cached {
  priceEth: number;
  marketCapEth: number;
  raisedEth: number;
  isNative: boolean;
}

export async function readPrice(token: Address): Promise<Cached | null> {
  const record = await getLaunchedTokenV2(token).catch(() => null);
  if (!record || !record.exists || record.phase !== 0 || !record.curve || record.curve === zeroAddress) {
    return null;
  }
  const [curve, supplyRaw] = await Promise.all([
    getCurveState(record.curve).catch(() => null),
    ponsClient()
      .readContract({ address: token, abi: erc20Supply, functionName: "totalSupply" })
      .catch(() => null),
  ]);
  if (!curve || supplyRaw == null) return null;
  const supply = Number(supplyRaw as bigint) / 1e18; // factory tokens are 18-decimals
  const priceEth = curve.spotPrice;
  return {
    priceEth,
    marketCapEth: priceEth * supply,
    raisedEth: Number(curve.realQuoteReserve) / 1e18,
    isNative: !record.pairToken || record.pairToken === zeroAddress,
  };
}
