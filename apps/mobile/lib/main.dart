import 'package:flutter/material.dart';
import 'features/feed/event_feed_screen.dart';

void main() {
  runApp(const PulseIRLMobileApp());
}

class PulseIRLMobileApp extends StatelessWidget {
  const PulseIRLMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PulseIRL',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        scaffoldBackgroundColor: const Color(0xFFF5F4F0),
        fontFamily: 'Space Grotesk',
        useMaterial3: true,
      ),
      home: const EventFeedScreen(),
    );
  }
}
