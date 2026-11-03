import { describe, it, expect } from 'vitest';
import { VibeMatchmakerService } from '../src/modules/ai/vibe-matchmaker.service';

describe('AI Vibe Matchmaker & Attendee Compatibility', () => {
  const matchmaker = new VibeMatchmakerService();

  it('computes positive cosine similarity on shared cultural interests', () => {
    const userInterests = ['Afrobeats / Highlife', 'Product Design', 'Architecture'];
    const attendeeInterests = ['Afrobeats / Highlife', 'Product Design', 'Contemporary Art'];

    const score = matchmaker.computeCompatibility(userInterests, attendeeInterests);
    expect(score).toBeGreaterThan(0.6);
    expect(score).toBeLessThanOrEqual(1.0);
  });

  it('generates rich vibe report with context-aware icebreakers', () => {
    const currentUser = {
      userId: 'usr_solomon',
      name: 'Olaiya Solomon',
      interests: ['Rare Vinyl Pressings', 'Highlife', 'Architecture']
    };

    const confirmed = [
      {
        userId: 'usr_femi',
        name: 'Femi O.',
        interests: ['Rare Vinyl Pressings', 'Afrobeat', 'Coffee']
      },
      {
        userId: 'usr_zainab',
        name: 'Zainab B.',
        interests: ['Architecture', 'Tech Startups']
      }
    ];

    const report = matchmaker.generateVibeReport(currentUser, confirmed);

    expect(report.overallCompatibilityScore).toBeGreaterThanOrEqual(65);
    expect(report.matchedTags.length).toBeGreaterThan(0);
    expect(report.suggestedIcebreaker).toContain('highlife record');
  });
});
