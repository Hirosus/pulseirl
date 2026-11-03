import { describe, it, expect, beforeEach } from 'vitest';
import { InviteService } from '../src/modules/invites/invite.service';

describe('Viral Invite Referral Graph & Fraud Throttling', () => {
  let service: InviteService;

  beforeEach(() => {
    service = new InviteService();
  });

  it('issues unique referral codes and tracks redemption lineage', async () => {
    const creatorId = 'usr_early_adopter_01';
    const code = await service.issueCode(creatorId, 2);

    expect(code).toMatch(/^PULSE-[0-9A-F]{6}$/);

    // Friend 1 redeems
    const res1 = await service.redeemCode(code, 'usr_friend_01');
    expect(res1.success).toBe(true);
    expect(res1.referrerId).toBe(creatorId);
    expect(service.getReferrer('usr_friend_01')).toBe(creatorId);

    // Friend 2 redeems
    const res2 = await service.redeemCode(code, 'usr_friend_02');
    expect(res2.success).toBe(true);

    // Code is now exhausted (max 2)
    const res3 = await service.redeemCode(code, 'usr_friend_03');
    expect(res3.success).toBe(false);
    expect(res3.error).toBe('INVITE_CODE_EXHAUSTED');
  });

  it('prevents self-referral abuse', async () => {
    const userId = 'usr_cheater';
    const code = await service.issueCode(userId, 5);

    const res = await service.redeemCode(code, userId);
    expect(res.success).toBe(false);
    expect(res.error).toBe('CANNOT_REDEEM_OWN_INVITE');
  });

  it('enforces velocity rate limits against spam invite code generation', async () => {
    const userId = 'usr_spammer';

    // 5 codes allowed in 1 minute
    for (let i = 0; i < 5; i++) {
      await service.issueCode(userId);
    }

    // 6th code must be blocked
    await expect(service.issueCode(userId)).rejects.toThrow('Rate limit exceeded');
  });
});
