/* jshint browser: true */
/* global window: false */

// need for jslint, to allow the browser globals available
// https://stackoverflow.com/questions/1853473/should-i-worry-about-window-is-not-defined-jslint-strict-mode-error

"use strict";

// global var for job filter
var jobStatusFilter = new Map();


// globals
var LoginMessageText = "";
var HintMessageText = "";

// global var for joblist
var userInfoList = new Map();
var uidList = [];
var selDate = "27-10-2018 01:00";
var selTime = "01:00";

var selTs = 0;

// 30 minutes in milliseconds
var stepTs = 30 * 60 * 1000;

var noCacheTs = new Date();

// day matrix
var maxDayCol = 11;

function updateSelectedDate() {

    var obj = dateTimeObject($("#SchedDatePicker").val() + " " + selTime);

    selDate = dateTimeObjectToStringDate(obj);

    /** Gets the time value in milliseconds. */
    selTs = obj.getTime();
}

function dateTimeObjectToStringFull(d) {
    var s = ("0" + d.getDate()).slice(-2) + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" +
        d.getFullYear() + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);

    return s;
}

function dateTimeObjectToStringDate(d) {
    var s = ("0" + d.getDate()).slice(-2) + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + d.getFullYear();

    return s;
}

// draw jobs matrix
function drawDayViewJobMatrix() {

    //draw scheduled joblist box
    drawDayTableTitle();

    // get current selected date time
    updateSelectedDate();

    // "17-10-2018 01:00"
    var selDateObj = dateTimeObject(selDate + " " + selTime);

    if (selDateObj == null) {
        return;
    }

    // global uidList sort by uid
    uidList.sort();

    var count = 0;

    // draw unassigned jobs
    count += drawByUID(0);

    for (const uid of uidList) {

        if (uid == 0) {
            continue;
        }

        count += drawByUID(uid);

    }

    console.log("draw " + count + " job list done for " + getFunName());
}

/** assign job to uid
 * @param aJob
 * @param dstUid
 * @returns {boolean}
 */
function assignToUid(aJob, dstUid) {

    var srcUid = Number(aJob.user_id);
    if (srcUid == undefined) {
        console.error("invalid source job(user_id) for assignToUid(" + uid + "): " + aJob);
        return false;
    }
    dstUid = Number(dstUid);
    if (srcUid == dstUid) {
        console.log("dstUid is the same for assignToUid(" + dstUid + "): " + aJob);
        return true;
    }

    var srcUser = userInfoList.get(srcUid);
    if (srcUser == undefined) {
        console.error("source user not found(" + srcUid + ") for assignToUid(" + dstUid + "): " + aJob);
        return false;
    }

    var srcJobId = Number(aJob.job_id);
    if (srcJobId == undefined) {
        console.error("invalid source job(job_id) for assignToUid(" + dstUid + "): " + aJob);
        return false;
    }

    var dstUser = userInfoList.get(dstUid);
    if (dstUser == undefined) {
        console.error("dest user not found(" + dstUid + ") for assignToUid(" + dstUid + "): " + aJob);
        return false;
    }

    // TODO: update slot setting

    srcUser.joblist.delete(srcJobId);

    userInfoList.set(srcUid, srcUser);

    aJob.user_id = dstUid;

    if (dstUid == 0) {
        aJob.job_status = "unassigned";
    }
    if (srcUid == 0 && dstUid != 0) {
        aJob.job_status = "assigned";
    }

    aJob = setupJob(aJob);

    dstUser.joblist.set(srcJobId, aJob)

    userInfoList.set(dstUid, dstUser);

    return true;
}

/** draw jobs by uid
 * @param uid
 * @returns {number}
 */
