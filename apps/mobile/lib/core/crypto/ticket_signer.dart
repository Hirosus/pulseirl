import 'dart:convert';
import 'package:crypto/crypto.dart';

class TicketSigner {
  final String secretKey;

  TicketSigner(this.secretKey);

  /// Computes an HMAC-SHA256 cryptographic signature for an issued ticket
  String signPass(String eventId, String userId, int slotNumber, int timestamp) {
    final payload = '$eventId:$userId:$slotNumber:$timestamp';
    final key = utf8.encode(secretKey);
    final bytes = utf8.encode(payload);
    final hmacSha256 = Hmac(sha256, key);
    final digest = hmacSha256.convert(bytes);
    return digest.toString();
  }

  /// Verifies an offline ticket pass presented at the venue door without network
  bool verifyPass(String eventId, String userId, int slotNumber, int timestamp, String signature) {
    final expectedSignature = signPass(eventId, userId, slotNumber, timestamp);
    return expectedSignature == signature;
  }
}
