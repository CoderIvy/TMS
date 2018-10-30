/* jshint browser: true */
/* global window: false */

// need for jslint, to allow the browser globals available
// https://stackoverflow.com/questions/1853473/should-i-worry-about-window-is-not-defined-jslint-strict-mode-error


"use strict";

// global var for job filter
var jobStatusFilter = new Map();

// reload page with url
function reloadCurrentPage(url) {
    if (url === undefined) {
        url = "."
    }
    window.location.assign(url);
}

// show notify drop down
function notifyDropDown(show) {
    if (show === undefined) {
        show = true
    }
    alert("NOTIFY: " + show)
}

// show profile drop down
function profileDropDown(show) {
    if (show === undefined) {
        show = true
    }
    alert("PROFILE: " + show)
}

// 
function setMessageBar(text, color) {
    if (text == null) {
        $('#messageBarID').hide();
        HintMessageText = "";
        return;
    }
    if (color == null) {
        color = "green"
    }
    $("#messageTextID").css('color', color);

    $("#messageTextID").text(text);

    $('#messageBarID').show();
    HintMessageText = text;
    if (color == "red") {
        console.error("MessageBar(" + color + "): " + text);
    } else {
        console.log("MessageBar(" + color + "): " + text);
    }
}

// 
function setLoginMessage(text, color) {
    if (text == null) {
        $("#LoginMessageID").text("");
        LoginMessageText = "";
        return;
    }
    if (color == null) {
        color = "green"
    }

    $("#LoginMessageID").text(text);
    $("#LoginMessageID").css('color', color);
    LoginMessageText = text;
}

/**
 * getFunName return function name of caller
 * @returns {*}
 */
