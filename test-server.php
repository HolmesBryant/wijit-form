<?php
error_reporting(E_ALL);

$pass = true;
$headers = getallheaders();
$accept = $headers['Accept'] ?? 'application/json';

$status = ($pass) ? 'success' : 'error';
$title = ($pass) ? 'Success!' : 'Error!';
$message = ($pass) ? 'Thank you for your input' : "I'm sorry, there was a problem processing your form.";

$data = (object) [
	'status' => $status,
	'title' => $title,
	'message' => $message,
	'data' => $_REQUEST
];

if ($pass) {
	http_response_code(200);
} else {
	http_response_code(500);
}

sleep(2);

header("Content-Type: $accept; charset=UTF-8");

switch ($accept) {
	case 'text/html':
		echo "<h3>$title</h3><p>$message</p>";
		break;
	default:
		echo json_encode($data);
		break;
}


