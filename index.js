"use strict";

var LunchHunter = require( './lib/lunchhunter' ),
    lunchhunter = new LunchHunter();

exports.runBoyRun = function(event, context, callback) {
    lunchhunter.run( callback );
};
