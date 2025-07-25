<?php
// Clear any previous output
ob_clean();
header('Content-Type: application/json');

// Database connection
$host = '192.168.0.162';
$db = 'Tubern';
$user = 'tubernuser';
$pass = 'MfMkjX2OjzKQQyrS';

try {
    // Connect to the database
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Query the database for the latest 10 video files
    $stmt = $pdo->query("SELECT Filename, Date, Size FROM HistoryVid ORDER BY Id DESC");
    $dbFiles = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get files from the video folder
    $videoFolder = __DIR__ . '/video';
    $filesInFolder = array_diff(scandir($videoFolder), array('.', '..'));

    // Filter database results to only include files present in the video folder
    $filteredFiles = array_filter($dbFiles, function ($file) use ($filesInFolder) {
        return in_array($file['Filename'], $filesInFolder);
    });

    // Add placeholder date and encode filenames
    $filteredFiles = array_map(function ($file) {
        if (empty($file['Date'])) {
            $file['Date'] = date('d.m.Y'); // Use current date as placeholder
        }
        $file['Filename'] = rawurlencode($file['Filename']); // Encode special characters
        return $file;
    }, $filteredFiles);

    // Return the filtered list as JSON
    echo json_encode(array_values($filteredFiles));
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
