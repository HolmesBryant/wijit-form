<?php

// Testing form submissions with 503 responses.
////////////////////////////////////////////
// http_response_code(503);
// die();
////////////////////////////////////////////

$fail = $_REQUEST['fail'] ?? false;
$test = $_REQUEST['test'] ?? false;

$headers = getallheaders();
$accept = $headers['Accept'] ?? 'application/json';

$status = ($fail) ? 'error' : 'success';
$message = ($fail) ? "Error message from server" : 'Success message from server';

$data = (object) [
	'status' => $status,
	'message' => $message,
	'data' => $_REQUEST,
	'deeply' => [
		'nested' => [
			'property' => 'deeply nested value'
		]
	]
];

if ($fail && $fail === 'true') {
	http_response_code(500);
} else {
	http_response_code(200);
}

if (!$test) { sleep(1); }

header("Content-Type: $accept; charset=UTF-8");

switch ($accept) {
	case 'text/html':
		echo "<h3>HTML</h3><p>$message</p>";
		break;
	default:
		echo json_encode($data);
		break;
}