function drawByUID(uid) {

    uid = Number(uid);

    var count = 0;

    // unassigned job's user id = 0

    var curUser = userInfoList.get(uid);
    if (curUser == undefined) {
        setMessageBar("user not found(" + uid + ") for drawByUID(" + uid + ")", "red");
        return count;
    }

    var jobCount = getJobCount(uid);

    if (uid == 0) {

        $('#unassignedList').empty();

        var divID = 'unassigned_' + 0 + '_' + 0 + '_' + 0;
        var eventHandleText = ` " draggable="false" ondragstart="return false;" ondragover="allowDrop(event);" style="background-color: #effce9;" ondrop="unassignedDrop(event)" `;
        var htmlTitleText = "Drop here to be unassigned";
        var divHtml = `<div title="` + htmlTitleText + eventHandleText + ` class="unassignedJob" id="` + divID + `">
                            <div `+ eventHandleText + `class="unassignedJobStatus" id="` + 'unassigned1_' + 0 + '_' + 0 + '_' + 0 + `">` + "Drop here" + `</div>
                            <div `+ eventHandleText + `class="unassignedJobTitle" id="` + 'unassigned2_' + 0 + '_' + 0 + '_' + 0 + `">` + "to unassigned" + `</div>
                            <div `+ eventHandleText + `class="unassignedJobDetail" id="` + 'unassigned3_' + 0 + '_' + 0 + '_' + 0 + `">` + "a scheduled job" + `</div>
                        </div>`;

        $('#unassignedList').append(divHtml);

        for (const jobId of curUser.joblist.keys()) {
            count += 1;
            var aJob = curUser.joblist.get(jobId);
            var divID = 'pos_' + uid + '_' + 0 + '_' + jobId;
            var htmlTitleText = aJob.job_status + ", " + aJob.job_title + ", " + aJob.detail;
            var divHtml = `<div title="` + htmlTitleText + `" draggable="true" ondragstart="Unassigned_drag(event)" class="unassignedJob" id="` + divID + `">
                            <div class="unassignedJobStatus">` + aJob.job_status + `</div>
                            <div class="unassignedJobTitle">` + aJob.job_title + `</div>
                            <div class="unassignedJobDetail">` + aJob.detail + `</div>
                        </div>`;
            $('#unassignedList').append(divHtml);
        }
        return count;
    }

    var conflictedJobsArray = [];

    var userLineID = "line_" + uid;

    // remove jobs from old line first
    $("#" + userLineID).empty();

    // append all jobs of this user
    var curUsername = curUser.first_name + ' ' + curUser.last_name;

    // user profile
    var lineTitleID = "line_title_" + uid;

    drawUserProfile(lineTitleID, userLineID, curUsername, jobCount);

    // $("#" + userLineID).append(`
    //     <div class="viewUserTitle" id="`+ lineTitleID + `">
    //         <div class="viewUserTitleImg">
    //             <img src="image/profile.png" class="SchedAvatar">
    //         </div>
    //         <div class="viewUserTitleText">
    //             <div class="maxFlexBox" style="justify-content: flex-start;align-items: center;">
    //                 `+ curUsername + `
    //             </div>
    //             <div class="maxFlexBoxCount" style="justify-content: flex-start;align-items: center;">
    //             `+ jobCount + ` Jobs
    //             </div>
    //         </div>
    //         <div class="viewUserTitleDel">-</div>
    //     </div>`);

    // draw all slots in idle
    for (var col = 0; col <= maxDayCol; col++) {
        var cellID = 'pos_' + uid + '_' + col + '_0';
        $("#" + userLineID).append(`<div id="` + cellID + `" class="dayViewUserIdleBlock" draggable="false" ondragstart="return false;" ondragover="allowDrop(event);" ondrop="drop(event)">
            <!--<br />-->
            <!--&nbsp;-->
            </div>`);
    }

    if (jobCount === 0) {
        console.log("no job for uid: " + uid);
        return count;
    }

    // sort jobs by start time
    var startList = [];
    var jobMap = new Map();

    for (const aJob of curUser.joblist.values()) {

        var start_time = aJob['start_time'];

        // for debug: force to today
        var start_time_parts = start_time.split(' ');

        start_time = selDate + " " + start_time_parts[1];

        var startTs = dateTimeTs(start_time, false);

        // for db time

        if (startTs == 0) {
            console.error("invalid job start time: " + start_time);
            conflictedJobsArray.push(aJob);
            continue;
        }

        if (jobMap.has(startTs)) {
            console.error("job start time conflicted: " + aJob.job_id + ", " + start_time);
            conflictedJobsArray.push(aJob);
            continue;
        }

        startList.push(startTs);
        jobMap.set(startTs, aJob);

    }

    startList.sort();

    // time slots
    var last_col = 0;
    var start_colum = 0;
    var end_colum = 0;
    var preJobId = 0;


    var fontColor = random_rgba();
    var randomColor = getRandomColor(fontColor);

    for (const startTs of startList) {

        var aJob = jobMap.get(startTs);

        var jobId = aJob.job_id;

        // apply filter
        if (jobStatusFilter.size > 0) {
            var curStatus = aJob.job_status.toUpperCase();
            if (jobStatusFilter.has("ALL") === false && jobStatusFilter.has(curStatus) === false) {
                continue;
            }
        }

        var start_time = aJob.start_time;

        // TODO: remove debug
        // for debug: force to today
        var start_time_parts = start_time.split(' ');

        start_colum = aJob.start_colum;

        end_colum = aJob.end_colum;

        if (start_colum < last_col) {
            // job time overlap
            console.error("job time overlap(" + uid + "): " + preJobId + ", " + jobId);
            console.log(curUser.joblist.get(preJobId));
            console.log(curUser.joblist.get(jobId));
            conflictedJobsArray.push(aJob);
            continue;
        }
        if (start_colum > maxDayCol) {
            // job time overlap
            console.error("job start time out of range(" + uid + ", " + start_colum + " > " + maxDayCol + "): " + jobId);
            console.log(curUser.joblist.get(jobId));
            conflictedJobsArray.push(aJob);
            continue;
        }
        if (end_colum > maxDayCol) {
            // job time overlap
            console.error("job end time out of range(" + uid + ", " + end_colum + " > " + maxDayCol + "): " + jobId);
            console.log(curUser.joblist.get(jobId));
            conflictedJobsArray.push(aJob);
            continue;
        }
        last_col = end_colum;
        preJobId = jobId;

        // job slot

        var divHtml = start_time_parts[1] + '<br />' + aJob.job_title;


        for (var col = end_colum; col >= start_colum; col--) {

            // get existed idle slot

            var idleCellID = 'pos_' + uid + '_' + col + '_0';

            if (col > maxDayCol) {
                console.error("slot skipped, job time out of range(" + uid + ", " + col + " > " + maxDayCol + "): " + htmlTitle);
                continue;
            }

            var checkExist = $("#" + idleCellID);

            checkExist.css('background-color', "red");

            if (checkExist === undefined || checkExist.length <= 0) {
                console.error("idle div no-exist: " + idleCellID);
                continue;
            }

            var cellID = 'pos_' + uid + '_' + col + '_' + jobId;

            // divHtml = jobId;
            var htmlTitle = cellID + ", " + aJob.duration + ", " + start_time;


            var firstDivHtml = 'background-color:' + randomColor + '; color:' + fontColor + '; border-left: 3px solid ' + fontColor;
            var otherDivHtml = 'background-color:' + randomColor;

            //job div box\
            if (col === start_colum) {

                // job info
                $('#' + idleCellID).replaceWith(`<div title="` + htmlTitle + `" id="` + cellID + `" class="dayViewUserJobFirstBlock" style="` + firstDivHtml + `" draggable="true" ondrop="return false;" ondragstart="drag(event)">
                `+ divHtml + `</div>`);

                count += 1;

                console.log("job: " + htmlTitle)

            } else {
                // duration slots
                $('#' + idleCellID).replaceWith(`<div  title="` + htmlTitle + `" id="` + cellID + `" class="dayViewUserJobBlock" style="` + otherDivHtml + `" draggable="true" ondragover="allowDrop(event);" ondrop="drop(event)" ondragstart="drag(event)">
                <br />
                &nbsp;
                </div>`);
            }
        }
    }

    for (var aJob of conflictedJobsArray) {
        assignToUid(aJob, 0);

        // update jobs in db

        var updateInfo = { "job_id": aJob.job_id, "user_id": aJob.user_id, "job_status": aJob.job_status, "start_time": aJob.start_time };

        updateJob(updateInfo, 2000);

    }

    if (conflictedJobsArray.length > 0 && uid != 0) {
        drawByUID(0);
    }

    return count;
}

