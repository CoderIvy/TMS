<?php
// only included by api.php
if (defined("_API_ENTRY") === false) {
    exit(0);
}

// get all user info
$stmt = $database->query("SELECT user_id,password,first_name,last_name,phone,image,role FROM user");

$stmt->bind_result($user_id, $password, $first_name, $last_name, $phone, $image, $role);

$rowObj = new stdClass();
$rowObj->user_id = 0;
$rowObj->password = "NA";
$rowObj->first_name = "NA";
$rowObj->last_name = "NA";
$rowObj->phone = "NA";
$rowObj->image = "NA";
$rowObj->role = "NA";
$rowObj->joblist = array();

$userList = array(0 => $rowObj);

while ($stmt->fetch()) {
    $rowObj = new stdClass();
    $rowObj->user_id = $user_id;
    $rowObj->password = $password;
    $rowObj->first_name = $first_name;
    $rowObj->last_name = $last_name;
    $rowObj->phone = $phone;
    $rowObj->image = $image;
    $rowObj->role = $role;

    // all jobs for this uid
    $rowObj->joblist = array();

    $userList[$user_id] = $rowObj;

}

$stmt = $database->query("SELECT job_id,job_title,detail,start_time,duration,job_status,user_id FROM job");

$stmt->bind_result($job_id, $job_title, $detail, $start_time, $duration, $job_status, $user_id);

$jobList = array();
while ($stmt->fetch()) {
    $rowObj = new stdClass();
    $rowObj->job_id = $job_id;
    $rowObj->job_title = $job_title;
    $rowObj->detail = $detail;
    $rowObj->start_time = $start_time;
    $rowObj->duration = $duration;
    $rowObj->job_status = $job_status;
    $rowObj->user_id = $user_id;

    //
    if (array_key_exists($user_id, $userList)) {
        $userList[$user_id]->joblist = array_merge($userList[$user_id]->joblist, array($job_id => $rowObj));
    } else {
        $rowObj->user_id = 0;
        $userList[0]->joblist = array_merge($userList[0]->joblist, array($job_id => $rowObj));
    }
}

$output["data"] = array("userlist" => $userList);
$output["errmsg"] = "job/user list ok";

done();
