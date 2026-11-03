import 'package:flutter/material.dart';
import '../booking/physical_pass_widget.dart';
import '../vibe/attendee_chemistry_widget.dart';

class EventFeedScreen extends StatefulWidget {
  const EventFeedScreen({super.key});

  @override
  State<EventFeedScreen> createState() => _EventFeedScreenState();
}

class _EventFeedScreenState extends State<EventFeedScreen> {
  bool _isHolding = false;
  int _remainingSeats = 8;

  void _handleLockSpot() {
    setState(() {
      _isHolding = true;
      _remainingSeats = 7;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F4F0),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF5F4F0),
        elevation: 0,
        title: const Text(
          'PULSE:IRL',
          style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF121212), fontSize: 16),
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16, top: 12, bottom: 12),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFFDE047),
              border: Border.all(color: const Color(0xFF121212)),
            ),
            child: const Center(
              child: Text(
                'LAGOS / VI',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Color(0xFF121212)),
              ),
            ),
          )
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(2),
          child: Container(color: const Color(0xFF121212), height: 2),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          PhysicalTicketPass(
            passNumber: '00412',
            eventTitle: 'Rooftop Vinyl Session & Mezcal Tasting',
            venue: '14 Akin Adesola, Victoria Island',
            schedule: 'Friday, 20:00 WAT',
            remainingSeats: _remainingSeats,
            totalCapacity: 40,
            holdTimeLeft: '04:59',
            isHolding: _isHolding,
            onLockSpot: _handleLockSpot,
          ),
          const SizedBox(height: 16),
          // Chemistry Preview
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: const Color(0xFF121212), width: 2),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'VERIFIED ATTENDEE CHEMISTRY',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Color(0xFF121212)),
                ),
                SizedBox(height: 4),
                Text(
                  '4 confirmed guests share your interests in rare vinyl pressings and modern architecture.',
                  style: TextStyle(fontSize: 12, color: Color(0xFF404040)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