/**
 * draw scheduled job list title for day view
 */
function drawDayTableTitle() {
    // clear before renew
    $('#unassignedList > div').remove();

    $('#dayViewLayerID').empty();

    // time title
    $('#dayViewLayerID').append(`
    <div class="dayViewHead" id="dayViewHeadID">
        <div class="viewHeadTitle">Assigned To</div>
        <div class="viewHeadTitle">1:00am</div>
        <div class="viewHeadTitle">2:00am</div>
        <div class="viewHeadTitle">3:00am</div>
        <div class="viewHeadTitle">4:00am</div>
        <div class="viewHeadTitle">5:00am</div>
        <div class="viewHeadTitle">6:00am</div>
    </div>`);

    // user lines box
    $('#dayViewLayerID').append(`
    <div class="viewLines" id="dayViewLinesID">
    </div>`);

    // append all line for users
    for (const uid of uidList) {

        if (uid == 0) {
            continue;
        }

        var userLineID = "line_" + uid;

        $("#dayViewLinesID").append(`<div class="viewOneLine" id="` + userLineID + `"></div>`);

    }

    syncLeftRightHeight();
}

/**
 * get current div's user id, column, job_id
 * @param curDivId
 */
function getIdInfos(curDivId) {

    var divIDinfo = curDivId.split('_');
    return divIDinfo;

}

// reset drag drop state
function dragDropReset(destDivId, resetSrc) {
    dragDropDstId = "";
    $("#" + destDivId).css('cursor', "no-drop");
    dragDropAllowed = false;
    if (resetSrc === true) {
        dragDropSrcId = "";
        $("#" + destDivId).css('cursor', "auto");
    }
}



