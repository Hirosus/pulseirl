import 'dart:async';

abstract class BookingEvent {}

class InitiateSpotLockEvent extends BookingEvent {
  final String eventId;
  final String userId;
  InitiateSpotLockEvent({required this.eventId, required this.userId});
}

class ConfirmCheckoutEvent extends BookingEvent {
  final String leaseKey;
  final String idempotencyKey;
  ConfirmCheckoutEvent({required this.leaseKey, required this.idempotencyKey});
}

class TickerTickEvent extends BookingEvent {
  final int secondsRemaining;
  TickerTickEvent(this.secondsRemaining);
}

abstract class BookingState {}

class BookingInitialState extends BookingState {}

class BookingLockingState extends BookingState {}

class BookingHoldAcquiredState extends BookingState {
  final String leaseKey;
  final int remainingSeats;
  final int secondsLeft;
  BookingHoldAcquiredState({
    required this.leaseKey,
    required this.remainingSeats,
    required this.secondsLeft,
  });
}

class BookingConfirmedState extends BookingState {
  final String bookingId;
  final String qrSignature;
  final int slotNumber;
  BookingConfirmedState({
    required this.bookingId,
    required this.qrSignature,
    required this.slotNumber,
  });
}

class BookingFailedState extends BookingState {
  final String errorReason;
  BookingFailedState(this.errorReason);
}

class BookingBloc {
  BookingState _state = BookingInitialState();
  final StreamController<BookingState> _stateController = StreamController<BookingState>.broadcast();

  BookingState get state => _state;
  Stream<BookingState> get stream => _stateController.stream;

  void add(BookingEvent event) {
    if (event is InitiateSpotLockEvent) {
      _emit(BookingLockingState());
      // Simulate fast Redis Lua lock acquisition
      Future.delayed(const Duration(milliseconds: 150), () {
        _emit(BookingHoldAcquiredState(
          leaseKey: 'reserve:${event.eventId}:${event.userId}',
          remainingSeats: 7,
          secondsLeft: 300,
        ));
      });
    } else if (event is ConfirmCheckoutEvent) {
      _emit(BookingConfirmedState(
        bookingId: 'bk_lagos_99182',
        qrSignature: 'hmac_sha256_mock_sig_99',
        slotNumber: 8,
      ));
    }
  }

  void _emit(BookingState newState) {
    _state = newState;
    _stateController.add(newState);
  }

  void dispose() {
    _stateController.close();
  }
}
