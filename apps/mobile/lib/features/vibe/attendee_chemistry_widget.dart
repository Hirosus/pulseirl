class AttendeeChemistryModel {
  final int compatibilityPercent;
  final String summary;
  final List<String> sharedInterests;
  final String suggestedIcebreaker;

  const AttendeeChemistryModel({
    required this.compatibilityPercent,
    required this.summary,
    required this.sharedInterests,
    required this.suggestedIcebreaker,
  });
}

class ChemistryEngine {
  static AttendeeChemistryModel evaluateMatch(List<String> userInterests, List<String> groupInterests) {
    final matches = userInterests.where((i) => groupInterests.contains(i)).toList();
    final score = ((matches.length / (userInterests.isEmpty ? 1 : userInterests.length)) * 100).clamp(60, 98).toInt();

    return AttendeeChemistryModel(
      compatibilityPercent: score,
      summary: 'High compatibility based on shared taste in music and design.',
      sharedInterests: matches.isNotEmpty ? matches : ['Afrobeats / Highlife', 'Product Design'],
      suggestedIcebreaker: 'Ask about their favorite highlife pressing or local architecture gallery.',
    );
  }
}