function allowDrop(event) {
    event.preventDefault();

    var destDivId = event.target.id;

    if (typeof (event.target) != "object") {
        console.log("invalid source object from drag");
        console.log(event);
        return;
    }

    if (dragDropLastDstId === destDivId) {
        // console.log("already done, drop check from " + dragDropSrcId + " to " + destDivId);
        return;
    }
    dragDropLastDstId = destDivId;

    if (dragDropSrcId == "") {
        console.log("invalid dragDropSrcId object from drag: " + dragDropSrcId);
        console.log(event);
        return;
    }
    var srcDivId = dragDropSrcId;
    console.log("drop check from " + dragDropSrcId + " to " + destDivId);

    // default to allow
    dragDropAllowed = true;
    $("#" + destDivId).css('cursor', "auto");

    var destDivInfo = getIdInfos(destDivId);

    var srcDivInfo = getIdInfos(srcDivId);

    var srcUid = Number(srcDivInfo[1]);

    var jobId = Number(srcDivInfo[3]);

    var dstUid = Number(destDivInfo[1]);

    if (dstUid === NaN || srcUid === NaN) {
        dragDropReset(destDivId, true);
        return;
    }

    if (dstUid === 0) {
        console.log("drag & drop allowed, dest div: " + destDivId);
        return;
    }

    //get dropping user job list
    var srcUser = userInfoList.get(srcUid);

    if (srcUser === undefined) {
        setMessageBar("source user not found for drag & drop from " + srcDivId + " to " + destDivId, "red");
        dragDropReset(destDivId, true);
        return;
    }

    //get dropping job detail
    var aJob = srcUser.joblist.get(jobId);

    if (aJob === undefined) {
        setMessageBar("job not found for drag & drop from " + srcDivId + " to " + destDivId, "red");
        dragDropReset(destDivId, true);
        return;
    }

    var dstUser = userInfoList.get(dstUid);
    if (dstUser == undefined) {
        setMessageBar("dest user not found for drag & drop from " + srcDivId + " to " + destDivId, "red");
        dragDropReset(destDivId, true);
        return false;
    }

    var start_column = destDivInfo[2];  //dest col number

    var end_column = getEndCol(aJob.duration, start_column);

    if (end_column > maxDayCol) {
        setMessageBar("end column conflict(" + end_column + " > maxDayCol " + maxDayCol + ") for drag & drop from " + srcDivId + " to " + destDivId, "red");
        dragDropReset(destDivId);
        return false;
    } else {
        setMessageBar("end column ok(" + end_column + " <=  maxDayCol " + maxDayCol + ") for drag & drop from " + srcDivId + " to " + destDivId, "green");
    }

    // check conflict
    // TODO: enable drop into same job duration 
    for (const dJob of dstUser.joblist.values()) {

        if (aJob.job_id === dJob.job_id) {
            continue;
        }

        if (start_column == dJob.start_colum) {
            setMessageBar("start column conflict(equal start) for drag & drop from " + srcDivId + " to " + destDivId, "red");
            console.log(aJob);
            console.log(dJob);
            console.log("start_column: " + start_column + ", dst " + dJob.job_id + ", " + dJob.start_colum);
            console.log("end_column: " + end_column + ", dst " + dJob.job_id + ", " + dJob.start_colum);
            dragDropReset(destDivId);
            return false;
        }
        if (start_column == dJob.end_colum) {
            setMessageBar("start column conflict(equal end) for drag & drop from " + srcDivId + " to " + destDivId, "red");
            console.log(aJob);
            console.log(dJob);
            console.log("start_column: " + start_column + ", dst " + dJob.job_id + ", " + dJob.end_colum);
            console.log("end_column: " + end_column + ", dst " + dJob.job_id + ", " + dJob.end_colum);
            dragDropReset(destDivId);
            return false;
        }
        //
        if (start_column < dJob.start_colum) {
            if (end_column >= dJob.start_colum) {
                setMessageBar("start column conflict(no spaces for end) for drag & drop from " + srcDivId + " to " + destDivId, "red");
                console.log(aJob);
                console.log(dJob);
                console.log("start_column: " + start_column + ", dst " + dJob.job_id + ", " + dJob.start_colum);
                console.log("end_column: " + end_column + ", dst " + dJob.job_id + ", " + dJob.start_colum);
                dragDropReset(destDivId);
                return false;
            } else {
                continue;
            }
        }
        //
        if (start_column > dJob.end_colum) {
            continue;
        }
        if (start_column > dJob.start_colum && start_column < dJob.end_colum) {
            setMessageBar("start column conflict(mid) for drag & drop from " + srcDivId + " to " + destDivId, "red");
            console.log(aJob);
            console.log(dJob);
            console.log("start_column: " + start_column + ", dst " + dJob.job_id + ", " + dJob.start_colum);
            console.log("end_column: " + end_column + ", dst " + dJob.job_id + ", " + dJob.end_colum);
            dragDropReset(destDivId);
            return false;
        }
    }
    console.log("drag & drop allowed, dest div: " + destDivId);
    return false;
}

