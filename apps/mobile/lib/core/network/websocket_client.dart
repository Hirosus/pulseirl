import 'dart:async';
import 'dart:convert';

typedef InventoryDeltaCallback = void Function(Map<String, dynamic> delta);

class PulseWebSocketClient {
  final String gatewayUrl;
  final Map<String, List<InventoryDeltaCallback>> _roomListeners = {};
  bool _isConnected = false;

  PulseWebSocketClient({required this.gatewayUrl});

  bool get isConnected => _isConnected;

  Future<void> connect() async {
    // Simulated connection to Node.js WebSocket gateway
    _isConnected = true;
  }

  void subscribeToEvent(String eventId, InventoryDeltaCallback onDelta) {
    final room = 'event:$eventId';
    _roomListeners.putIfAbsent(room, () => []).add(onDelta);
  }

  void handleIncomingMessage(String rawJson) {
    try {
      final decoded = jsonDecode(rawJson) as Map<String, dynamic>;
      final type = decoded['type'];
      final payload = decoded['payload'] as Map<String, dynamic>;

      if (type == 'INVENTORY_DELTA') {
        final eventId = payload['eventId'];
        final room = 'event:$eventId';
        final listeners = _roomListeners[room] ?? [];
        for (final listener in listeners) {
          listener(payload);
        }
      }
    } catch (e) {
      // Ignored malformed payloads
    }
  }

  void disconnect() {
    _isConnected = false;
    _roomListeners.clear();
  }
}