function getFunName() {
    var callerName;
    try { throw new Error(); }
    catch (e) {
        var re = /(\w+)@|at (\w+) \(/g, st = e.stack, m;
        re.exec(st), m = re.exec(st);
        callerName = m[1] || m[2];
    }
    return callerName;
}

//
String.prototype.capitalize = function () {
    if (this == null) {
        return this;
    }
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
}

// change global job status filter and redraw
function setJobStatusFilter(event) {
    // global
    jobStatusFilter = new Map();
    $('#jobStatusFilterID :selected').each(function (i, selected) {
        var selText = $(selected).text().trim().toUpperCase();
        jobStatusFilter.set(selText, selText);
        if (jobStatusFilter.size == 1) {
            $("#currentJobFilterID").text(selText.capitalize());
        } else {
            $("#currentJobFilterID").text("Multiple");
        }
    });
    console.log(jobStatusFilter);

    // re-draw
    drawJobMatrix();
}

/**
 * click different button show different pages
 * @param value
 */
function showSchedule(value) {
    var dayPage = document.getElementById("dayViewLayerID");
    var weekPage = document.getElementById("weekView");
    var monthPage = document.getElementById("monthView");
    var dayBtn = document.getElementById("dayBtn");
    var weekBtn = document.getElementById("weekBtn");
    var monthBtn = document.getElementById("monthBtn");

    value = value.toString();
    switch (value) {
        case "2":
            dayPage.style.display = "none";
            weekPage.style.display = "flex";
            monthPage.style.display = "none";
            dayBtn.style.backgroundColor = "#e6e6e6";
            dayBtn.style.color = 'rgba(' + [52,52,52,0.80].join(',') + ')';
            weekBtn.style.backgroundColor = "#43b75b";
            weekBtn.style.color = "white";
            monthBtn.style.backgroundColor = "#e6e6e6";
            monthBtn.style.color = 'rgba(' + [52,52,52,0.80].join(',') + ')';;


            break;
        case "3":
            dayPage.style.display = "none";
            weekPage.style.display = "none";
            monthPage.style.display = "flex";
            dayBtn.style.backgroundColor = "#e6e6e6";
            dayBtn.style.color = 'rgba(' + [52,52,52,0.80].join(',') + ')';;
            weekBtn.style.backgroundColor = "#e6e6e6";
            weekBtn.style.color = 'rgba(' + [52,52,52,0.80].join(',') + ')';;
            monthBtn.style.backgroundColor = "#43b75b";
            monthBtn.style.color = "white";

            break;

        case "1":
        default:
            dayPage.style.display = "flex";
            weekPage.style.display = "none";
            monthPage.style.display = "none";
            dayBtn.style.backgroundColor = "#43b75b";
            dayBtn.style.color = "white";
            weekBtn.style.backgroundColor = "#e6e6e6";
            weekBtn.style.color = 'rgba(' + [52,52,52,0.80].join(',') + ')';;
            monthBtn.style.backgroundColor = "#e6e6e6";
            monthBtn.style.color = 'rgba(' + [52,52,52,0.80].join(',') + ')';;

            break;

    }

}



/**
 * pass a add new job require to newjob.php
 */
// Variable to hold newJobRequest
var newJobRequest;

$(function () {
    // Bind to the submit event of our form
    $('#btnNewJobOK').click(function (event) {
        // Prevent default posting of form - put here to work in case of errors
        event.preventDefault();

        // Abort any pending newJobRequest
        if (newJobRequest) {
            newJobRequest.abort();
        }
        // setup some local variables
        var $form = $('#NewJobPageLayerID');

        // Let's select and cache all the fields
        var $inputs = $form.find("input, select, button, textarea");

        var postdata = {};

        $inputs.each(
            function (index) {
                var input = $(this);
                console.log('Type: ' + input.attr('type') + ', Name: ' + input.attr('name') + ', Value: ' + input.val());
                var key = input.attr('name');
                var val = input.val();
                postdata[key] = val;
            }
        );

        // do not use JSON.stringify here
        // convert to array
        var postJSON = { data: postdata };

        // Let's disable the inputs for the duration of the Ajax newJobRequest.
        // Note: we disable elements AFTER the form data has been serialized.
        // Disabled form elements will not be serialized.
        $inputs.prop("disabled", true);

        setMessageBar("submit new job ...", "yellow");

        // Fire off the newJobRequest to /form.php
        newJobRequest = $.ajax({
            url: "api.php?act=newjob",
            type: "post",
            data: postJSON
        });

        // Callback handler that will be called on success
        newJobRequest.done(function (tmsdata, textStatus, jqXHR) {
            $("#NewJobPageLayerID").css("display", "none");
            $('#NewJobPageLayerID').hide();

            if (check_session(tmsdata) !== 0) {
                return;
            }

            // TODO: check errcode from tmsdata

            var errcode = tmsdata["errcode"];
            var errmsg = tmsdata["errmsg"];

            if (errcode != 0) {
                setMessageBar(errmsg, "red");
                return;
            } else {
                // redraw
                getjoblist(errmsg);
            }

        });

        // Callback handler that will be called on failure
        newJobRequest.fail(function (jqXHR, textStatus, errorThrown) {
            // Log the error to the console
            $("#NewJobPageLayerID").css("display", "none");
            $('#NewJobPageLayerID').hide();

            setMessageBar("submit new job failed: " + textStatus + ", " + errorThrown, "red");

            console.error(
                "The following error occurred: " +
                textStatus, errorThrown
            );
        });

        // Callback handler that will be called regardless if the newJobRequest failed or succeeded
        newJobRequest.always(function () {
            // Reenable the inputs
            $inputs.prop("disabled", false);
        });

    });
});

/**
 * post login info to db
 * @param event
 */
function postLogin(event) {

    // Prevent default posting of form - put here to work in case of errors
    event.preventDefault();

    // Abort any pending newJobRequest
    if (newJobRequest) {
        newJobRequest.abort();
    }
    // setup some local variables
    var $form = $('#LoginPageLayerID');

    // Let's select and cache all the fields
    var $inputs = $form.find("input, select, button, textarea");

    var postdata = {};

    $inputs.each(
        function (index) {
            var input = $(this);
            console.log('Type: ' + input.attr('type') + ', Name: ' + input.attr('name') + ', Value: ' + input.val());
            var key = input.attr('name');
            var val = input.val();
            postdata[key] = val;
        }
    );

    var postJSON = { data: postdata };

    // Let's disable the inputs for the duration of the Ajax newJobRequest.
    // Note: we disable elements AFTER the form data has been serialized.
    // Disabled form elements will not be serialized.
    $inputs.prop("disabled", true);

    setMessageBar("submit login ...", "yellow");

    // Fire off the newJobRequest to /form.php
    newJobRequest = $.ajax({
        url: "api.php?act=sess&subact=login",
        type: "post",
        data: postJSON
    });

    // Callback handler that will be called on success
    newJobRequest.done(function (tmsdata, textStatus, jqXHR) {

        //
        if (check_session(tmsdata) !== 0) {
            return;
        }

        var errcode = tmsdata["errcode"];
        var errmsg = tmsdata["errmsg"];

        if (errcode != 0) {
            setMessageBar(errmsg, "red");
            setLoginMessage(errmsg, "red");
            $("#LoginPageLayerID").css("display", "flex");
            $("#LoginPageLayerID").show();
        } else {
            $("#LoginPageLayerID").css("display", "none");
            $("#LoginPageLayerID").hide();
            // redraw
            getjoblist(errmsg);
        }
        return;
    });

    // Callback handler that will be called on failure
    newJobRequest.fail(function (jqXHR, textStatus, errorThrown) {
        // Log the error to the console
        $("#LoginPageLayerID").css("display", "none");
        $("#LoginPageLayerID").hide();

        setMessageBar("submit login failed: " + textStatus + ", " + errorThrown, "red");

        console.log(
            "The following error occurred when login: " +
            textStatus, errorThrown
        );
    });

    // Callback handler that will be called regardless
    // if the newJobRequest failed or succeeded
    newJobRequest.always(function () {
        // Reenable the inputs
        $inputs.prop("disabled", false);
    });

}

//
function getTimeZoneShort() {
    var d = new Date();
    // console.log("now ts: " + d.getTime());
    var n = d.toLocaleString('en', { timeZoneName: 'short' }).split(' ').pop();
    if (n == null) {
        n = "GMT"
    }
    return n;
}

// 
function dateTimeTs(dateTime, isDbFormat) {
    var obj = dateTimeObject(dateTime, isDbFormat);
    if (obj == null) {
        return 0;
    }
    return obj.getTime();
}

/**
 * convert date time string ("17-10-2018 01:00") to Date object, when isDbFormat === true, using format: "2018-10-17 01:00"
 * @param dateTime
 * @param isDbFormat
 * @returns {*}
 */
function dateTimeObject(dateTime, isDbFormat) {

    // "Mon, 29 Oct, 2018 01:00"

    var tz = getTimeZoneShort();

    var dateParts = dateTime.split(", ");

    if (dateParts.length === 3) {
        var obj = new Date(dateTime + " " + tz);
        // console.log("dateTimeObject ts: " + obj.getTime());
        return obj;
    }

    var dateRexParts = dateTime.match(/(\d+)-(\d+)-(\d+) (\d+):(\d+)/);

    if (dateRexParts == null || dateRexParts.length < 5) {
        setMessageBar("Invalid date time format from dateTimeObject: " + dateTime, "red");
        return null;
    }


    if (isDbFormat === true) {
        // "2018-10-17 01:00"
        return new Date(dateRexParts[1], dateRexParts[2] - 1, dateRexParts[3], dateRexParts[4], dateRexParts[5], 0, 0);
    }
    // "17-10-2018 01:00"
    return new Date(dateRexParts[3], dateRexParts[2] - 1, dateRexParts[1], dateRexParts[4], dateRexParts[5], 0, 0);
}


/**
 * new job time comsuming
 */
$(function () {

    // initialize input widgets first
    $('#NewJobTime .time').timepicker({
        'showDuration': true,
        'timeFormat': 'H:i:s',


    });

    $('#NewJobTime .date').datepicker({
        'format': 'yyyy-m-d',
        'autoclose': true,
        // 'setDate' : new Date();
    });

});


/** check session or show login page
 * @param tmsdata
 * @returns {*}
 */
function check_session(tmsdata, msg) {

    var errcode = tmsdata["errcode"];
    var errmsg = tmsdata["errmsg"];
    var data = tmsdata["data"];
    var sid = tmsdata["sid"];
    var uid = tmsdata["uid"];
    var email = tmsdata["email"];
    var role = tmsdata["role"];

    if (errcode == undefined || errmsg == undefined) {
        errmsg = "invalid response format from api(basic)";
        setMessageBar(errmsg, "red");
        return 127;
    }

    // make sure it's string
    errmsg += "";
    sid += "";
    uid += "";

    // 1001 is no login
    if (errcode != 0 && errcode !== 1001) {
        // no session error
        setMessageBar(errmsg, "red");
        return errcode;
    }

    if (errcode !== 1001 && (data == undefined || sid == undefined || uid == undefined || email == undefined || role == undefined)) {
        errmsg = "invalid response format from api(data)";
        setMessageBar(errmsg, "red");
        return 128;
    }

    if (sid.length < 16 || uid.length < 1 || email.length < 1 || role.length < 1) {

        // goto login page
        if (tmsdata["action"] == "sess" && tmsdata["sub_action"] == "login") {
            return 0;
        }

        // force login
        if (errcode == 0) {
            errcode = 1001;
            console.log("login: errcode switch from 0 to 1001");
        } else {
            console.log("login: current errcode: " + errcode);
        }

        if (msg == null) {
            msg = "Please login ... ";
        }
        setMessageBar(msg, "red");
        setLoginMessage(msg, "red");

        $("#logoutHeadID").css("display", "none");
        $('#logoutHeadID').hide();

        $("#loginHeadID").css("display", "none");
        $('#loginHeadID').hide();

        $("#LoginPageLayerID").css("display", "flex");
        $("#LoginPageLayerID").show();

        return errcode;
    }

    // login ok

    $("#logoutHeadID").css("display", "flex");
    $('#logoutHeadID').show();


    $("#loginHeadID").css("display", "none");
    $('#loginHeadID').hide();

    return 0;

}

/**
 * logout
 */
function apiLogout() {

    setMessageBar("Logout ...", "yellow");

    $.get("api.php?act=sess&subact=logout", function (tmsdata, status) {
        check_session(tmsdata, "previous account Logout successfully.");
    });
}

/**
 * getjoblist call api for job list and redraw UI
 * @param msg
 */
function getjoblist(msg) {

    setMessageBar("Loading job list ...", "yellow");

    $.get("api.php?act=joblist", function (tmsdata, status) {

        if (check_session(tmsdata, "Please login ...") !== 0) {
            return;
        }

        var errcode = tmsdata["errcode"];
        var errmsg = tmsdata["errmsg"];

        if (errcode != 0) {
            setMessageBar(errmsg, "red");
            return;
        } else {
            if (msg == null) {
                setMessageBar(errmsg, "green");
            } else {
                setMessageBar(msg, "green");
            }
        }

        var rawdata = tmsdata["data"];

        var rawList = rawdata["userlist"];

        if (Array.isArray(rawList) === false) {
            setMessageBar("invalid data returned from api, user list not found", "red");
            return;
        }

        if (rawList.length === 0) {
            setMessageBar("user list is empty", "yellow");
        }

        // overwrite existed list
        uidList = [];
        userInfoList = new Map();

        for (var i = 0; i < rawList.length; i++) {
            var uid = rawList[i].user_id;
            uidList.push(uid);
            // convert joblist array to map
            var curUser = rawList[i];
            var userJobArray = rawList[i].joblist;
            curUser.joblist = new Map();
            for (var j = 0; j < userJobArray.length; j++) {
                var aJob = setupJob(userJobArray[j]);
                var jobId = aJob.job_id;
                curUser.joblist.set(jobId, aJob);
            }
            userInfoList.set(uid, curUser);
        }

        uidList.sort();

        drawJobMatrix();

    });
}

// setup job slots
function setupJob(aJob) {
    var uid = aJob.user_id;
    if (uid === undefined) {
        console.error("invalid job: "+aJob);
        return aJob;
    }
    if (uid == 0) {
        aJob.job_status = "unassigned";
        return aJob;
    }

    //

    aJob.start_column = getStartCol(aJob.start_time);

    aJob.finish_column = getFinishCol(aJob.duration, aJob.start_column);

    return aJob;
}

function syncLeftRightHeight() {
    // sync height of rightBlockID and leftBlockID
    var leftHeight = $("#leftBlockID").height();
    var rightHeight = $("#rightBlockID").height();
    if (leftHeight > rightHeight) {
        $("#rightBlockID").height(leftHeight);
    }else if(rightHeight > leftHeight){
        $("#leftBlockID").height(rightHeight);
    }
}

/**
 * update job's user_id & job_status
 * @param event
 */
var updateRequest;

var updateRequestDone = true;

// https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitUpdateRequest(delay) {
    if (updateRequestDone === true) {
        $("#LoadingLayerID").hide();
        return;
    }
    console.log('Show loading gif ...');
    $("#LoadingLayerID").show();
    for (var ts = 0; ts < 20; ts++) {
        if (updateRequestDone === true) {
            break;
        }
        console.log('wait for ' + delay + 'ms ...');
        await sleep(delay);
    }
    console.log('Hide loading gif ...');
    $("#LoadingLayerID").hide();
    return;
}

