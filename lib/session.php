<?php

// login session manage

// only included by api.php
if (defined("_API_ENTRY") === false) {
    exit(0);
}

define("TEN_YEARS", 315360000); // 10 years, 10 * 365 * 24 * 60 * 60;

define("SESS_COOKIE_NAME", "session_id");

$client_sid = "";

if (array_key_exists(SESS_COOKIE_NAME, $_GET)) {
    $client_sid = htmlspecialchars($_GET[SESS_COOKIE_NAME]);
}

if (strlen($client_sid) == 0 && isset($_COOKIE[SESS_COOKIE_NAME])) {
    // check cookie
    $client_sid = $_COOKIE[SESS_COOKIE_NAME];
}

//
function getUserInfoByID($uid, $force = false)
{
    global $action;
    global $sub_action;
    global $output;
    global $dbconn;
    global $database;

    global $client_sid;
    global $sid_expire;
    global $browser_id;
    global $user_id;
    global $first_name;
    global $last_name;
    global $phone;
    global $image;
    global $role;

    global $login_email;
    global $login_password;

    if ($force !== true && $uid === $user_id && $user_id != null && $first_name != null && $last_name != null && $role != null) {
        // already exist
        return;
    }

    // query db by uid
    $stmt = $database->execute("SELECT user_id,password,email,first_name,last_name,phone,image,role FROM user WHERE user_id = ? LIMIT 1", "s", $uid);

    $hashed_password = null;
    
    $stmt->bind_result($user_id, $hashed_password, $login_email, $first_name, $last_name, $phone, $image, $role);

    $stmt->fetch();

    if ($user_id == null || $hashed_password == null || $login_email == null || $role == null) {
        // uid not found
        $output["errcode"] = 1002;
        $output["errmsg"] = "user info not found: " . $uid;
        $output["data"] = new stdClass();
        done();
    }

    return;
}

//
function update_session($uid, $delete = false)
{
    global $action;
    global $sub_action;
    global $output;
    global $dbconn;
    global $database;

    global $client_sid;
    global $sid_expire;
    global $browser_id;
    global $user_id;
    global $first_name;
    global $last_name;
    global $phone;
    global $image;
    global $role;

    global $login_email;
    global $login_password;

    if ($delete === true) {
        $user_id = $uid;
        if ($user_id == null) {
            // delete session cookie only
            setcookie(SESS_COOKIE_NAME, "", 0, "/");
            return;
        }

        $stmt = $database->execute("DELETE FROM session WHERE user_id = ? AND (browser_id = ? OR browser_id = NULL)", "ss", $user_id, $browser_id);

        $output["sid"] = "";
        $output["uid"] = "";
        $output["email"] = "";
        $output["role"] = "";

        // delete session cookie
        setcookie(SESS_COOKIE_NAME, "", 0, "/");
        return;
    }

    getUserInfoByID($uid);

    if ($client_sid == null || $user_id == null || $first_name == null || $last_name == null || $role == null) {
        $output["errcode"] = 1001;
        $output["errmsg"] = "unable to update session in db: no login";
        $output["data"] = new stdClass();
        done();
    }

    //
    $cur_ts = time();

    $sid_expire = $cur_ts + (86400 * 30);
    $stmt = $database->execute("REPLACE INTO session (user_id, sid, browser_id, expire) VALUES (?, ?, ?, ?)", "ssss", $user_id, $client_sid, $browser_id, $sid_expire);

    $output["sid"] = $client_sid;
    $output["browser_id"] = $browser_id;
    $output["uid"] = $user_id;
    $output["email"] = $login_email;
    $output["role"] = $role;

    // re-flash session expire
    setcookie(SESS_COOKIE_NAME, $client_sid, $sid_expire, "/"); // 86400 = 1 day

    // browser id will not expire
    setcookie(BROWSER_ID_COOKIE_NAME, $browser_id, $cur_ts + TEN_YEARS, "/");

    return;
}

