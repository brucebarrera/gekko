// helpers
var _ = require('lodash');
var log = require('../core/log.js');
var util = require('../core/util.js');

// let's create our own method
var method = {};


// prepare everything our method needs
method.init = function() {

  this.name = 'BB';

  this.currentTrend;
  this.requiredHistory = 0;

  var customBBSettings = {
    optInTimePeriod: 20,
    optInNbDevUp: 2,
    optInNbDevDn: 2,
    optInMAType: 0
    }

  var customRSISettings = {
    optInTimePeriod: 14,
    optInFastK_Period: 3,
    optInFastD_Period: 3,
    optInFastD_MAType: 0
    }

  this.addTalibIndicator('myBB', 'bbands', customBBSettings);
  this.addTalibIndicator('myStochRSI', 'stochrsi', customRSISettings);

  log.debug(this.name+' Strategy initialized');

}

// what happens on every new candle?
method.update = function(candle) {
  // nothing!
}

method.log = function() {
    var bbands = this.talibIndicators.myBB.result;

    log.debug('Bollinger Bands:');
    log.debug('\t', 'Upper Band:', bbands['outRealUpperBand']);
    log.debug('\t', 'Middle Band:', bbands['outRealMiddleBand']);
    log.debug('\t', 'Lower Band:', bbands['outRealLowerBand']);

    var stochRsi = this.talibIndicators.myStochRSI.result;

    log.debug('StochRSI:');
    log.debug('\t', 'outFastK :', stochRsi['outFastK']);
    log.debug('\t', 'outFastD :', stochRsi['outFastD']);
}