function updateJob(postData, wait) {

    if (updateRequest) {
        if (wait !== undefined) {
            // wait for previous request to finish, this will block the whole page
            waitUpdateRequest(wait);
        }
        // Abort any pending updateRequest
        updateRequest.abort();
    }

    updateRequestDone = false;

    var postJSON = { data: postData };

    setMessageBar("updating job ...", "yellow");

    // Fire off the newJobRequest to /form.php
    updateRequest = $.ajax({
        url: "api.php?act=updatejob",
        type: "post",
        data: postJSON
    });

    // Callback handler that will be called on success
    updateRequest.done(function (tmsdata, textStatus, jqXHR) {

        var errcode = tmsdata["errcode"];
        var errmsg = tmsdata["errmsg"];
        console.log(errmsg);

        if (check_session(tmsdata) !== 0) {
            return;
        }

        // TODO: check errcode

        if (errcode == 0) {
            setMessageBar(errmsg, "green");
        } else {
            setMessageBar(errmsg, "red");
        }

        return;
    });

    // Callback handler that will be called on failure
    updateRequest.fail(function (jqXHR, textStatus, errorThrown) {
        // Log the error to the console

        setMessageBar("update job info failed: " + textStatus + ", " + errorThrown, "red");

        console.log(
            "The following error occurred when login: " +
            textStatus, errorThrown
        );
    });

    // Callback handler that will be called regardless if the updateRequest failed or succeeded
    updateRequest.always(function () {
        updateRequestDone = true;
    });

}

