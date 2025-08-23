import 'package:app/loginScreen.dart';
import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Voice Upload App',
      debugShowCheckedModeBanner: false,
      home: LoginScreen(),
    );
  }
}
