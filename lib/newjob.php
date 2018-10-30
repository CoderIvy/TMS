<?php
// only included by api.php
if (defined("_API_ENTRY") === false) {
    exit(0);
}

$postdata = null;

if ($_POST) {
    foreach ($_POST as $key => $value) {
        if ($key === "data") {
            if (is_array($value)) {
                $postdata = $value;
                break;
            }
        }
    }
}

if ($postdata == null) {
    $output["errcode"] = 6;
    $output["errmsg"] = "new job data not found for: " . $action;
    $output["data"] = new stdClass();
    done();
}

$title = isset($postdata["job_title"]) ? $postdata["job_title"] : "unknown title";

$detail = isset($postdata["detail"]) ? $postdata["detail"] : "unknown detail";
$start_time = $postdata["start_date"] . " " . $postdata["start_time"];
$duration = isset($postdata["duration"]) ? $postdata["duration"] : "120";

// prepare and bind
$stmt = $database->execute("INSERT INTO job (job_title, detail, start_time, duration) VALUES (?, ?, ?, ?)", "ssss", $title, $detail, $start_time, $duration);
// $stmt->bind_param("ssss", $title, $detail, $start_time, $duration);

$output["errcode"] = 0;
$output["errmsg"] = "Create new job successfully";

done();
