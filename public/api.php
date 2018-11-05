<?php

/**
 * TODO
 * 1. date picker format, click different date show different schedule
 * 2. check user role when user update job or create new job
 * 3. get job list depends on user role, manager can see all user's info, staffs can only view their job list
 * 4. login page layout
 * 5. own job can be move delay half hour or 1 hour
 */

// by default api output in JSON
header("Content-type: application/json; charset=utf-8");

define("_API_ENTRY", true);

define("BROWSER_ID_COOKIE_NAME", "browser_id");

define("LIBDIR", __DIR__ . "/../lib/");

define("CFGDIR", __DIR__ . "/../config/");

$action = "index";

if (array_key_exists("act", $_GET)) {
    $action = htmlspecialchars($_GET["act"]);
}

//
$sub_action = "NA";

if (array_key_exists("subact", $_GET)) {
    $sub_action = htmlspecialchars($_GET["subact"]);
}

// base user info
$client_sid = null;
$sid_expire = 0;
$user_id = null;
$browser_id = "";
$login_email = null;
$login_password = null;
$first_name = null;
$last_name = null;
$phone = null;
$image = null;
$role = null;

if (array_key_exists(BROWSER_ID_COOKIE_NAME, $_GET)) {
    $browser_id = htmlspecialchars($_GET[BROWSER_ID_COOKIE_NAME]);
}

if (strlen($browser_id) == 0 && isset($_COOKIE[BROWSER_ID_COOKIE_NAME])) {
    // check cookie
    $browser_id = $_COOKIE[BROWSER_ID_COOKIE_NAME];
}

if (strlen($browser_id) === 0) {
    $browser_id = session_create_id("BROWSERID");
}

// output include: action, data, errcode, errmsg
$output = array("action" => $action, "sub_action" => $sub_action, "method" => $_SERVER['REQUEST_METHOD'], "uid" => "", "sid" => "", "browser_id" => $browser_id, "data" => new stdClass(), "errcode" => 0, "errmsg" => "");

// done will flush $output in JSON format to browser and terminate current request.
function done()
{
    global $output;
    global $database;
    echo json_encode($output);
    $database->close();
    exit($output["errcode"]);
}

// remote access from https only
if ((!isset($_SERVER['HTTPS']) || $_SERVER['HTTPS'] !== 'on') && (isset($_SERVER['SERVER_ADDR']) && $_SERVER['SERVER_ADDR'] != $_SERVER['REMOTE_ADDR'])) {
    // no SSL request from remote
    $output["errcode"] = 2048;
    $output["errmsg"] = "please access this api from https";
    $output["data"] = new stdClass();
    done();
}

$noCacheTs = "NA";
if (isset($_GET["noCacheTs"])) {
    $noCacheTs = $_GET["noCacheTs"];
}

header("X-noCacheTs: " . $noCacheTs);

//for debug
if ($action === "phpinfo") {
    // do not initialize database for phpinfo();
    // html output, by default api output in JSON, but phpinfo is in html so has to add header
    header("Content-type: text/html; charset=utf-8");
    phpinfo();
    exit(0);
}

// enable database access
include_once LIBDIR . 'database.php';

// always check session
include_once LIBDIR . "session.php";

switch ($action) {
    case 'joblist':
        include_once LIBDIR . "getjoblist.php";
        done();
        break;

    case 'newjob':
        if ($output["method"] !== "POST") {
            $output["errcode"] = 8;
            $output["errmsg"] = "only POST accepted for: " . $action;
            $output["data"] = new stdClass();
            done();
            break;
        }
        include_once LIBDIR . "newjob.php";
        done();
        break;

    case 'updatejob':
        if ($output["method"] !== "POST") {
            $output["errcode"] = 6;
            $output["errmsg"] = "only POST accepted for: " . $action;
            $output["data"] = new stdClass();
            done();
            break;
        }
        include_once LIBDIR . "updatejob.php";
        done();
        break;

    case 'index':
        done();
        break;
    default:
        // unknown action;
        $output["errcode"] = 9;
        $output["errmsg"] = "unknown api action: " . $action;
        $output["data"] = new stdClass();
        done();
        break;

}
