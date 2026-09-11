export interface AiCreditBalance {
  available: number; subscription: number; purchased: number; nextExpiry: string | null;
  textCost: number; imageCost: number; imagesEnabled: boolean; purchasesEnabled: boolean;
}
export interface AiCreditEntry { id: string; kind: string; amount: number; createdAt: string }
export interface GrantAiCreditsRequest { reference: string; amount: number; expiresAt: string | null }
