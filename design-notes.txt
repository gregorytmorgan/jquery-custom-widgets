//
// Notes
//

Known Issues
===============================
* Setting an option to the current (unchanged) value still causes a redraw.
* Data is drawn appear at the very edge of the display and can get lost in the
border. Would be better to have a pixel of relieve on both L/R edges of display.



Running Tests
===============================

Netbeans
-------------------------------
Using Run --> 'Test Project' will send a 'run' command to a Netbeans Karma instance
that will the run Qunit tests based on the karma.conf.js. This will typically
pop open a browser window and display the standard Qunit test UI as well as opening
a Netbeans 'Test Results' tab that shows the Qunit console output.

It is possible to test in multiple browsers at once.

Additionally, based on the karma config file it is possible to run the tests in
headless Chrome and view the results as console or logfile output.

Note: phantomJS isn't a valid headless browser any longer due to lack of ES6 support.

There were problems with the Qunit tests being started before a previous test run
had ended. This was fixed in /usr/local/lib/node_modules/karma-qunit/lib/adapter.js
by changing qunitOldTimeout, 13 --> 500.

Alternatively,test can be run by opposite clicking -> 'Run File' on
[project][site root]/tests/test.html. This will pop open a browser window and display
the standard Qunit test UI. Note this will not work with [project]/tests/test.html
original instance (the two are symlinked) since it is not in the web server root.

Command-line
-------------------------------
Running tests from the command line,

> qunit myTest.js --WRONG--

isn't working due to getting the necessary libraries loaded.  Use karma instead.

> karma start karma.single-run.conf.js

This approach uses a karma config file with singleRun:true.  This config currently
outputs to the terminal, but it's possible to start a browser instance as well.




// end file