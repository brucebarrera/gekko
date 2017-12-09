// helpers
var _ = require('lodash');
var log = require('../core/log.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  this.name = 'WBM1';

  this.currentTrend;
  this.requiredHistory = 0;

  this.buyPrice = calculateBuyPrice(this.settings.initialBuyPrice,this.settings.buyFee);

  this.nextOperation = this.settings.firstTrade;
  this.rsiSellPoint = this.settings.rsiSellPoint;
  this.candleTradeLag = this.settings.candleTradeLag;

  //Doing this initially to avoid start up lag
  this.candleCountSinceSell = this.candleTradeLag;

  log.debug("Short DEMA size: "+this.settings.shortSize);
  log.debug("Long DEMA size: "+this.settings.longSize);
  log.debug("RSI  size: "+this.settings.rsiSize);

  this.addTalibIndicator('shortDEMA', 'dema', {optInTimePeriod : this.settings.shortSize});
  this.addTalibIndicator('longDEMA', 'dema', {optInTimePeriod : this.settings.longSize});
  this.addTalibIndicator('rsi', 'rsi', {optInTimePeriod : this.settings.rsiSize});

  log.debug(this.name+' Strategy initialized');

};

// what happens on every new candle?
method.update = function(candle) {
  // nothing!
  this.candleCountSinceSell++;
};

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
};

method.check = function(candle) {


  if(this.candleCountSinceSell < this.candleTradeLag){
    log.debug("Lag time " + this.candleTradeLag+ " has not beeen reached no operations will be taken.");
    return;
  }

  var shortResult = this.talibIndicators.shortDEMA.result.outReal;
  var longResult = this.talibIndicators.longDEMA.result.outReal;
  var rsiResult =  this.talibIndicators.rsi.result.outReal;
  var price = candle.close;

  //the price must be higher than this to make sure we don't lose money
  var sellPrice = calculateSellPrice(this.buyPrice,this.settings.sellFee);

  var message = '@ ' + price.toFixed(8);


  //DEMA Golden Cross / Uptrend
  if(shortResult >  longResult) {

    log.debug('we are currently in uptrend', message);

    // If the next operation is a buy and RSI is in the buy point range
    //A Golden Cross has occurred buy
    if(this.nextOperation == 'buy' && this.currentTrend == 'down'){

        this.nextOperation = 'sell';
        this.advice('long');

        this.candleCountSinceSell = 0;
        this.buyPrice =  calculateBuyPrice(price,this.settings.buyFee);

        log.debug("Golden Cross");
        log.debug("Going to buy");

    }

    //Overbought and we're in the money let's dump it here and cash out.
    else if ( this.nextOperation == 'sell' && rsiResult >= this.rsiSellPoint && sellPrice > this.buyCandleClosePrice){

      this.nextOperation = 'buy';
      this.advice('short');

      log.debug("The asset appears to be overbought");
      log.debug("Going to sell");

      this.candleCountSinceSell = 0;
    }

    //Nothing to do
    else {

      log.debug("Nothing to buy");
      this.advice();

    }

    this.currentTrend = 'up';
  }


  // COD / Downtrend
  else if(longResult > shortResult) {

    log.debug('we are currently in a downtrend', message+" : Target sell price: "+sellPrice);


    if(this.currentTrend == 'up' &&  this.nextOperation == 'sell' && price > sellPrice) {

      this.nextOperation = 'buy';
      this.advice('short');
      log.debug("Going to sell");
      this.candleCountSinceSell = 0;

    }
    else {
      log.debug("Nothing to sell");
      this.advice();
    }

    this.currentTrend = 'down';
  }

  else {
    log.debug('we are currently not in an up or down trend', message);
    this.advice();
  }
};

//TODO  Figure out the amount sold in order to properly determine the sell price
function calculateBuyPrice(buyPrice,buyFee){

  return buyPrice;
}

function calculateSellPrice(sellPrice,sellFee){
  return sellPrice;
}

function calculateSellFee(sellPrice,sellFee){
  return;
}



module.exports = method;
