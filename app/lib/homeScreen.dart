import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:record/record.dart';
import 'package:file_picker/file_picker.dart';
import 'package:audioplayers/audioplayers.dart';

class HomeScreen extends StatefulWidget {
  final String userId;
  final String? userName;
  const HomeScreen({super.key, required this.userId, required this.userName});

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

    request.files.add(await http.MultipartFile.fromPath("voice", _filePath!));

    var response = await request.send();
    setState(() => _loading = false);

    if (response.statusCode == 201) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("✅ Audio uploaded successfully")),
      );
      _filePath = null;
      _fetchUserAudios();
    } else {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("❌ Upload failed")));
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
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        title: Text("🎧 Hi, ${widget.userName}"),
        backgroundColor: Colors.blue.shade700,
        elevation: 4,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(bottom: Radius.circular(20)),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              children: const [
                Icon(Icons.library_music, color: Colors.blue, size: 28),
                SizedBox(width: 8),
                Text(
                  "Your Audios",
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            _loading ? const LinearProgressIndicator() : const SizedBox(),
            const SizedBox(height: 10),
            Expanded(
              child: ListView.builder(
                itemCount: _userAudios.length + (_filePath != null ? 1 : 0),
                itemBuilder: (context, index) {
                  final isPlaying = _currentlyPlayingIndex == index;

                  if (_filePath != null && index == localAudioIndex) {
                    return _buildAudioCard(
                      title: "🎤 New Selected Audio",
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
                        label: const Text("Upload"),
                      ),
                    );
                  } else {
                    return _buildAudioCard(
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
            const Divider(height: 30, thickness: 1.2),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue.shade600,
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 14,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(15),
                ),
                elevation: 5,
              ),
              onPressed: _pickFile,
              icon: const Icon(Icons.upload_file, size: 22),
              label: const Text(
                "Pick Audio File",
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildAudioCard({
    required String title,
    required String subtitle,
    required String source,
    required int index,
    required bool isLocal,
    required bool isPlaying,
    Widget? trailing,
  }) {
    final isCurrent = _currentlyPlayingIndex == index;

    return Card(
      color: Colors.white,
      elevation: 5,
      margin: const EdgeInsets.symmetric(vertical: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(10.0),
        child: Column(
          children: [
            ListTile(
              leading: CircleAvatar(
                radius: 25,
                backgroundColor: isCurrent
                    ? Colors.blue.shade700
                    : Colors.blue.shade100,
                child: Icon(
                  isCurrent
                      ? (_isPaused ? Icons.play_arrow : Icons.pause)
                      : Icons.play_arrow,
                  color: Colors.white,
                ),
              ),
              title: Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              subtitle: Text(
                subtitle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 13, color: Colors.grey),
              ),
              trailing:
                  trailing ??
                  (isCurrent
                      ? IconButton(
                          icon: const Icon(Icons.stop, color: Colors.red),
                          onPressed: _stopAudio,
                        )
                      : null),
              onTap: () {
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
            if (isCurrent)
              Column(
                children: [
                  Slider(
                    min: 0,
                    max: _duration.inSeconds.toDouble(),
                    value: _position.inSeconds
                        .clamp(0, _duration.inSeconds)
                        .toDouble(),
                    activeColor: Colors.blue.shade700,
                    onChanged: (value) async {
                      final newPosition = Duration(seconds: value.toInt());
                      await _audioPlayer.seek(newPosition);
                    },
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 14.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _formatTime(_position),
                          style: const TextStyle(fontSize: 12),
                        ),
                        Text(
                          _formatTime(_duration),
                          style: const TextStyle(fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}