/**
 * get start column by current job
 * @param curJob
 * @param start_col
 * @returns {*}
 */
function getStartCol(start_time) {

    // for debug: force to today
    var start_time_parts = start_time.split(' ');

    start_time = selDate + " " + start_time_parts[1];

    // "17-10-2018 01:00"
    var jobDateObj = dateTimeObject(start_time, false)

    // "2018-10-17 01:00"
    // var jobDateObj = dateTimeObject(start_time, true)

    if (jobDateObj == null) {
        console.error("job#" + uid + ", invalid start_time format: " + start_time);
        // continue;
        return -1;
    }

    var jobTs = jobDateObj.getTime();

    //job start_time - 01:00, get div start point
    var tsOffset = jobTs - selTs;

    // 9:00 - 8:00 = 1 h, 1h / 30mins
    var floatCol = tsOffset / stepTs;

    //get real start start_column
    var start_col = Math.ceil(floatCol);

    return start_col;
}

/**
 * get finish column by current job and start_column
 * @param curJob
 * @param start_col
 * @returns {*}
 */
function getFinishCol(duration, start_col) {

    //job time box
    var durationPos = duration * 60 * 1000 / stepTs;

    var finish_col = Math.ceil(durationPos) + Number(start_col);

    return finish_col;
}

/**
 * get current div's user id, column, job_id
 * @param curDivId
 */
function getIdInfos(curDivId) {

    var divIDinfo = curDivId.split('_');
    return divIDinfo;

}


/**
 * get job start_time after drag and drop
 * @param start_col
 * @returns {string}
 */
function getNewStartTime(start_col) {

    /**
     * 1. use start_col * 30mins get start_time
     * 2. use milliseconds get 24h
     * 3. merge today + start_time = real start_time
     * 4. return date obj
     * @type {number}
     */

    // debug: force start time to selected day
    var startTs = selTs + (start_col * stepTs);

    var newJobDateTime = new Date(startTs);
    var month = '' + (newJobDateTime.getMonth() + 1);
    var day = '' + newJobDateTime.getDate();
    var year = '' + newJobDateTime.getFullYear();
    var hours = '' + newJobDateTime.getHours();
    var minutes = '' + newJobDateTime.getMinutes();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    if (hours.length < 2) hours = '0' + hours;
    if (minutes.length < 2) minutes = '0' + minutes;

    return [year, month, day].join('-') + " " + hours + ":" + minutes + "." + newJobDateTime.getSeconds();
}
