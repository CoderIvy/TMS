/* jshint browser: true */
/* global window: false */

// need for jslint, to allow the browser globals available
// https://stackoverflow.com/questions/1853473/should-i-worry-about-window-is-not-defined-jslint-strict-mode-error

"use strict";

// globals
var LoginMessageText = "";
var HintMessageText = "";

/**
 * for datepicker
 */
$(function () {
    $("#SchedDatePicker").datepicker('setDate', 'today').datepicker({ dateFormat: 'dd-mm-yy' }).on('changeDate', function (event) {
        $(this).datepicker('hide');
    });

    // $("#SchedDatePicker").datepicker({
    //     buttonImage: '../images/hide.jpg',
    //     buttonImageOnly: true,
    //     changeMonth: true,
    //     changeYear: true,
    //     showOn: 'both',
    // });
});

// global var for joblist
var userInfoList = new Map();
var uidList = [];
var selDate = "27-10-2018 01:00";
var selTime = "01:00";

var selTs = 0;

// 30 minutes in milliseconds
var stepTs = 30 * 60 * 1000;

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
function drawJobMatrix() {

    //draw scheduled joblist box
    drawTableTitle();

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
        console.error("dstUid is the same for assignToUid(" + dstUid + "): " + aJob);
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

    var jobCount = curUser.joblist.size;

    if (uid == 0) {

        $('#unassignedList').empty();

        var divID = 'unassigned_' + 0 + '_' + 0 + '_' + 0;
        var htmlTitleText = "Drop here to be unassigned";
        var divHtml = `<div title="` + htmlTitleText + `" draggable="false" ondragstart="return false;" ondragover="allowDrop(event);" ondrop="unassignedDrop(event)" class="unassignedJob"  id="` + divID + `">
                            <div class="unassignedJobStatus">` + "Drop here" + `</div>
                            <div class="unassignedJobTitle">` + "to unassigned" + `</div>
                            <div class="unassignedJobDetail">` + "a scheduled job" + `</div>
                        </div>`;
        // disabled for moon
        // $('#unassignedList').append(divHtml);

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
    $("#" + userLineID).append(`
        <div class="dayViewUserTitle" id="`+ lineTitleID + `">
            <div class="dayViewUserTitleImg">
                <img src="image/profile.png" class="SchedAvatar">
            </div>
            <div class="dayViewUserTitleText">
                <div class="maxFlexBox" style="justify-content: flex-start;align-items: center;">
                    `+ curUsername + `
                </div>
                <div class="maxFlexBoxCount" style="justify-content: flex-start;align-items: center;">
                `+ jobCount + ` Jobs
                </div>
            </div>
            <div class="dayViewUserTitleDel">-</div>
        </div>`);

    var maxCol = 11;

    // draw all slots in idle
    for (var col = 0; col < maxCol; col++) {
        var cellID = 'pos_' + uid + '_' + col + '_0';
        $("#" + userLineID).append(`<div id="` + cellID + `" class="dayViewUserIdleBlock" draggable="false" ondragstart="return false;" ondragover="allowDrop(event);" ondrop="drop(event)">
            <br />
            &nbsp;
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
        // var startTs = dateTimeTs(start_time, true);

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
    var start_column = 0;
    var finish_column = 0;
    var preJobId = 0;


    // var randomColor = '#'+(Math.random()*0xFFFFFF<<0).toString(16);

    //randomColor = "rgba(127,190,125,0.5)"
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

        start_column = aJob.start_column;

        finish_column = aJob.finish_column;

        if (start_column < last_col) {
            // job time overlap
            console.error("job time overlap(" + uid + "): " + preJobId + ", " + jobId);
            console.log(curUser.joblist.get(preJobId));
            console.log(curUser.joblist.get(jobId));
            conflictedJobsArray.push(aJob);
            continue;
        }
        if (start_column > maxCol) {
            // job time overlap
            console.error("job time out of range(" + uid + ", " + start_column + " > " + maxCol + "): " + jobId);
            console.log(curUser.joblist.get(jobId));
            conflictedJobsArray.push(aJob);
            continue;
        }
        last_col = finish_column;
        preJobId = jobId;

        // job slot

        var divHtml = start_time_parts[1] + '<br />' + aJob.job_title;


        for (var col = finish_column - 1; col >= start_column; col--) {

            // get existed idle slot

            var idleCellID = 'pos_' + uid + '_' + col + '_0';

            if (col > maxCol) {
                console.error("slot skipped, job time out of range(" + uid + ", " + col + " > " + maxCol + "): " + htmlTitle);
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


            var firstDivHtml = 'background-color:'+randomColor + '; color:' + fontColor+ '; border-left: 3px solid ' + fontColor;
            var otherDivHtml = 'background-color:'+randomColor;

            /*border-right: 1px solid #e6e6e6;*/

            //job div box\
            if (col === start_column) {

                // job info
                $('#' + idleCellID).replaceWith(`<div title="` + htmlTitle + `" id="` + cellID + `" class="dayViewUserJobFirstBlock" style="` + firstDivHtml + `" draggable="true" ondrop="return false;" ondragstart="drag(event)">
                `+ divHtml + `</div>`);

                count += 1;

                console.log("job: " + htmlTitle)

            } else {
                // duration slots
                $('#' + idleCellID).replaceWith(`<div  title="` + htmlTitle + `" id="` + cellID + `" class="dayViewUserJobBlock" style="` + otherDivHtml + `" draggable="true" ondrop="return false;" ondragstart="drag(event)">
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
 * for unassigned jobs row
 */

$(document).ready(function () {

    $("#logoutImgID").click(function () {
        apiLogout();
    });

    //TODO set start_time - duration < 18:00
    $("#newJobBtn").click(function () {
        $("#NewJobPageLayerID").css("display", "block");
        $("#NewJobPageLayerID").show();
    });

    // default to hide, show after login
    $("#logoutHeadID").css("display", "none");
    $('#logoutHeadID').hide();

    /**
     * cancel click when adding a new job
     */
    $('#btnNewJobCancel').click(function (event) {
        $("#NewJobPageLayerID").css("display", "none");
        $('#NewJobPageLayerID').hide();
    });

    //

    $("#btnDoLogin").click(function (event) {
        postLogin(event);
    });

    $("#jobStatusFilterID").change(function (event) {
        setJobStatusFilter(event);
    });

    $("#LoadingLayerID").hide();

    $(window).resize(function () {
        // sync
        reloadCurrentPage();
    });

    updateSelectedDate();

    syncLeftRightHeight();

    //
    getjoblist("Welcome to TMS !!!");

});

/**
 * draw scheduled job list title
 */
function drawTableTitle() {
    // clear before renew
    $('#unassignedList > div').remove();

    $('#dayViewLayerID').empty();

    // time title
    $('#dayViewLayerID').append(`
    <div class="dayViewHead" id="dayViewHeadID">
        <div class="dayViewHeadTitle">Assigned To</div>
        <div class="dayViewHeadTitle">1:00am</div>
        <div class="dayViewHeadTitle">2:00am</div>
        <div class="dayViewHeadTitle">3:00am</div>
        <div class="dayViewHeadTitle">4:00am</div>
        <div class="dayViewHeadTitle">5:00am</div>
        <div class="dayViewHeadTitle">6:00am</div>
    </div>`);

    // user lines box
    $('#dayViewLayerID').append(`
    <div class="dayViewLines" id="dayViewLinesID">
    </div>`);

    // append all line for users
    for (const uid of uidList) {

        if (uid == 0) {
            continue;
        }

        var userLineID = "line_" + uid;

        $("#dayViewLinesID").append(`<div class="dayViewOneLine" id="` + userLineID + `"></div>`);

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
function dragDropReset(destDivId) {
    dragDropSrcId = "";
    dragDropDstId = "";
    $("#" + destDivId).css('cursor', "auto");
}

/**
 * drag and drop
 */

function noAllowDrop(event) {
    event.preventDefault();

    var destDivId = event.target.id;

    if (typeof (event.target) != "object") {
        console.log("invalid source object from drag");
        console.log(event);
        return;
    }

    $("#" + destDivId).css('cursor', "no-drop");
    console.log("noAllowDrop: " + destDivId);
}

function noAllowDropDone(event) {
    event.preventDefault();

    var destDivId = event.target.id;

    if (typeof (event.target) != "object") {
        console.log("invalid source object from drag");
        console.log(event);
        return;
    }

    $("#" + destDivId).css('cursor', "auto");
    console.log("noAllowDropDone: " + destDivId);
}

function leaveDrop(event) {
    event.preventDefault();

    var destDivId = event.target.id;

    if (typeof (event.target) != "object") {
        console.log("invalid source object from drag");
        console.log(event);
        return;
    }

    $("#" + destDivId).css('cursor', "auto");
    console.log("leaveDrop: " + destDivId);
}

function allowDrop(event) {
    event.preventDefault();

    var destDivId = event.target.id;

    if (typeof (event.target) != "object") {
        console.log("invalid source object from drag");
        console.log(event);
        return;
    }

    if (dragDropSrcId == "") {
        console.log("invalid dragDropSrcId object from drag: " + dragDropSrcId);
        console.log(event);
        return;
    }
    var srcDivId = dragDropSrcId;
    console.log("drop check for src div: " + dragDropSrcId);
    console.log("drop check for dest div: " + destDivId);

    $("#" + destDivId).css('cursor', "no-drop");

    var destDivInfo = getIdInfos(destDivId);

    var srcDivInfo = getIdInfos(srcDivId);

    var srcUid = Number(srcDivInfo[1]);

    var jobId = Number(srcDivInfo[3]);

    var dstUid = Number(destDivInfo[1]);

    if (dstUid === NaN || srcUid === NaN) {
        dragDropReset(destDivId);
        return;
    }

    //get dropping user job list
    var srcUser = userInfoList.get(srcUid);

    if (srcUser === undefined) {
        setMessageBar("source user not found for drag & drop from " + srcDivId + " to " + destDivId, "red");
        dragDropReset(destDivId);
        return;
    }

    //get dropping job detail
    var aJob = srcUser.joblist.get(jobId);

    if (aJob === undefined) {
        setMessageBar("job not found for drag & drop from " + srcDivId + " to " + destDivId, "red");
        dragDropReset(destDivId);
        return;
    }

    var dstUser = userInfoList.get(dstUid);
    if (dstUser == undefined) {
        setMessageBar("dest user not found for drag & drop from " + srcDivId + " to " + destDivId, "red");
        dragDropReset(destDivId);
        return false;
    }

    var start_col = destDivInfo[2];  //dest col number

    var finish_col = getFinishCol(aJob.duration, start_col);

    for (const dJob of dstUser.joblist.values()) {
        if (start_col >= dJob.start_column && finish_col <= dJob.start_column) {
            setMessageBar("start column conflict for drag & drop from " + srcDivId + " to " + destDivId, "red");
            console.log(aJob);
            console.log(dJob);
            dragDropReset(destDivId);
            return false;
        }
        if (start_col <= dJob.finish_column && finish_col >= dJob.finish_column) {
            setMessageBar("finish column conflict for drag & drop from " + srcDivId + " to " + destDivId, "red");
            console.log(aJob);
            console.log(dJob);
            dragDropReset(destDivId);
            return false;
        }
    }
    $("#" + destDivId).css('cursor', "auto");
    console.log("drop check pass dest div: " + destDivId);
    return false;
}

// global var for drag drop
var dragDropSrcId = "";
var dragDropDstId = "";

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

    // var srcDivId = event.dataTransfer.getData("text");

    var srcDivId = dragDropSrcId;
    if (srcDivId == "") {
        console.log("invalid src object from drag: " + srcDivId);
        console.log(event);
        return;
    }
    if (typeof (event.target) != "object" || destDivId == "") {
        console.log("invalid dest object from drag: " + destDivId);
        console.log(event);
        dragDropReset(destDivId);
        return;
    }

    console.log("drop into div: " + destDivId);

    var destDivInfo = getIdInfos(destDivId);

    var srcDivInfo = getIdInfos(srcDivId);

    var srcUid = Number(srcDivInfo[1]);

    var jobId = Number(srcDivInfo[3]);

    var dstUid = Number(destDivInfo[1]);

    if (dstUid === NaN) {
        dragDropReset(destDivId);
        return;
    }

    //get dropping user job list
    var srcUser = userInfoList.get(srcUid);

    //get dropping job detail
    var aJob = srcUser.joblist.get(jobId);

    if (aJob === undefined) {
        setMessageBar("job not found for drag & drop from " + srcDivId + " to " + destDivId, "red");
        dragDropReset(destDivId);
        return;
    }

    if (unassigned !== true) {
        var start_col = destDivInfo[2];  //dest col number

        var new_start_time = getNewStartTime(start_col);

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

    dragDropReset(destDivId);
    return;
}

function unassignedDrop(event) {
    drop(event, true);
    return;
}


function random_rgba() {
    var o = Math.round, r = Math.random, s = 255;
    return 'rgba(' + o(r()*s) + ',' + o(r()*s) + ',' + o(r()*s) + ',' + 1 + ')';
}


function getRandomColor(srcColor) {

    //tokens = str.split(delimiter).slice(start)  //"rgba(127,190,125,0.5)"
    var colorParts = srcColor.split(',');
    var result = "";

    for (var i = 0; i < colorParts.length; i++){

        if (i == colorParts.length - 1){
            result += 0.3;
            result += ")";

        }else {

            result += colorParts[i];
            result += ",";
        }
    }
    return result;
}