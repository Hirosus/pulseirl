import 'package:flutter/material.dart';

class PhysicalTicketPass extends StatelessWidget {
  final String passNumber;
  final String eventTitle;
  final String venue;
  final String schedule;
  final int remainingSeats;
  final int totalCapacity;
  final String holdTimeLeft;
  final VoidCallback onLockSpot;
  final bool isHolding;

  const PhysicalTicketPass({
    super.key,
    required this.passNumber,
    required this.eventTitle,
    required this.venue,
    required this.schedule,
    required this.remainingSeats,
    required this.totalCapacity,
    required this.holdTimeLeft,
    required this.onLockSpot,
    this.isHolding = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFFFFDF5),
        border: Border.all(color: const Color(0xFF121212), width: 2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header stub
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.between,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      color: const Color(0xFFDC2626),
                      child: const Text(
                        'DROP LIVE',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11),
                      ),
                    ),
                    Text(
                      'PASS NO. $passNumber',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF121212)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  eventTitle,
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 20, color: Color(0xFF121212)),
                ),
                const SizedBox(height: 6),
                Text('Location: $venue', style: const TextStyle(fontSize: 12, color: Color(0xFF404040))),
                Text('Schedule: $schedule', style: const TextStyle(fontSize: 12, color: Color(0xFF404040))),
              ],
            ),
          ),

          // Perforated line divider
          CustomPaint(
            painter: PerforatedLinePainter(),
            child: const SizedBox(height: 16),
          ),

          // Inventory & Action
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.between,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Inventory Status', style: TextStyle(fontSize: 12, color: Color(0xFF525252))),
                        Text(
                          '${remainingSeats.toString().padLeft(2, '0')} / $totalCapacity spots',
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: Color(0xFF121212)),
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        const Text('Hold Window', style: TextStyle(fontSize: 12, color: Color(0xFF525252))),
                        Text(
                          holdTimeLeft,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF121212)),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: onLockSpot,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isHolding ? const Color(0xFF16A34A) : const Color(0xFFFDE047),
                    foregroundColor: isHolding ? Colors.white : const Color(0xFF121212),
                    elevation: 0,
                    side: const BorderSide(color: Color(0xFF121212), width: 2),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
                  ),
                  child: Text(
                    isHolding ? 'SPOT LOCKED (04:59)' : 'LOCK SPOT (REDIS LEASE)',
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, letterSpacing: 0.5),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class PerforatedLinePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF121212)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    const dashWidth = 6.0;
    const dashSpace = 4.0;
    double startX = 0.0;
    final y = size.height / 2;

    while (startX < size.width) {
      canvas.drawLine(Offset(startX, y), Offset(startX + dashWidth, y), paint);
      startX += dashWidth + dashSpace;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
