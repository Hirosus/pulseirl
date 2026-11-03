export interface AttendeeProfile {
  userId: string;
  name: string;
  interests: string[];
}

export interface VibeReport {
  overallCompatibilityScore: number;
  matchedTags: string[];
  suggestedIcebreaker: string;
  attendeeSummary: string;
}

export class VibeMatchmakerService {
  /**
   * Computes cosine similarity between two interest sets.
   */
  public computeCompatibility(userInterests: string[], targetInterests: string[]): number {
    if (userInterests.length === 0 || targetInterests.length === 0) return 0.5;

    const setA = new Set(userInterests.map(i => i.toLowerCase().trim()));
    const setB = new Set(targetInterests.map(i => i.toLowerCase().trim()));

    let intersectionCount = 0;
    for (const item of setA) {
      if (setB.has(item)) intersectionCount++;
    }

    const similarity = intersectionCount / Math.sqrt(setA.size * setB.size);
    return Math.round(similarity * 100) / 100;
  }

  /**
   * Evaluates attendee group compatibility and generates dynamic icebreaker prompts.
   */
  public generateVibeReport(
    currentUser: AttendeeProfile,
    confirmedAttendees: AttendeeProfile[]
  ): VibeReport {
    if (confirmedAttendees.length === 0) {
      return {
        overallCompatibilityScore: 85,
        matchedTags: currentUser.interests.slice(0, 3),
        suggestedIcebreaker: 'You are among the first confirmed guests! Kick off the conversation with the host.',
        attendeeSummary: 'Early drop explorer.'
      };
    }

    const matchedSet = new Set<string>();
    let totalScore = 0;

    for (const attendee of confirmedAttendees) {
      const score = this.computeCompatibility(currentUser.interests, attendee.interests);
      totalScore += score;

      for (const interest of currentUser.interests) {
        if (attendee.interests.map(i => i.toLowerCase()).includes(interest.toLowerCase())) {
          matchedSet.add(interest);
        }
      }
    }

    const avgScore = totalScore / confirmedAttendees.length;
    // Map to percentage [65..98]
    const percent = Math.min(98, Math.max(65, Math.round(avgScore * 100 + 40)));
    const matchedTags = Array.from(matchedSet);

    const icebreaker = this.generateIcebreaker(matchedTags);

    return {
      overallCompatibilityScore: percent,
      matchedTags: matchedTags.length > 0 ? matchedTags : ['Creative & Tech Community'],
      suggestedIcebreaker: icebreaker,
      attendeeSummary: `${confirmedAttendees.length} confirmed guests share common ground with you.`
    };
  }

  private generateIcebreaker(matchedTags: string[]): string {
    if (matchedTags.some(t => t.toLowerCase().includes('vinyl') || t.toLowerCase().includes('highlife') || t.toLowerCase().includes('afrobeat'))) {
      return 'Ask about their favorite highlife record or local Lagos live set.';
    }
    if (matchedTags.some(t => t.toLowerCase().includes('design') || t.toLowerCase().includes('architecture'))) {
      return 'Ask what they think of the new contemporary design galleries in Victoria Island.';
    }
    return 'Ask what brought them to tonight’s micro-meetup drop.';
  }
}