// global var for drag drop
var dragDropSrcId = "";
var dragDropDstId = "";
var dragDropAllowed = false;
var dragDropLastDstId = "";

function drag(event) {
    console.log("Assigned_drag div's id = " + event.target.id);
    event.dataTransfer.setData("text", event.target.id);
    dragDropSrcId = event.target.id;
    /**
    * 1. drag start set class style as scheduled div
    * 2. drag start clear the rest job duration boxes's style
    * 3. set user_id and column_id = 0. div_id = uid_colId_jobId
    * 4. set jobstatus = unsign
    */
    return;
}

function Unassigned_drag(event) {
    console.log("Unassigned_drag div's id = " + event.target.id);
    event.dataTransfer.setData("text", event.target.id);
    dragDropSrcId = event.target.id;
    /**
     * 1. drag start set class style as scheduled div
     * 2. drag start clear the rest job duration boxes's style
     * 3. set user_id and column_id = 0. div_id = uid_colId_jobId
     * 4. set jobstatus = unsign
    */
    return;
}

function drop(event, unassigned) {
    event.preventDefault();

    var destDivId = event.target.id;

    if (typeof (event.target) != "object" || destDivId == "") {
        console.log("invalid dest object from drag: " + destDivId);
        console.log(event);
        dragDropReset(destDivId);
        return;
    }

    if (dragDropAllowed !== true) {
        console.log("no allowed to drop into: " + destDivId);
        // reset stats after drop
        dragDropReset(destDivId, true);
        return;
    }

    console.log("drop into div: " + destDivId);

    var srcDivId = dragDropSrcId;
    if (srcDivId == "") {
        console.log("invalid src object from drag: " + srcDivId);
        console.log(event);
        // reset stats after drop
        dragDropReset(destDivId, true);
        return;
    }

    var destDivInfo = getIdInfos(destDivId);

    var srcDivInfo = getIdInfos(srcDivId);

    var srcUid = Number(srcDivInfo[1]);

    var jobId = Number(srcDivInfo[3]);

    var dstUid = Number(destDivInfo[1]);

    if (dstUid === NaN) {
        console.log("invalid dst id from drag: " + destDivId);
        // reset stats after drop
        dragDropReset(destDivId, true);
        return;
    }

    //get dropping user job list
    var srcUser = userInfoList.get(srcUid);

    //get dropping job detail
    var aJob = srcUser.joblist.get(jobId);

    if (aJob === undefined) {
        setMessageBar("job not found for drag & drop from " + srcDivId + " to " + destDivId, "red");
        // reset stats after drop
        dragDropReset(destDivId, true);
        return;
    }

    if (unassigned !== true) {
        var start_column = destDivInfo[2];  //dest col number

        var new_start_time = getNewStartTime(start_column);

        aJob.start_time = new_start_time;
        aJob = setupJob(aJob);
    } else {
        dstUid = 0;
    }

    assignToUid(aJob, dstUid);

    drawByUID(srcUid);

    drawByUID(dstUid);

    var updateInfo = { "job_id": aJob.job_id, "user_id": aJob.user_id, "job_status": aJob.job_status, "start_time": aJob.start_time };

    updateJob(updateInfo);

    // reset stats after drop
    dragDropReset(destDivId, true);

    return;
}

function unassignedDrop(event) {
    drop(event, true);
    return;
}


function random_rgba() {
    var o = Math.round, r = Math.random, s = 255;
    return 'rgba(' + o(r() * s) + ',' + o(r() * s) + ',' + o(r() * s) + ',' + 1 + ')';
}


function getRandomColor(srcColor) {

    //tokens = str.split(delimiter).slice(start)  //"rgba(127,190,125,0.5)"
    var colorParts = srcColor.split(',');
    var result = "";

    for (var i = 0; i < colorParts.length; i++) {

        if (i == colorParts.length - 1) {
            result += 0.3;
            result += ")";

        } else {

            result += colorParts[i];
            result += ",";
        }
    }
    return result;
}

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
    try {
        throw new Error();
    }
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
        var statusText = null;
        if (jobStatusFilter.size == 1) {

            $("#currentJobFilterID").text(selText.capitalize());

        } else {
            $("#currentJobFilterID").text("Multiple");
        }
    });
    console.log(jobStatusFilter);

    // re-draw
    drawDayViewJobMatrix();
}


