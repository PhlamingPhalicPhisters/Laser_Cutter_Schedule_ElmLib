/*
* Property of: Elmhurst Public Libray, Elmhurst, Illinois.
* Date: 2018-04-24.
* Author: George Nelson, ADS Staff.
* Purpose: This is a scheduling system built for the Elmhurst Public Library Makery Laser Cutter.
* */

$(document).ready(function () {
    Date.prototype.stdTimezoneOffset = function() { //function used to correctly set timezone
        var jan = new Date(this.getFullYear(), 0, 1);
        var jul = new Date(this.getFullYear(), 6, 1);
        return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
    }
    Date.prototype.dst = function() {//function used for comparing timezones
        return this.getTimezoneOffset() < this.stdTimezoneOffset();
    }

    var codeLineObj = {};   //This object is going to hold all of the lines for the final output table.
    var dibsdate = new Date();  //Starting date (today) used for the beginning of the loop and throughout the entire program

    var closetime = new Date(dibsdate.getFullYear(),dibsdate.getMonth(),dibsdate.getDate(),20,30,0,0);  //close time of the Makery (statically set to 8:30 despite the day)
    var codelinestart ="<TABLE BORDER=1 cellspacing=0 cellpadding=5><TFOOT>*Reservations are held for 15 minutes after start time.</TFOOT><TR><TD></TD>"; //The top of the table

    for(var i = 9; i < 20.5; i = i + 0.5){  //This loop is going to create the left hand side of the table that displays all of the possible booking times
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
    var dayArray = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];  //Needed for both displaying the days on the table and for array access later on
    //openCloseTimes is an object that holds the open and close times of each day to use in creating date items with correct starting and ending times (uses 30 minute increments)
    var openCloseTimes = {"Sunday" : [13, [16, 30]], "Monday": [0, [0,0]], "Tuesday" : [12, [20, 30]], "Wednesday": [12, [17, 0]], "Thursday": [12, [20, 30]], "Friday": [12, [20, 30]], "Saturday": [9, [16, 30]]};
    //openCloseTimes2 is an object that holds open and close times that can be used to loop correctly through the days (has .5 increments)
    //
    var openCloseTimes2 = {"Sunday" : [13, 16.5], "Monday": [0, 0], "Tuesday" : [12, 20.5], "Wednesday": [12, 17], "Thursday": [12, 20.5], "Friday": [12, 20.5], "Saturday": [9, 16.5]};
    var todayD = dibsdate.getDay(); //Get Today's day (0-6 for Sun-Sat respectively)

    for(var dayGen = 0; dayGen < 7; dayGen++) { //This is the main function loop of the program. Each iteration is going to go through the database and figure out
                                                //whether the time slots are able to be booked or if they are already booked of if the library is closed
        var theDay = (todayD + dayGen) % 7;         //This is needed to offset the date loop to make sure that we are pulling the right day of the week info
                                                    //for example, if today is Sat, then the day will be 6 and on the next iteration it'll be 7 (but that's out of bounds, so we make it 0 for Sun)
        var todaycheck = new Date();    //The next variables and if statement here determines if it is or is not daylight savings times
        todaycheck.setDate(todaycheck.getDate() + dayGen);
        if (todaycheck.dst()) {
            var savingstime = "-05:00";
        }
        else {
            var savingstime = "-06:00";
        }

        var dibsdate = new Date();  //Generate today's date again
        dibsdate.setDate(dibsdate.getDate() + dayGen);  //Offset that date by how many iterations we have gone through in the for loop

        closetime = new Date(dibsdate.getFullYear(),dibsdate.getMonth(),dibsdate.getDate(),20,30,0,0);  //Statically set the close time again

        var xmarker = "OPEN";   //These markers are used to correctly label out scheduling table. For instance, this marker is used if the slot is open to be booked
        var prexmarker = "";    //These markers will be used later on
        var postmarker = "";
        var dibsdate2 = dibsdate.toLocaleDateString();  //Variable needed to correctly instantiate the URL to pull correct date data
        dibsdate2 = dibsdate2.replace("/", "-");    //replace the standard /'s in generic DateString data type with -'s for URL compatibility
        dibsdate2 = dibsdate2.replace("/", "-");
        var dibsdateurlnow = "https://elmhurstmakerspace.evanced.info/dibsAPI/reservations/" + dibsdate2 + "/3"; //The URL used to access this days booking data

        $.ajaxSetup({   //Turn off asynchronous syncing
            async: false
        });

        var colorcount = 1; //Variables used to correctly color and style the booked slots to be friendly to the eyes
        var bookcolor = "DCDCDC";


        var xdibsdate = new Date(dibsdate.getFullYear(), dibsdate.getMonth(), dibsdate.getDate(), openCloseTimes[dayArray[theDay]][0], 0, 0, 0);    //Set this iteration's start time to the correct date start time

        $.getJSON(dibsdateurlnow,   //This jQuery call pulls the data from the Evanced/DIBS URL above, then we can use that data to correctly generate the scheduling table
            function processData(jsonData) {
                sortJsonArrayByProperty(jsonData, 'attributes.StartTime');  //This function sorts the data in the jsonData by each bookings start time (data in the Evanced/DIBS URL is sorted by when the time was booked, not by when the booking time is)
                xdibsdate = new Date(dibsdate.getFullYear(), dibsdate.getMonth(), dibsdate.getDate(), openCloseTimes[dayArray[theDay]][0], 0, 0, 0);    //Re-instantiate the date in the jQuery body

                codelinestart = codelinestart + "<TD align=center>" + dayArray[theDay] + "</TD>";   //Head each column with the English word for the day

                //The variables and loop "paint over" the column with 'Closed,' and will be written over later if the time in which the slot occupies is not closed
                var xmarker1 = "<font size=-1>Closed</font>";
                var prexmarker1 = "";
                var postmarker1 = "";
                var theMarkUp = "<TD align=center style='border-width:0' BGCOLOR=" + "#3e4f6b" + ">" + prexmarker1 + xmarker1 + postmarker1 + "</TD>";
                var mUl1 = theMarkUp.length; //This is used to keep the length of the string being added to this codeLineObj just in case it needs to be erased and replaced if this time is indeed open
                for(var j = 9; j < 20.5; j = j + 0.5){
                    codeLineObj[j] = codeLineObj[j] + theMarkUp;
                }

                //The variables and loop "paint over" that these slots are 'OPEN' and fix a hyperlink to book this time(depending on the opening and closing times of this day)
                var prexmarker2 = '<A style="color: #459f9a;" HREF="https://elmhurstmakerspace.evanced.info/dibs?space=' + "3" + '">';
                var postmarker2 = "</A>";
                var xmarker2 = "OPEN";
                var theMarkUp2 = "<TD align=center>" + prexmarker2 + xmarker2 + postmarker2 + "</TD>";
                var mUl2 = theMarkUp2.length;   //This is used to keep the length of the string being added to this codeLineObj just in case it needs to be erased and replaced if this time is indeed booked
                for(var j = openCloseTimes2[dayArray[theDay]][0]; j < openCloseTimes2[dayArray[theDay]][1]; j = j + 0.5){
                    if(openCloseTimes2[dayArray[theDay]][1] == 20.5 && j > 15.5 && j < 18.5){ //If this is a day where Makery open until 9, then the laser cutter is closed from 4-6PM
                    }
                    else {
                        var objLen = codeLineObj[j].length;
                        objLen -= mUl1; //This time is open, so 'slice' off the last part that was added to this codeLineObj in order to add it as an "OPEN" slot
                        codeLineObj[j] = codeLineObj[j].slice(0, objLen);
                        codeLineObj[j] += theMarkUp2;
                    }
                }

                // Loop through each data block in order to place in the table if this time is booked
                $.each(jsonData, function (object, objectData) {    //Each object is an object of the jsonDatam and the objectData holds the startTime and endTime of the booking

                    var whichroom = objectData.RoomID; //Should always be the room number for the laser cutter (3, in this case)
                    prexmarker = '<A style="color: #459f9a;" HREF="https://elmhurstmakerspace.evanced.info/dibs?space=' + whichroom + '">';
                    postmarker = "</A>";
                    if (colorcount == 1) {  //Alternate the color scheme depending on what the color was before this booked time (alternates between dark and light grey)
                        colorcount = 2;
                        bookcolor = "A9A9A9";
                    }
                    else {
                        colorcount = 1;
                        bookcolor = "DCDCDC";
                    }

                    xmarker = "<font size=-1>*Booked</font>";   //Here we do the magic of comparing the objectData start time and end time with the table, and correctly placing thee length and times of each booking in the table
                    prexmarker = "";
                    postmarker = "";
                    var timestringOpen = objectData.StartTime;  //Start time of the booking
                    var timestringEnd = objectData.EndTime; //End time of the booking
                    var timedateOpen = new Date(timestringOpen + savingstime);  //Make sure both the start and end times of the booking are correctly instantiated with savings time or not
                    var timedateClose = new Date(timestringEnd + savingstime);
                    var conv = {0: 0, 30: .5};  //object to convert 30 to .5 for the loop (just for ease)
                    var openHourMin = timedateOpen.getHours() + conv[timedateOpen.getMinutes()]; //create the correct start time for the booking start
                    var closeHourMin = timedateClose.getHours() + conv[timedateClose.getMinutes()]; //create the correct end time for the booking end
                    var theMarkUp3 = "<TD align=center style='border-width:0' BGCOLOR=" + bookcolor + ">" + prexmarker + xmarker + postmarker + "</TD>";
                    for(;openHourMin < closeHourMin ; openHourMin += .5){   //loop that correctly goes through and adds the booked slot into the table
                        if(openCloseTimes2[dayArray[theDay]][1] == 20.5 && openHourMin > 15.5 && openHourMin < 18.5){   //If this is a day where Makery open until 9, then the laser cutter is closed from 4-6PM
                        }
                        else {
                            var objLen = codeLineObj[openHourMin].length;
                            objLen -= mUl2; //Erase and slice the "OPEN" from the codeLineObj because this slot is not open
                            codeLineObj[openHourMin] = codeLineObj[openHourMin].slice(0, objLen);
                            codeLineObj[openHourMin] += theMarkUp3;
                            theMarkUp3 = "<TD align=center style='border-width:0' BGCOLOR=" + bookcolor + ">" + prexmarker + postmarker + "</TD>";
                            xmarker = "<font color=" + bookcolor + "></font>";
                        }
                    }
                });
            });
        }
    //end the loop here

    var fullcodeline = codelinestart;   //Start the table with the, well, beginning of the table variable created earlier

        for(var i = 9; i < 20.5; i = i + .5){   //loop through each codeLineObj and correctly make the HTML table with the now created schedule
            fullcodeline = fullcodeline + "</TR>" + codeLineObj[i];
        }

    fullcodeline = fullcodeline + "</TR>" + codelineend;    //End the table
    $('#laserCutterSched').append(fullcodeline);  //Find the DIV with ID stated and add the table to that DIV

    $.ajaxSetup({   //synchronize with jQuery now that the code is done
        async: true
    });
});