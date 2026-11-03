import 'package:flutter_test/flutter_test.dart';
import 'package:pulseirl_mobile/features/booking/booking_bloc.dart';

void main() {
  group('BookingBloc State Machine', () {
    test('transitions through locking -> hold acquired -> confirmed flow', () async {
      final bloc = BookingBloc();
      expect(bloc.state, isA<BookingInitialState>());

      bloc.add(InitiateSpotLockEvent(eventId: 'ev_vinyl', userId: 'usr_solomon'));
      expect(bloc.state, isA<BookingLockingState>());

      // Wait for simulated async Redis lock response
      await Future.delayed(const Duration(milliseconds: 200));
      expect(bloc.state, isA<BookingHoldAcquiredState>());

      final holdState = bloc.state as BookingHoldAcquiredState;
      expect(holdState.leaseKey, equals('reserve:ev_vinyl:usr_solomon'));
      expect(holdState.remainingSeats, equals(7));

      // Settle checkout
      bloc.add(ConfirmCheckoutEvent(leaseKey: holdState.leaseKey, idempotencyKey: 'idem_9912'));
      expect(bloc.state, isA<BookingConfirmedState>());

      final confirmed = bloc.state as BookingConfirmedState;
      expect(confirmed.slotNumber, equals(8));
      expect(confirmed.bookingId.isNotEmpty, isTrue);

      bloc.dispose();
    });
  });
}
