import { createPublicClient, http, type PublicClient } from "viem";
import { robinhoodChain } from "../chain";

/**
 * Shared read-only client for Robinhood Chain. Dime uses a single Pons launch
 * model, so the wider v1 indexer is intentionally absent — every on-chain
 * read goes through the Pons reader (readerV2.ts), which uses this client.
 */
let cached: PublicClient | null = null;

export function ponsClient(): PublicClient {
  if (!cached) {
    cached = createPublicClient({ chain: robinhoodChain, transport: http() });
  }
  return cached;
}
