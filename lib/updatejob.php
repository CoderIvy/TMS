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
    $output["errmsg"] = "update job data not found for: " . $action;
    $output["data"] = new stdClass();
    done();
}

if ($postdata["user_id"] == null || $postdata["job_status"] == null || $postdata["job_id"] == null) {
    $output["errcode"] = 6;
    $output["errmsg"] = "invalid update job data for: " . $action;
    $output["data"] = new stdClass();
    done();
}

$user_id = $postdata["user_id"];

$job_status = $postdata["job_status"];

$job_id = $postdata["job_id"];

$start_time = $postdata["start_time"];

$stmt = $database->execute("UPDATE job SET user_id = ? , job_status = ?, start_time = ? WHERE job_id = ?", "ssss", $user_id, $job_status, $start_time, $job_id);
$output["errcode"] = 0;
$output["errmsg"] = "update job successfully";

done();
