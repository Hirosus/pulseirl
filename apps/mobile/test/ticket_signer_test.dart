import 'package:flutter_test/flutter_test.dart';
import 'package:pulseirl_mobile/core/crypto/ticket_signer.dart';
import 'package:pulseirl_mobile/features/vibe/attendee_chemistry_widget.dart';

void main() {
  group('TicketSigner Cryptographic Integrity', () {
    const testSecret = 'lagos_hmac_secret_salt_2026';
    final signer = TicketSigner(testSecret);

    test('generates deterministic HMAC-SHA256 signature for ticket metadata', () {
      final sig1 = signer.signPass('ev_rooftop', 'usr_solomon', 8, 1730000000);
      final sig2 = signer.signPass('ev_rooftop', 'usr_solomon', 8, 1730000000);

      expect(sig1, equals(sig2));
      expect(sig1.length, equals(64)); // SHA-256 produces 64 hex characters
    });

    test('verifies genuine offline ticket pass successfully', () {
      final sig = signer.signPass('ev_rooftop', 'usr_solomon', 8, 1730000000);
      final isValid = signer.verifyPass('ev_rooftop', 'usr_solomon', 8, 1730000000, sig);

      expect(isValid, isTrue);
    });

    test('detects and rejects tampered ticket passes at the door', () {
      final genuineSig = signer.signPass('ev_rooftop', 'usr_solomon', 8, 1730000000);

      // Malicious user attempts to swap userId or slotNumber
      final isTamperedUser = signer.verifyPass('ev_rooftop', 'usr_impostor', 8, 1730000000, genuineSig);
      final isTamperedSlot = signer.verifyPass('ev_rooftop', 'usr_solomon', 9, 1730000000, genuineSig);

      expect(isTamperedUser, isFalse);
      expect(isTamperedSlot, isFalse);
    });
  });

  group('ChemistryEngine Attendee Matching', () {
    test('computes high compatibility score for overlapping interests', () {
      final user = ['Afrobeats / Highlife', 'Product Design', 'Architecture'];
      final group = ['Afrobeats / Highlife', 'Product Design'];

      final match = ChemistryEngine.evaluateMatch(user, group);

      expect(match.compatibilityPercent, greaterThanOrEqualTo(60));
      expect(match.sharedInterests.contains('Afrobeats / Highlife'), isTrue);
      expect(match.suggestedIcebreaker.isNotEmpty, isTrue);
    });
  });
}
