/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
    document.addEventListener('deviceready', this.onDeviceReady, false);
    var jsonData=[];
    var deviceInfo={};
    var count=0;
    var watchID;
    var domObj = ["Latitude", "Longitude", "Accuracy","Heading","Speed","Timestamp"];
    var radObj= ["SAC","NCS","WestG","OldCS","Other"];
    document.getElementById("count").innerHTML=count+ '<br />';
    var start_location=null;
    var stop_location=null;
    function onPromptstart(results) {

    //alert("You selected button number " + results.buttonIndex + " and entered " + results.input1);
     start_location=results.input1;
    }
    function onPromptstop(results) {

    //alert("You selected button number " + results.buttonIndex + " and entered " + results.input1);
     stop_location=results.input1;
    }
    function selectMode()
    {
        var config = {
        title: "Select Mode", 
        items: [
            { text: "Bus", value: "BUS" },
            { text: "Walk", value: "WALK" }       
        ],
        selectedValue: "BUS",
        doneButtonLabel: "Done",
        cancelButtonLabel: "Cancel"
        };

// Show the picker
        window.plugins.listpicker.showPicker(config, 
            function(item) {
                deviceInfo["Mode"]=item;
                //alert("You have selected " + item);
            },
            function() { 
                //alert("You have cancelled");
            }
        );
    }
    function _start(){
        
        
        start_location=getSelectedlocation();
        if(start_location==null)
        {
            alert("Please select location.");
            return;
        }
        else
        {
            if(start_location=="Other")
            {
                navigator.notification.prompt(
                'Please enter your location',  // message
                onPromptstart,                  // callback to invoke
                'Other Location',            // title
                ['Ok','Exit'],             // buttonLabels
                'West G'                 // defaultText
                );
            }
            deviceInfo["Start"]=start_location;
            jsonData.push(deviceInfo);
        }
        selectMode();
        // while(location==null)
        // {
        //     location=getSelectedlocation();
        //     // if(location==null)
        //     // {
        //     //     alert("Please select one of the Location");
        //     // }
        // }
        if (watchID == null) {
            //var obj = {}
            for (i = 0; i < domObj.length; i++) {
                var p = document.createElement("p"); 
                var t=document.createTextNode(domObj[i]);
                p.appendChild(t);
                var input = document.createElement("input");
                //x.setAttribute("type", "hidden");
                input.setAttribute("id", domObj[i]);
                input.setAttribute("type", "text");
                input.setAttribute("value", "null");
                input.setAttribute("readonly","readonly");
                var element = document.getElementById("registration");
                element.appendChild(p);
                element.appendChild(input);
                //x.setAttribute("id", domObj[i]);
            }
            watchID = navigator.geolocation.watchPosition(onSuccess, onError, {enableHighAccuracy: true });
             $("#start").hide();
            $("#stop").show();

        }
        else
        {
            alert("Already watching");
        }
        
    }
    function getSelectedlocation()
    {
        var radio_buttons = $("input[name='location']");
        if( radio_buttons.filter(':checked').length == 0){
          // None checked
          return null;
          //alert("None");
        } else {
          // If you need to use the result you can do so without
          // another (costly) jQuery selector call:
          var val = radio_buttons.filter(':checked').val();
          radio_buttons.prop('checked', false);
          //alert(val);
          return val;
        }
    }
    function _stop(){
        if (watchID != null) {
            
            stop_location=getSelectedlocation();
            if(stop_location==null)
            {
                alert("Please select location.");
                return;
            }
            else
            {
                if(stop_location=="Other")
                {
                    navigator.notification.prompt(
                    'Please enter your location',  // message
                    onPromptstop,                  // callback to invoke
                    'Other Location',            // title
                    ['Ok','Exit'],             // buttonLabels
                    'SAC'                 // defaultText
                    );
                }
                deviceInfo["Stop"]=stop_location;
            }
            jsonData.push(deviceInfo);
            window.resolveLocalFileSystemURI(cordova.file.externalDataDirectory, function (dirEntry) {
            //alert('file system open: ' + dirEntry.name);
            var isAppend = true;
            createFile(dirEntry, "location.json", isAppend,JSON.stringify(jsonData));
             }, onError);
            $("#stop").hide();
            $("#start").show();
            navigator.geolocation.clearWatch(watchID);
            watchID = null;
            count=0;
            document.getElementById("count").innerHTML=count+ '<br />';
            document.getElementById("registration").innerHTML='<br />';;
        }
        else
        {
            alert("Not watching");
        }
    }
    function createFile(dirEntry, fileName,isAppend ,dataObj) {
    // Creates a new file or returns the file if it already exists.
        dirEntry.getFile(fileName, {create: true, exclusive: false}, function(fileEntry) {
            //alert("file created");
            writeFile(fileEntry, dataObj, isAppend);

        }, onError);

    }
    function writeFile(fileEntry, dataObj, isAppend) {
        // Create a FileWriter object for our FileEntry (log.txt).
        fileEntry.createWriter(function (fileWriter) {

            fileWriter.onwriteend = function() {
                //alert("Successful file read...");
                readFile(fileEntry);
            };

            fileWriter.onerror = function (e) {
                //alert("Failed file read: " + e.toString());
            };

            // If we are appending data to file, go to the end of the file.
            if (isAppend) {
                try {
                    fileWriter.seek(fileWriter.length);
                }
                catch (e) {
                    //alert("file doesn't exist!");
                }
            }
            fileWriter.write(dataObj);
        });
    }
    function readFile(fileEntry) {

        fileEntry.file(function (file) {
            var reader = new FileReader();

            reader.onloadend = function() {
                //alert("Successful file read: " + this.result);
                displayFileData(fileEntry.fullPath + ": " + this.result);
            };

            reader.readAsText(file);

        }, onError);
    }
    function onDeviceReady() {
        deviceInfo["Platform"]=device.platform;
        deviceInfo["UUID"]=device.uuid;
        deviceInfo["MANUFACTURER"]=device.manufacturer;
        deviceInfo["VERSION"]=device.version;
        deviceInfo["SERIAL"]=device.serial;
        //jsonData.push(deviceInfo);
    }
    
    /*$items.each(function() {
        var x = document.createElement(this.id);
        x.setAttribute("type", "hidden");
    })
    $items.each(function() {
    obj[this.id] = $(this).val()
    })*/

    var onSuccess = function(position) {        /*alert('Latitude: '          + position.coords.latitude          + '\n' +

              'Longitude: '         + position.coords.longitude         + '\n' +
              'Altitude: '          + position.coords.altitude          + '\n' +
              'Accuracy: '          + position.coords.accuracy          + '\n' +
              'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
              'Heading: '           + position.coords.heading           + '\n' +
              'Speed: '             + position.coords.speed             + '\n' +
              'Timestamp: '         + position.timestamp                + '\n');*/
        var locationInfo={};
        locationInfo["Latitude"]=position.coords.latitude;
        locationInfo["Longitude"]=position.coords.longitude;
        locationInfo["Accuracy"]= position.coords.accuracy;
        locationInfo["Heading"]=position.coords.heading;
        locationInfo["Speed"]=position.coords.speed;
        locationInfo["Timestamp"]=position.timestamp;
        jsonData.push(locationInfo);

        var posObj = [position.coords.latitude, position.coords.longitude, position.coords.accuracy,position.coords.heading,position.coords.speed,position.timestamp];
        for (i = 0; i < domObj.length; i++) {
            var m=document.getElementById(domObj[i]);
            m.setAttribute("value", posObj[i]);
        }
        count++;
        document.getElementById("count").innerHTML=count+ '<br />';
        // if(count<2)
        // document.getElementById("device").innerHTML=JSON.stringify(jsonData)+ '<br />';
        /*eement.innerHTML = 'Latitude: '  + position.coords.latitude      + '<br />' +
                            'Longitude: ' + position.coords.longitude     + '<br />' +
                            '<hr />';*/
        
 
    };
    // onError Callback receives a PositionError object 
    // 
    function onError(error) {
        alert('code: '    + error.code    + '\n' +
              'message: ' + error.message + '\n');
    }
    