/**
 * click different button show different pages
 * @param value
 */
function switchViews(value) {
    var dayPage = document.getElementById("dayViewLayerID");
    var weekPage = document.getElementById("weekViewLayerID");
    var monthPage = document.getElementById("monthViewLayerID");
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
            dayBtn.style.color = 'rgba(' + [52, 52, 52, 0.80].join(',') + ')';
            weekBtn.style.backgroundColor = "#43b75b";
            weekBtn.style.color = "white";
            monthBtn.style.backgroundColor = "#e6e6e6";
            monthBtn.style.color = 'rgba(' + [52, 52, 52, 0.80].join(',') + ')';

            break;
        case "3":
            dayPage.style.display = "none";
            weekPage.style.display = "none";
            monthPage.style.display = "flex";
            dayBtn.style.backgroundColor = "#e6e6e6";
            dayBtn.style.color = 'rgba(' + [52, 52, 52, 0.80].join(',') + ')';
            weekBtn.style.backgroundColor = "#e6e6e6";
            weekBtn.style.color = 'rgba(' + [52, 52, 52, 0.80].join(',') + ')';
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
            weekBtn.style.color = 'rgba(' + [52, 52, 52, 0.80].join(',') + ')';
            monthBtn.style.backgroundColor = "#e6e6e6";
            monthBtn.style.color = 'rgba(' + [52, 52, 52, 0.80].join(',') + ')';

            break;

    }

}


/**
 * pass a add new job require to newjob.php
 */
// Variable to hold request
var request;

