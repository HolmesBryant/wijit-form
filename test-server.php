<?php

$fail = $_REQUEST['fail'] ?? false;
$headers = getallheaders();
$accept = $headers['Accept'] ?? 'application/json';

$status = ($fail) ? 'error' : 'success';
$message = ($fail) ? "Error message from server" : 'Success message from server.';

$data = (object) [
	'status' => $status,
	'title' => $title,
	'message' => $message,
	'data' => $_REQUEST
];

if ($fail && $fail === 'true') {
	http_response_code(503);
} else {
	http_response_code(200);
}

sleep(1);

header("Content-Type: $accept; charset=UTF-8");

switch ($accept) {
	case 'text/html':
		echo "<h3>HTML</h3><p>$message</p>";
		break;
	default:
		echo json_encode($data);
		break;
}


