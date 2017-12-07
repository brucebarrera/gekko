// helpers
var _ = require('lodash');
var log = require('../core/log.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  this.name = 'DEMACrossover';

  this.currentTrend;
  this.requiredHistory = 0;

  this.nextOperation;

  // define the indicators we need
  //this.addIndicator('dema', 'DEMA', this.settings);


  this.nextOperation = this.settings.firstTrade;
  this.rsiBuyPoint = this.settings.rsiBuyPoint;
  this.rsiSellPoint = this.settings.rsiSellPoint;

  log.debug("Short DEMA size: "+this.settings.shortSize);
  log.debug("Long DEMA size: "+this.settings.longSize);
  log.debug("RSI  size: "+this.settings.rsiSize);

  this.addTalibIndicator('shortDEMA', 'dema', {optInTimePeriod : this.settings.shortSize});
  this.addTalibIndicator('longDEMA', 'dema', {optInTimePeriod : this.settings.longSize});
  this.addTalibIndicator('rsi', 'rsi', {optInTimePeriod : this.settings.rsiSize});

  log.debug(this.name+' Strategy initialized');

}

// what happens on every new candle?
method.update = function(candle) {
  // nothing!
}

// for debugging purposes: log the last calculated
// EMAs and diff.
method.log = function() {
  var shortDEMA = this.talibIndicators.shortDEMA;
  var longDEMA = this.talibIndicators.longDEMA;
  var rsi = this.talibIndicators.rsi;


  log.debug('calculated DEMA properties for candle:');

  log.debug('\t shortDEMA :', shortDEMA.result);

  log.debug('\t', 'longDEMA:', longDEMA.result);

  log.debug('\t', 'rsi:', rsi.result);
}

method.check = function(candle) {

  var shortResult = this.talibIndicators.shortDEMA.result.outReal;
  var longResult = this.talibIndicators.longDEMA.result.outReal;
  var rsiResult =  this.talibIndicators.rsi.result.outReal;
  var price = candle.close;

  var message = '@ ' + price.toFixed(8);


  //DEMA Golden Cross/Uptrend
  if(shortResult >  longResult) {
    log.debug('we are currently in uptrend', message);

    this.currentTrend = 'up';
    // If the next operation is a buy and RSI is below hte congured buy point
    if(this.nextOperation == 'buy'  && rsiResult <= this.rsiBuyPoint ) {

      this.nextOperation = 'sell';
      this.advice('long');
      log.debug("The asset is not overbought")
      log.debug("Going to buy");


    }
    else if ( this.nextOperation == 'sell' && rsiResult >= this.rsiSellPoint ){

      this.nextOperation = 'buy';
      this.advice('short');
      log.debug("The asset appears to be overbought");
      log.debug("Going to sell");

    }
    else {

      log.debug("Nothing to buy");
      this.advice();
    }

  }


  else if(longResult > shortResult) {
    log.debug('we are currently in a downtrend', message);
    this.currentTrend = 'down';
    if(this.nextOperation == 'sell') {

      this.nextOperation = 'buy';
      this.advice('short');
      log.debug("Going to sell");
    }

    else {
      log.debug("Nothing to sell");
      this.advice();
    }

  } else {
    log.debug('we are currently not in an up or down trend', message);
    this.advice();
  }
}

module.exports = method;
