$(document).ready(function () {
    Date.prototype.stdTimezoneOffset = function() {
        var jan = new Date(this.getFullYear(), 0, 1);
        var jul = new Date(this.getFullYear(), 6, 1);
        return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
    }
    Date.prototype.dst = function() {
        return this.getTimezoneOffset() < this.stdTimezoneOffset();
    }



    var codeLineObj = {};
    var dibsdate = new Date();

    var closetime = new Date(dibsdate.getFullYear(),dibsdate.getMonth(),dibsdate.getDate(),20,30,0,0);
    var codelinestart ="<TABLE BORDER=1 cellspacing=0 cellpadding=5><TFOOT>*Reservations are held for 15 minutes after start time.</TFOOT><TR><TD>. </TD>";

    for(var i = 9; i < 20.5; i = i + 0.5){
            var string = Math.floor(i).toString();
            var styleStringB = "<TR><TD style=border:0px align=right>";
            var styleStringE = "</TD>";
            var string2 = Math.floor(i + 1).toString();
            if(i < 11.5) {
                if(Number.isInteger(i)){
                    codeLineObj[i] = styleStringB + string + ":00am-" + string + ":30am" + styleStringE;
                }
                else{
                    codeLineObj[i] = styleStringB + string + ":30am-" + string2 + ":00am" + styleStringE;
                }
            }
            else if(11.5 <= i && i < 12.5){
                if(Number.isInteger(i)){
                    codeLineObj[i] = styleStringB+ string + ":00pm-" + string + ":30pm" + styleStringE;
                }
                else{
                    codeLineObj[i] = styleStringB + string + ":30am-" + string2 + ":00pm" + styleStringE;
                }
            }
            else if(i == 12.5){
                codeLineObj[i] = styleStringB + string + ":30pm-1:00pm" + styleStringE;
            }
            else{
                var temp = i - 12;
                var string1 = Math.floor(temp).toString();
                var string12 = Math.floor(temp + 1).toString();
                if(Number.isInteger(temp)){
                    codeLineObj[i] = styleStringB + string1 + ":00pm-" + string1 + ":30pm" + styleStringE;
                }
                else{
                    codeLineObj[i] = styleStringB + string1 + ":30pm-" + string12 + ":00pm" + styleStringE;
                }
            }
        }

    var codelineend = "</TABLE>";

    //start loop here
    var dayArray = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    var todayD = dibsdate.getDay();
    for(var dayGen = 0; dayGen < 6; dayGen++) {
        var theDay = (todayD + dayGen) % 7;

        var todaycheck = new Date();
        todaycheck.setDate(todaycheck.getDate() + dayGen);
        if (todaycheck.dst()) {
            var savingstime = "-05:00";
        }
        else {
            var savingstime = "-06:00";
        }
        var dibsdate = new Date();
        dibsdate.setDate(dibsdate.getDate() + dayGen);

        closetime = new Date(dibsdate.getFullYear(),dibsdate.getMonth(),dibsdate.getDate(),20,30,0,0);

        var myObject = {};

        for (var i = 9; i < 20.5; i = i + 0.5) {
            if (Number.isInteger(i)) {
                myObject[i] = new Date(dibsdate.getFullYear(), dibsdate.getMonth(), dibsdate.getDate(), i, 0, 0, 0);
            }
            else {
                myObject[i] = new Date(dibsdate.getFullYear(), dibsdate.getMonth(), dibsdate.getDate(), Math.floor(i), 30, 0, 0);
            }
        }


        var xmarker = "OPEN";
        var prexmarker = "";
        var postmarker = "";
        var dibsdate2 = dibsdate.toLocaleDateString();
        dibsdate2 = dibsdate2.replace("/", "-");
        dibsdate2 = dibsdate2.replace("/", "-");
        var dibsdateurl = "https://elmhurstmakerspace.evanced.info/dibsAPI/reservations/" + dibsdate2;
        var dibsdateurlnow = dibsdateurl + "/3";
        $.ajaxSetup({
            async: false
        });
        var colorcount = 1;
        var bookcolor = "DCDCDC";


        var xdibsdate = new Date(dibsdate.getFullYear(), dibsdate.getMonth(), dibsdate.getDate(), 9, 0, 0, 0);

        $.getJSON(dibsdateurlnow,
            function processData(jsonData) {
                sortJsonArrayByProperty(jsonData, 'attributes.StartTime');
                xdibsdate = new Date(dibsdate.getFullYear(), dibsdate.getMonth(), dibsdate.getDate(), 9, 0, 0, 0);

                codelinestart = codelinestart + "<TD align=center>" + dayArray[theDay] + "</TD>";
                var timedate;

                // Loop through each data block
                $.each(jsonData, function (object, objectData) {
                    var whichroom = objectData.RoomID;
                    prexmarker = '<A style="color: #459f9a;" HREF="https://elmhurstmakerspace.evanced.info/dibs?space=' + whichroom + '">';
                    postmarker = "</A>";
                    if (colorcount == 1) {
                        colorcount = 2;
                        bookcolor = "A9A9A9";
                    }
                    else {
                        colorcount = 1;
                        bookcolor = "DCDCDC";
                    }
                    xmarker = "OPEN";
                    var timestring = objectData.StartTime;
                    timedate = new Date(timestring + savingstime);
                    while (timedate - xdibsdate > 0) {
                        for (var i = 9; i < 20.5; i = i + 0.5) {
                            if (xdibsdate - myObject[i] == 0) {
                                codeLineObj[i] = codeLineObj[i] + "<TD align=center>" + prexmarker + xmarker + postmarker + "</TD>";
                            }
                        }
                        xdibsdate.setMinutes(xdibsdate.getMinutes() + 30);
                    }

                    xmarker = "<font size=-1>*Booked</font>";
                    prexmarker = "";
                    postmarker = "";
                    var timestring = objectData.EndTime;
                    timedate = new Date(timestring + savingstime);
                    while (timedate - xdibsdate > 0) {
                        for (var i = 9; i < 20.5; i = i + 0.5) {
                            if (xdibsdate - myObject[i] == 0) {
                                codeLineObj[i] = codeLineObj[i] + "<TD align=center style='border-width:0' BGCOLOR=" + bookcolor + ">" + prexmarker + xmarker + postmarker + "</TD>";
                                xmarker = "<font color=" + bookcolor + ">.</font>";
                            }
                        }
                        xdibsdate.setMinutes(xdibsdate.getMinutes() + 30);
                    }
                });

                xmarker = "OPEN";
                prexmarker = '<A style="color: #459f9a;" HREF="https://elmhurstmakerspace.evanced.info/dibs?space=3">';
                postmarker = "</A>";
                while (closetime - xdibsdate > 0) {
                    for (var i = 9; i < 20.5; i = i + 0.5) {
                        if (xdibsdate - myObject[i] == 0) {
                            codeLineObj[i] = codeLineObj[i] + "<TD align=center>" + prexmarker + xmarker + postmarker + "</TD>";
                        }
                    }
                    xdibsdate.setMinutes(xdibsdate.getMinutes() + 30);
                }
            });

        }
    //end the loop here




    var fullcodeline = codelinestart;

        for(var i = 9; i < 20.5; i = i + .5){
            fullcodeline = fullcodeline + "</TR>" + codeLineObj[i];
        }

    fullcodeline = fullcodeline + "</TR>" + codelineend;
    $('#roomBlock1').append(fullcodeline);

    $.ajaxSetup({
        async: true
    });
});