/*var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        console.log('Received Device Ready Event');
        console.log('calling setup push');
        app.setupPush();
    },
    setupPush: function() {
        console.log('calling push init');
        var push = PushNotification.init({
            "android": {
                "senderID": "XXXXXXXX"
            },
            "browser": {},
            "ios": {
                "sound": true,
                "vibration": true,
                "badge": true
            },
            "windows": {}
        });
        console.log('after init');

        push.on('registration', function(data) {
            console.log('registration event: ' + data.registrationId);

            var oldRegId = localStorage.getItem('registrationId');
            if (oldRegId !== data.registrationId) {
                // Save new registration ID
                localStorage.setItem('registrationId', data.registrationId);
                // Post registrationId to your app server as the value has changed
            }

            var parentElement = document.getElementById('registration');
            var listeningElement = parentElement.querySelector('.waiting');
            var receivedElement = parentElement.querySelector('.received');

            listeningElement.setAttribute('style', 'display:none;');
            receivedElement.setAttribute('style', 'display:block;');
        });

        push.on('error', function(e) {
            console.log("push error = " + e.message);
        });

        push.on('notification', function(data) {
            console.log('notification event');
            navigator.notification.alert(
                data.message,         // message
                null,                 // callback
                data.title,           // title
                'Ok'                  // buttonName
            );
       });
    }
};*/
