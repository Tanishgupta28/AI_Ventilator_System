import 'dart:io';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:record/record.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import 'package:audioplayers/audioplayers.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(title: 'Voice Upload App', home: LoginScreen());
  }
}

// ---------------- LOGIN SCREEN ----------------
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _loading = false;

  Future<void> _login() async {
    setState(() => _loading = true);

    final response = await http.post(
      Uri.parse("https://israel-5mizz.ondigitalocean.app/member/login"),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({
        "email": _emailController.text,
        "password": _passwordController.text,
      }),
    );

    setState(() => _loading = false);
    print(response);

    final res = jsonDecode(response.body);
    print(res["message"]);
    if (res["message"] == "Member login successful") {
      print(res);

      // save token if needed
      String token = res["data"]["token"];
      String memberId = res["data"]["member"]["id"];

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => HomeScreen(userId: memberId, token: token),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res["message"] ?? "Invalid login")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Login")),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _emailController,
              decoration: const InputDecoration(labelText: "Email"),
            ),
            TextField(
              controller: _passwordController,
              obscureText: true,
              decoration: const InputDecoration(labelText: "Password"),
            ),
            const SizedBox(height: 20),
            _loading
                ? const CircularProgressIndicator()
                : ElevatedButton(onPressed: _login, child: const Text("Login")),
          ],
        ),
      ),
    );
  }
}

// ---------------- HOME SCREEN ----------------
class HomeScreen extends StatefulWidget {
  final String userId;
  final String token;
  const HomeScreen({super.key, required this.userId, required this.token});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final AudioRecorder _recorder = AudioRecorder();
  final AudioPlayer _audioPlayer = AudioPlayer();
  String? _filePath;
  List<String> _userAudios = [];
  bool _loading = false;

  int? _currentlyPlayingIndex;
  bool _isPaused = false;

  Duration _duration = Duration.zero;
  Duration _position = Duration.zero;

  @override
  void initState() {
    super.initState();
    _fetchUserAudios();

    _audioPlayer.onDurationChanged.listen((d) {
      setState(() => _duration = d);
    });
    _audioPlayer.onPositionChanged.listen((p) {
      setState(() => _position = p);
    });
    _audioPlayer.onPlayerComplete.listen((event) {
      setState(() {
        _currentlyPlayingIndex = null;
        _position = Duration.zero;
        _isPaused = false;
      });
    });
  }

  Future<void> _fetchUserAudios() async {
    setState(() => _loading = true);

    final response = await http.get(
      Uri.parse(
        "https://israel-5mizz.ondigitalocean.app/memvoice/member/${widget.userId}",
      ),
    );

    setState(() => _loading = false);

    if (response.statusCode == 200) {
      final res = jsonDecode(response.body);
      final List audios = res["data"]["member"]["membervoice"];

      setState(() {
        _userAudios = audios.map((e) => e["url"].toString()).toList();
      });
    } else {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Failed to load audios")));
    }
  }

  Future<void> _startRecording() async {
    if (await _recorder.hasPermission()) {
      final path =
          "/storage/emulated/0/Download/${DateTime.now().millisecondsSinceEpoch}.m4a";
      await _recorder.start(const RecordConfig(), path: path);
    }
  }

