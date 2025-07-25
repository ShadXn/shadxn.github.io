<?php
// Set headers
header('Content-Type: application/json');

// Database connection
$host = '192.168.0.162';
$db = 'Tubern';
$user = 'tubernuser'; // Replace with your database username
$pass = 'MfMkjX2OjzKQQyrS';

// Parse request data
$data = json_decode(file_get_contents('php://input'), true);
$url = $data['url'] ?? null;
$type = $data['type'] ?? 'music'; // Default to "music"

// Validate URL
if (filter_var($url, FILTER_VALIDATE_URL) === false) {
    echo json_encode(['error' => 'Invalid URL']);
    exit;
}

// Setup directories
if ($type === 'music') {
    $downloadFolder = __DIR__ . '/music';
} elseif ($type === 'video') {
    $downloadFolder = __DIR__ . '/video';
}

// Ensure download folder exists
if (!is_dir($downloadFolder)) {
    mkdir($downloadFolder, 0777, true);
}

try {
    // Connect to the database
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // yt-dlp command
    if ($type === 'music') {
        $cmd = sprintf(
            'yt-dlp --prefer-ffmpeg --extract-audio --audio-format mp3 --audio-quality 0 --embed-thumbnail --add-metadata --restrict-filenames --metadata-from-title "%%(artist)s - %%(title)s" -o %s %s 2>&1',
            escapeshellarg($downloadFolder . '/%(title)s.%(ext)s'),
            escapeshellarg($url)
        );
    } elseif ($type === 'video') {
        $cmd = sprintf(
            'yt-dlp --compat-options all --add-metadata --restrict-filenames --metadata-from-title "%%(artist)s - %%(title)s" -o %s %s 2>&1',
            escapeshellarg($downloadFolder . '/%(title)s.%(ext)s'),
            escapeshellarg($url)
        );
    }

    // Execute the command and capture output
    exec($cmd, $output, $status);

    if ($status !== 0) {
        echo json_encode(['error' => 'Failed to download the file.', 'details' => $output]);
        exit;
    }

    // Extract the filename from the yt-dlp output
    $filename = null;
    foreach ($output as $line) {
        if (preg_match('/\[Metadata\] Adding metadata to "(.+)"$/', $line, $matches)) {
            $filename = basename($matches[1]);
            break;
        }
    }

    if (!$filename) {
        echo json_encode(['error' => 'Unable to determine the downloaded filename.']);
        exit;
    }

    // Ensure unique filename
    $pathInfo = pathinfo($filename);
    $baseName = $pathInfo['filename'];
    $extension = $pathInfo['extension'];
    $counter = 1;

    while (file_exists("$downloadFolder/$baseName-$counter.$extension")) {
        $counter++;
    }
    $finalFilename = "$baseName-$counter.$extension";

    rename("$downloadFolder/$filename", "$downloadFolder/$finalFilename");
    $videoPath = "$downloadFolder/$finalFilename";
    // Only check codec and reencode if file is ≤ 50 MB
    if ($type === 'video' && filesize($videoPath) <= 50 * 1024 * 1024) {
        // Use ffprobe to detect codec
        $ffprobeCmd = sprintf(
            'ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of csv=p=0 %s',
            escapeshellarg($videoPath)
        );
        $videoCodec = trim(shell_exec($ffprobeCmd));

        // If codec is VP9, re-encode to H.264
        if ($videoCodec === 'vp9') {
            $tempH264Path = "$downloadFolder/{$baseName}-{$counter}-h264.mp4";

            $ffmpegReencodeCmd = sprintf(
                'ffmpeg -i %s -c:v libx264 -c:a aac -strict experimental %s 2>&1',
                escapeshellarg($videoPath),
                escapeshellarg($tempH264Path)
            );
            exec($ffmpegReencodeCmd, $reencodeOutput, $reencodeStatus);

            if ($reencodeStatus === 0) {
                // Remove original VP9 file
                unlink($videoPath);

                // Rename H264 version back to original filename
                rename($tempH264Path, $videoPath);
            } else {
                error_log('Re-encoding to H264 failed: ' . implode("\n", $reencodeOutput));
            }
        }
    }

    // Generate a thumbnail for video files
    if ($type === 'video') {
        $thumbnailFolder = __DIR__ . '/video/thumbnails';

        // Ensure the thumbnail directory exists
        if (!is_dir($thumbnailFolder)) {
            mkdir($thumbnailFolder, 0777, true);
        }

        // Generate the thumbnail
        $thumbnailFilename = "$baseName-$counter.$extension.jpg"; // Match video filename
        $thumbnailPath = "$thumbnailFolder/$thumbnailFilename";
        $videoPath = "$downloadFolder/$finalFilename";

        // Use FFmpeg to generate the thumbnail
        $thumbnailCmd = sprintf(
            'ffmpeg -i %s -ss 00:00:01.000 -vframes 1 %s 2>&1',
            escapeshellarg($videoPath),
            escapeshellarg($thumbnailPath)
        );
        exec($thumbnailCmd, $thumbnailOutput, $thumbnailStatus);

        if ($thumbnailStatus !== 0) {
            error_log('Failed to generate thumbnail: ' . implode("\n", $thumbnailOutput));
        }
    }

    // Get file size in MB
    $fileSize = filesize("$downloadFolder/$finalFilename") / (1024 * 1024);
    $fileSizeFormatted = number_format($fileSize, 2) . 'M';

    // Insert record into the database
    if ($type === 'music') {
        $stmt = $pdo->prepare('INSERT INTO History (Filename, Date, Size, Username) VALUES (:filename, :date, :size, " ")');
    } elseif ($type === 'video') {
        $stmt = $pdo->prepare('INSERT INTO HistoryVid (Filename, Date, Size, Username) VALUES (:filename, :date, :size, " ")');
    }
    $stmt->execute([
        ':filename' => $finalFilename,
        ':date' => date('d.m.Y'),
        ':size' => $fileSizeFormatted,
    ]);

    // Return success response
    echo json_encode([
        'success' => true,
        'filename' => $finalFilename,
        'thumbnail' => $type === 'video' ? $thumbnailPath : null,
        'url' => sprintf('/%s/%s', $type, $finalFilename), // Dynamically set folder
    ]);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
