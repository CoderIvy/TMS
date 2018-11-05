/* jshint browser: true */
/* global window: false */

// need for jslint, to allow the browser globals available
// https://stackoverflow.com/questions/1853473/should-i-worry-about-window-is-not-defined-jslint-strict-mode-error

"use strict";

/**
 * for unassigned jobs row
 */

$(document).ready(function () {
    
    $("#SchedDatePicker").datepicker('setDate', 'today').datepicker({ dateFormat: 'dd-mm-yy' }).on('changeDate', function (event) {
        $(this).datepicker('hide');
    });

    $("#logoutID").click(function () {
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
        //TODO it comment for debug
        // reloadCurrentPage();
    });

    updateSelectedDate();

    syncLeftRightHeight();

    //
    getjoblist("Welcome to TMS !!!");

});
