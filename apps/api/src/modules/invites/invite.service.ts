import crypto from 'crypto';

export interface InviteRecord {
  code: string;
  creatorId: string;
  createdAt: number;
  usedCount: number;
  maxUses: number;
  active: boolean;
}

export class InviteService {
  private invites: Map<string, InviteRecord> = new Map();
  private userRecentIssuance: Map<string, number[]> = new Map(); // userId -> timestamps
  private referralGraph: Map<string, string> = new Map(); // inviteeId -> referrerId

  public async issueCode(userId: string, maxUses: number = 5): Promise<string> {
    // Fraud / Velocity check: max 5 invites per 60 seconds
    const now = Date.now();
    const timestamps = this.userRecentIssuance.get(userId) || [];
    const windowStart = now - 60000;
    const recent = timestamps.filter(t => t > windowStart);

    if (recent.length >= 5) {
      throw new Error('Rate limit exceeded: Max 5 invite codes per minute.');
    }

    recent.push(now);
    this.userRecentIssuance.set(userId, recent);

    const code = `PULSE-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const record: InviteRecord = {
      code,
      creatorId: userId,
      createdAt: now,
      usedCount: 0,
      maxUses,
      active: true
    };

    this.invites.set(code, record);
    return code;
  }

  public async redeemCode(code: string, newUserId: string): Promise<{ success: boolean; referrerId?: string; error?: string }> {
    const invite = this.invites.get(code);
    if (!invite) {
      return { success: false, error: 'INVALID_CODE' };
    }

    if (invite.usedCount >= invite.maxUses || !invite.active) {
      invite.active = false;
      return { success: false, error: 'INVITE_CODE_EXHAUSTED' };
    }

    if (invite.creatorId === newUserId) {
      return { success: false, error: 'CANNOT_REDEEM_OWN_INVITE' };
    }

    invite.usedCount++;
    if (invite.usedCount >= invite.maxUses) {
      invite.active = false;
    }

    this.referralGraph.set(newUserId, invite.creatorId);

    return {
      success: true,
      referrerId: invite.creatorId
    };
  }

  public getReferrer(userId: string): string | null {
    return this.referralGraph.get(userId) ?? null;
  }

  public getInviteRecord(code: string): InviteRecord | null {
    return this.invites.get(code) ?? null;
  }

  public clear(): void {
    this.invites.clear();
    this.userRecentIssuance.clear();
    this.referralGraph.clear();
  }
}