// check session in db
function check_session($finish = false, $logout = false)
{
    global $action;
    global $sub_action;
    global $output;
    global $dbconn;
    global $database;

    global $client_sid;
    global $sid_expire;
    global $browser_id;
    global $user_id;
    global $first_name;
    global $last_name;
    global $phone;
    global $image;
    global $role;

    global $login_email;
    global $login_password;

    if (strlen($client_sid) < 16) {

        update_session($user_id, true);

        $output["errcode"] = 1001;
        $output["errmsg"] = "invalid session id for: " . $action . ", " . $sub_action;
        $output["data"] = new stdClass();
        done();
    }

    // prepare and bind
    $stmt = $database->execute("SELECT user_id,expire FROM session WHERE sid = ? AND (browser_id = ? OR browser_id = NULL) LIMIT 1", "ss", $client_sid, $browser_id);

    $stmt->bind_result($user_id, $sid_expire);

    $stmt->fetch();

    if ($user_id == null) {

        update_session($user_id, true);

        $output["errcode"] = 1001;
        $output["errmsg"] = "session id not found for: " . $action . ", " . $sub_action;
        $output["data"] = new stdClass();
        done();
    }

    $cur_ts = time();
    if ($sid_expire != null && $cur_ts > $sid_expire) {

        update_session($user_id, true);

        // expired
        $output["errcode"] = 1001;
        $output["errmsg"] = "session expired: " . $sid_expire;
        $output["data"] = new stdClass();
        done();
    }

    if ($logout) {
        update_session($user_id, true);

        $output["errcode"] = 0;
        $output["data"] = new stdClass();
        $output["errmsg"] = "logout successfully";

        done();
    } else {
        update_session($user_id);
    }
    if ($finish === true) {

        $output["errcode"] = 0;
        $output["data"] = array("user_id" => $user_id, "email" => $login_email, "first_name" => $first_name, "last_name" => $last_name, "phone" => $phone, "image" => $image, "role" => $role, "expire" => $sid_expire, "ts" => $cur_ts);
        $output["errmsg"] = "check session successfully";

        done();
    }

}

// check login and setup session in db
function check_login()
{
    global $action;
    global $sub_action;
    global $output;
    global $dbconn;
    global $database;

    global $client_sid;
    global $sid_expire;
    global $browser_id;
    global $user_id;
    global $first_name;
    global $last_name;
    global $phone;
    global $image;
    global $role;

    global $login_email;
    global $login_password;

    if ($login_email == null || $login_password == null) {
        $output["errcode"] = 1001;
        $output["errmsg"] = "invalid login data";
        $output["data"] = new stdClass();
        done();
    }

    // prepare and bind

    $stmt = $database->execute("SELECT user_id,password,first_name,last_name,phone,image,role FROM user WHERE email = ? LIMIT 1", "s", $login_email);
    
    $hashed_password = null;

    $hashed_password = null;

    $stmt->bind_result($user_id, $hashed_password, $first_name, $last_name, $phone, $image, $role);

    $stmt->fetch();

    if ($user_id == null || $hashed_password == null) {
        update_session($user_id, true);
        // email not found
        $output["errcode"] = 1001;
        $output["errmsg"] = "invalid user email or password";
        $output["data"] = new stdClass();
        done();
    }

    if (!password_verify($login_password, $hashed_password)) {
        update_session($user_id, true);
        // password mismatch
        $output["errcode"] = 1001;
        $output["errmsg"] = "invalid user email or password";
        $output["data"] = new stdClass();
        done();
    }

    // login ok

    // create session id and update

    $client_sid = session_create_id("TMS");

    $cur_ts = time();

    update_session($user_id);

    $output["sid"] = $client_sid;
    $output["browser_id"] = $browser_id;
    $output["uid"] = $user_id;
    $output["errcode"] = 0;
    $output["data"] = array("user_id" => $user_id, "email" => $login_email, "first_name" => $first_name, "last_name" => $last_name, "phone" => $phone, "image" => $image, "role" => $role, "expire" => $sid_expire, "ts" => $cur_ts);
    $output["errmsg"] = "login successfully";

    done();
}

if ($action !== "sess") {
    // check only
    check_session(false);
    // go back to api.php when session is valid.
    return;
}

// for act=sess only
if (strlen($sub_action) === 0) {
    $sub_action = "check";
}

switch ($sub_action) {
    case 'check':
        check_session(true);
        break;
    case 'logout':
        check_session(true, true);
        break;
    case 'login':
        if ($output["method"] !== "POST") {
            $output["errcode"] = 8;
            $output["errmsg"] = "only POST accepted for: " . $action . ", " . $sub_action;
            $output["data"] = new stdClass();
            done();
            break;
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
            $output["errmsg"] = "session post data not found for: " . $action;
            $output["data"] = new stdClass();
            done();
        }

        $login_email = $postdata["email"];
        $login_password = $postdata["password"];

        check_login();
        done();
        break;
    default:
        // unknown action;
        $output["errcode"] = 9;
        $output["errmsg"] = "unknown api action: " . $action . ", " . $sub_action;
        $output["data"] = new stdClass();
        done();
        break;
}
return;