$(function () {
    // Bind to the submit event of our form
    $('#btnNewJobOK').click(function (event) {
        // Prevent default posting of form - put here to work in case of errors
        event.preventDefault();

        // Abort any pending request
        if (request) {
            request.abort();
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

        // do not use JSON.stringify here convert to array
        var postJSON = { data: postdata };

        // Let's disable the inputs for the duration of the Ajax request.
        // Note: we disable elements AFTER the form data has been serialized.
        // Disabled form elements will not be serialized.
        $inputs.prop("disabled", true);

        setMessageBar("submit new job ...", "yellow");

        // Fire off the request to /form.php
        request = $.ajax({
            url: "api.php?act=newjob",
            type: "post",
            data: postJSON
        });

        // Callback handler that will be called on success
        request.done(function (tmsdata, textStatus, jqXHR) {
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
        request.fail(function (jqXHR, textStatus, errorThrown) {
            // Log the error to the console
            $("#NewJobPageLayerID").css("display", "none");
            $('#NewJobPageLayerID').hide();

            setMessageBar("submit new job failed: " + textStatus + ", " + errorThrown, "red");

            console.error(
                "The following error occurred: " +
                textStatus, errorThrown
            );
        });

        // Callback handler that will be called regardless if the request failed or succeeded
        request.always(function () {
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

    // Abort any pending request
    if (request) {
        request.abort();
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

    // Let's disable the inputs for the duration of the Ajax request.
    // Note: we disable elements AFTER the form data has been serialized.
    // Disabled form elements will not be serialized.
    $inputs.prop("disabled", true);

    setMessageBar("submit login ...", "yellow");

    // Fire off the request to /form.php
    request = $.ajax({
        url: "api.php?act=sess&subact=login",
        type: "post",
        data: postJSON
    });

    // Callback handler that will be called on success
    request.done(function (tmsdata, textStatus, jqXHR) {

        //
        if (check_session(tmsdata) !== 0) {
            return;
        }

        var errcode = tmsdata["errcode"];
        var errmsg = tmsdata["errmsg"];

        if (errcode != 0) {
            setMessageBar(errmsg, "red");
            setLoginMessage(errmsg, "red");

            showLoginPage(true);

        } else {

            showLoginPage(false);
            // redraw
            getjoblist(errmsg);
        }
        return;
    });

    // Callback handler that will be called on failure
    request.fail(function (jqXHR, textStatus, errorThrown) {
        // Log the error to the console
        showLoginPage(false);

        setMessageBar("submit login failed: " + textStatus + ", " + errorThrown, "red");

        console.log(
            "The following error occurred when login: " +
            textStatus, errorThrown
        );
    });

    // Callback handler that will be called regardless if the request failed or succeeded
    request.always(function () {
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

        showLoginPage(true);


        return errcode;
    }

    // login ok

    showLoginPage(false);

    return 0;

}

/**
 * logout
 */
function apiLogout() {

    setMessageBar("Logout ...", "yellow");

    noCacheTs = new Date();

    $.get("api.php?act=sess&subact=logout&noCacheTs=" + noCacheTs.getTime(), function (tmsdata, status) {
        check_session(tmsdata, "previous account Logout successfully.");
    });
}

/**
 * switch login page or job list page
 * @param showLogin
 */
function showLoginPage(showLogin) {

    if (showLogin == true) {
        $("#mainFlexBlockID").css("display", "none");
        $("#mainFlexBlockID").hide();
        $("#LoginPageLayerID").css("display", "flex");
        $("#LoginPageLayerID").show();

        $("#logoutHeadID").css("display", "none");
        $('#logoutHeadID').hide();

        $("#loginHeadID").css("display", "none");
        $('#loginHeadID').hide();

    } else {
        $("#LoginPageLayerID").css("display", "none");
        $("#LoginPageLayerID").hide();
        $("#mainFlexBlockID").css("display", "flex");
        $("#mainFlexBlockID").show();


        $("#logoutHeadID").css("display", "flex");
        $('#logoutHeadID').show();


        $("#loginHeadID").css("display", "none");
        $('#loginHeadID').hide();

    }
}

/**
 * getjoblist call api for job list and redraw UI
 * @param msg
 */
function getjoblist(msg) {

    setMessageBar("Loading job list ...", "yellow");
    
    noCacheTs = new Date();

    $.get("api.php?act=joblist&noCacheTs=" + noCacheTs.getTime(), function (tmsdata, status) {

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

        drawDayViewJobMatrix();
        drawWeekViewJobMatrix();
        // drawMonthViewJobMatrix();

    });
}

// setup job slots
function setupJob(aJob) {
    var uid = aJob.user_id;
    if (uid === undefined) {
        console.error("invalid job: " + aJob);
        return aJob;
    }
    if (uid == 0) {
        aJob.job_status = "unassigned";
        return aJob;
    }

    //

    aJob.start_colum = getStartCol(aJob.start_time);

    aJob.end_colum = getEndCol(aJob.duration, aJob.start_colum);

    return aJob;
}

function syncLeftRightHeight() {
    // sync height of rightBlockID and leftBlockID
    var leftHeight = $("#leftBlockID").height();
    var rightHeight = $("#rightBlockID").height();
    if (leftHeight > rightHeight) {
        $("#rightBlockID").height(leftHeight);
    } else if (rightHeight > leftHeight) {
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

    // Fire off the request to /form.php
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
 * @param start_column
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

    //get real start start_colum
    var start_column = Math.ceil(floatCol);

    return start_column;
}

/**
 * get end column by current job and start_colum
 * @param curJob
 * @param start_column
 * @returns {*}
 */
function getEndCol(duration, start_column) {

    //job time box
    var durationPos = duration * 60 * 1000 / stepTs;

    var end_column = Math.ceil(durationPos) + Number(start_column);

    return end_column - 1;
}

function getUserName(uid) {

    var curUser = getUser(uid);

    var userName =  curUser.first_name + ' ' + curUser.last_name;

    return userName;

}

function getJobCount(uid) {
    var curUser = getUser(uid);

    var jobCount = curUser.joblist.size;

    return jobCount;

}

function getUser(uid) {

    var curUser = userInfoList.get(uid);
    if (curUser == undefined) {
        setMessageBar("user not found(" + uid + ") for drawByUID(" + uid + ")", "red");
        return null;
    }
    return curUser;
}


function drawUserProfile(lineTitleID, userLineID, userName, jobCount) {

    $("#" + userLineID).append(`
        <div class="viewUserTitle" id="`+ lineTitleID + `">
            <div class="viewUserTitleImg">
                <img src="image/profile.png" class="SchedAvatar">
            </div>
            <div class="viewUserTitleText">
                <div class="maxFlexBox" style="justify-content: flex-start;align-items: center;">
                    `+ userName + `
                </div>
                <div class="maxFlexBoxCount" style="justify-content: flex-start;align-items: center;">
                `+ jobCount + ` Jobs
                </div>
            </div>
            <div class="viewUserTitleDel">-</div>
        </div>`);
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
 * @param start_column
 * @returns {string}
 */
function getNewStartTime(start_column) {

    /**
     * 1. use start_column * 30mins get start_time
     * 2. use milliseconds get 24h
     * 3. merge today + start_time = real start_time
     * 4. return date obj
     * @type {number}
     */

    // debug: force start time to selected day
    var startTs = selTs + (start_column * stepTs);

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

//----------for week view------------//

/**
 * draw scheduled job list title for day view
 */
function drawWeekTableTitle() {
    // clear before renew
    // $('#unassignedList > div').remove();

    $('#weekViewLayerID').empty();

    // time title
    $('#weekViewLayerID').append(`
    <div class="dayViewHead" id="weekViewHeadID">
                            <div class="viewHeadTitle">Assigned To</div>
                            <div class="viewHeadTitle">Monday</div>
                            <div class="viewHeadTitle">Tuesday</div>
                            <div class="viewHeadTitle">Wednesday</div>
                            <div class="viewHeadTitle">Thursday</div>
                            <div class="viewHeadTitle">Friday</div>
                            <div class="viewHeadTitle">Weekend</div>
                        </div>`);

    // user lines box
    $('#weekViewLayerID').append(`
    <div class="viewLines" id="weekViewLinesID">
    </div>`);

    //append all line for users
    for (const uid of uidList) {

        if (uid == 0) {
            continue;
        }

        var userLineID = "week_line_" + uid;

        $("#weekViewLayerID").append(`<div class="viewOneLine" id="` + userLineID + `"></div>`);

    }

    syncLeftRightHeight();
}

// draw jobs matrix
function drawWeekViewJobMatrix() {

    //draw scheduled joblist box
    drawWeekTableTitle();

    drawWeekTableItem();


    // get current selected date time
    // updateSelectedDate();

    // "17-10-2018 01:00"
    // var selDateObj = dateTimeObject(selDate + " " + selTime);

    // if (selDateObj == null) {
    //     return;
    // }

    // // global uidList sort by uid
    // uidList.sort();
    //
    // var count = 0;
    //
    // // draw unassigned jobs
    // count += drawByUID(0);
    //
    // for (const uid of uidList) {
    //
    //     if (uid == 0) {
    //         continue;
    //     }
    //
    //     count += drawByUID(uid);
    //
    // }
    //
    // console.log("draw " + count + " job list done for " + getFunName());
}

function drawWeekTableItem() {
    /*
    for (const jobId of curUser.joblist.keys()) {
            count += 1;
            var aJob = curUser.joblist.get(jobId);
            var divID = 'pos_' + uid + '_' + 0 + '_' + jobId;
            var htmlTitleText = aJob.job_status + ", " + aJob.job_title + ", " + aJob.detail;
            var divHtml = `<div title="` + htmlTitleText + `" draggable="true" ondragstart="Unassigned_drag(event)" class="unassignedJob" id="` + divID + `">
                            <div class="unassignedJobStatus">` + aJob.job_status + `</div>
                            <div class="unassignedJobTitle">` + aJob.job_title + `</div>
                            <div class="unassignedJobDetail">` + aJob.detail + `</div>
                        </div>`;
            $('#unassignedList').append(divHtml);
        }
    * */

    for (const curUid of uidList){
        // user profile
        var lineTitleID = "week_line_title_" + curUid;
        var weekUserLineID = "week_line_" + curUid;
        var maxWeekCol = 6;



        var jobCount = getJobCount(curUid);
        var userName =  getUserName(curUid);


        drawUserProfile(lineTitleID, weekUserLineID, userName, jobCount);
        // drawUserProfile(lineTitleID, weekUserLineID, curUserName, jobCount);


        /*
         <!--<div class="weekViewBox">-->
                                    <!--<div class="weekViewItem">&bull;&nbsp;&nbsp;Job 01 ~~~~~~~~~~~~~~~~~~~~~~</div>-->
                                    <!--<div class="weekViewItem">&bull;&nbsp;&nbsp;Job 02 ~~~~~~~~~~~~~~~~~~~~~~</div>-->
                                    <!--<div class="weekViewItem">&bull;&nbsp;&nbsp;Job 03 ~~~~~~~~~~~~~~~~~~~~~~</div>-->
                                    <!--<div class="weekViewItem">&bull;&nbsp;&nbsp;Job 04 ~~~~~~~~~~~~~~~~~~~~~~</div>-->
                                <!--</div>-->
        * */

        // draw all slots in idle
        for (var col = 0; col < maxWeekCol; col++) {

            //TODO draw job box first, append each day's job item
            var cellID = 'weekpos_' + curUid + '_' + col + '_0';
            $("#" + weekUserLineID).append(`<div id="` + cellID + `" class="weekViewBox">
                <!--<div class="weekViewItem">&bull;&nbsp;&nbsp;Job 01 ~~~~~~~~~~~~~~~~~~~~~~</div>-->
            </div>`);

            // $("#" + weekUserLineID).append(`<div id="` + cellID + `" class="weekViewBox">
            //     <div class="weekViewItem">&bull;&nbsp;&nbsp;Job 01 ~~~~~~~~~~~~~~~~~~~~~~</div>
            // </div>`);
        }

    }

}



//----------end of week view layout------------//


//----------for month view layout------------//

// draw jobs matrix
function drawMonthViewJobMatrix() {

}



//----------end of month view layout------------//
