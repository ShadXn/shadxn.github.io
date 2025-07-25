<?php
// Database connection
$host = '192.168.0.162'; // Update if necessary
$db = 'Tubern';
$user = 'tubernuser'; // Replace with your database username
$pass = 'MfMkjX2OjzKQQyrS'; // Replace with your database password

header('Content-Type: application/json');

try {
    // Connect to the database
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Query the database for files in the History table
    $stmt = $pdo->query("SELECT Filename, Date, Size FROM History ORDER BY Id DESC");
    $dbFiles = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get files from the music folder
    $musicFolder = __DIR__ . '/music';
    $filesInFolder = array_diff(scandir($musicFolder), array('.', '..'));

    // Filter database results to only include files present in the music folder
    $filteredFiles = array_filter($dbFiles, function ($file) use ($filesInFolder) {
        return in_array($file['Filename'], $filesInFolder);
    });

    // Return the filtered list as JSON
    echo json_encode(array_values($filteredFiles));
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