  Future<void> _stopRecording() async {
    final path = await _recorder.stop();
    setState(() => _filePath = path);
  }

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(type: FileType.audio);
    if (result != null && result.files.single.path != null) {
      setState(() => _filePath = result.files.single.path!);
    }
  }

  Future<void> _submitAudio() async {
    if (_filePath == null) return;

    setState(() => _loading = true);

    var request = http.MultipartRequest(
      "POST",
      Uri.parse(
        "https://israel-5mizz.ondigitalocean.app/memvoice/voice/${widget.userId}",
      ),
    );

    // ✅ change "audio" → "voice" (must match backend)
    request.files.add(await http.MultipartFile.fromPath("voice", _filePath!));

    try {
      var response = await request.send();
      setState(() => _loading = false);

      if (response.statusCode == 201) {
        final res = await http.Response.fromStream(response);
        final data = jsonDecode(res.body);

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(data["message"] ?? "Audio uploaded successfully"),
          ),
        );

        setState(() {
          _filePath = null;
        });

        _fetchUserAudios(); // refresh list
      } else {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text("Upload failed")));
      }
    } catch (e) {
      setState(() => _loading = false);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Error: $e")));
    }
  }

  Future<void> _playAudio(
    String source,
    int index, {
    bool isLocal = false,
  }) async {
    await _audioPlayer.stop();
    if (isLocal) {
      await _audioPlayer.play(DeviceFileSource(source));
    } else {
      await _audioPlayer.play(UrlSource(source));
    }
    setState(() {
      _currentlyPlayingIndex = index;
      _isPaused = false;
      _position = Duration.zero;
    });
  }

  Future<void> _pauseAudio() async {
    await _audioPlayer.pause();
    setState(() => _isPaused = true);
  }

  Future<void> _resumeAudio() async {
    await _audioPlayer.resume();
    setState(() => _isPaused = false);
  }

  Future<void> _stopAudio() async {
    await _audioPlayer.stop();
    setState(() {
      _currentlyPlayingIndex = null;
      _isPaused = false;
    });
  }

  String _formatTime(Duration d) {
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    final minutes = twoDigits(d.inMinutes.remainder(60));
    final seconds = twoDigits(d.inSeconds.remainder(60));
    return "$minutes:$seconds";
  }

  @override
  void dispose() {
    _recorder.dispose();
    _audioPlayer.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final localAudioIndex = _userAudios.length;

    return Scaffold(
      appBar: AppBar(
        title: Text("Welcome ${widget.userId}"),
        centerTitle: true,
        elevation: 2,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const Text(
              "Your Audios:",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            _loading ? const LinearProgressIndicator() : const SizedBox(),
            Expanded(
              child: ListView.builder(
                itemCount: _userAudios.length + (_filePath != null ? 1 : 0),
                itemBuilder: (context, index) {
                  final isPlaying = _currentlyPlayingIndex == index;

                  if (_filePath != null && index == localAudioIndex) {
                    return _buildAudioTile(
                      title: "New Selected Audio",
                      subtitle: _filePath!,
                      source: _filePath!,
                      index: localAudioIndex,
                      isLocal: true,
                      isPlaying: isPlaying,
                      trailing: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onPressed: _submitAudio,
                        icon: const Icon(Icons.cloud_upload),
                        label: const Text("Submit"),
                      ),
                    );
                  } else {
                    return _buildAudioTile(
                      title: "Audio ${index + 1}",
                      subtitle: _userAudios[index],
                      source: _userAudios[index],
                      index: index,
                      isLocal: false,
                      isPlaying: isPlaying,
                    );
                  }
                },
              ),
            ),
          ],
        ),
      ),

      /// Action bar for recording & picking files
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        margin: const EdgeInsets.only(bottom: 50),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 6,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            Expanded(
              child: GestureDetector(
                onLongPress: _startRecording,
                onLongPressUp: _stopRecording,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    backgroundColor: Colors.redAccent,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                  ),
                  onPressed: null, // handled by gesture
                  icon: const Icon(Icons.mic, size: 26),
                  label: const Text(
                    "Hold to Record",
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  backgroundColor: Colors.blueAccent,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                ),
                onPressed: _pickFile,
                icon: const Icon(Icons.upload_file, size: 26),
                label: const Text(
                  "Pick File",
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAudioTile({
    required String title,
    required String subtitle,
    required String source,
    required int index,
    required bool isLocal,
    required bool isPlaying,
    Widget? trailing,
  }) {
    final isCurrent = _currentlyPlayingIndex == index;

    return Column(
      children: [
        ListTile(
          leading: IconButton(
            icon: Icon(
              isCurrent
                  ? (_isPaused ? Icons.play_arrow : Icons.pause)
                  : Icons.play_arrow,
            ),
            onPressed: () {
              if (isCurrent) {
                if (_isPaused) {
                  _resumeAudio();
                } else {
                  _pauseAudio();
                }
              } else {
                _playAudio(source, index, isLocal: isLocal);
              }
            },
          ),
          title: Text(title),
          subtitle: Text(subtitle),
          trailing:
              trailing ??
              (isCurrent
                  ? IconButton(
                      icon: const Icon(Icons.stop),
                      onPressed: _stopAudio,
                    )
                  : null),
        ),
        if (isCurrent)
          Column(
            children: [
              Slider(
                min: 0,
                max: _duration.inSeconds.toDouble(),
                value: _position.inSeconds
                    .clamp(0, _duration.inSeconds)
                    .toDouble(),
                onChanged: (value) async {
                  final newPosition = Duration(seconds: value.toInt());
                  await _audioPlayer.seek(newPosition);
                },
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(_formatTime(_position)),
                    Text(_formatTime(_duration)),
                  ],
                ),
              ),
            ],
          ),
      ],
    );
  }
}
