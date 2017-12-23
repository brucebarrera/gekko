


// helpers
var _ = require('lodash');
var log = require('../core/log.js');

var util = require('../core/util.js');

// let's create our own method
var method = {};



// prepare everything our method needs
method.init = function() {

  this.name = 'WBM1';

  this.currentTrend;
  this.requiredHistory = 0;

  this.buyPrice = this.settings.initialBuyPrice ? this.settings.initialBuyPrice : 0;

  this.tradeLimit = this.settings.tradeLimit;
  this.tradeCount = 0;

  this.nextOperation = this.settings.firstTrade;
  this.rsiSellPoint = this.settings.rsiSellPoint;


  log.debug("Short DEMA size: "+this.settings.shortSize);
  log.debug("Long DEMA size: "+this.settings.longSize);
  log.debug("RSI  size: "+this.settings.rsiSize);

  this.addTalibIndicator('shortDEMA', 'dema', {optInTimePeriod : this.settings.shortSize});
  this.addTalibIndicator('longDEMA', 'dema', {optInTimePeriod : this.settings.longSize});
  this.addTalibIndicator('rsi', 'rsi', {optInTimePeriod : this.settings.rsiSize});

  log.debug(this.name+' Strategy initialized');

  //log.debug("This is the object",this);
};

// what happens on every new candle?
method.update = function(candle) {
  // nothing!
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

method.processTrade =  function(trade){

  if(trade){

    this.isTrading =  false;

    this.lastTrade =  trade;


    if(trade.action == 'buy'){
      this.buyPrice = trade.price;
    }

    log.debug("\t","Trade info: " ,trade);
  }

}

method.check = function(candle) {


  if(this.tradeLimit != -1 && this.tradeCount >= this.tradeLimit ){
    log.debug("The trade limit has been reached. No other operations will be taken");
    return;
  }

  if(this.isTrading == true){
    log.debug("A trade is currently in progress. Waiting for trade to complete.");
    return;
  }

  var shortResult = this.talibIndicators.shortDEMA.result.outReal;
  var longResult = this.talibIndicators.longDEMA.result.outReal;
  var rsiResult =  this.talibIndicators.rsi.result.outReal;
  var price = candle.close;


  var message = '@ ' + price.toFixed(8);


  //DEMA Golden Cross / Uptrend
  if(shortResult >  longResult) {

    log.debug('we are currently in uptrend', message);

    // If the next operation is a buy and RSI is in the buy point range
    //A Golden Cross has occurred buy
    if(this.nextOperation == 'buy' && this.currentTrend == 'down'){

        this.nextOperation = 'sell';
        this.advice('long');

        log.debug("Golden Cross");
        log.debug("Going to buy");
        this.tradeCount++;
        this.isTrading =  true;
    }

    //Overbought and we're in the money let's dump it here and cash out.
    else if ( this.nextOperation == 'sell' && rsiResult >= this.rsiSellPoint && this.canSell(candle)){

      this.nextOperation = 'buy';
      this.advice('short');

      log.debug("The asset appears to be overbought");
      log.debug("Going to sell");
      this.tradeCount++;
      this.isTrading =  true;
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

    if(this.currentTrend == 'up' &&  this.nextOperation == 'sell' && this.canSell(candle)) {

      this.nextOperation = 'buy';
      this.advice('short');
      log.debug("Going to sell");
      this.tradeCount++;
      this.isTrading =  true;
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


method.canSell = function(candle){


  if(!this.lastTrade ){

    return this.buyPrice < candle.close;
  }

  if(this.lastTrade.action !== 'buy'){
    return false;
  }

  var currencyValue =  candle.close * this.lastTrade.portfolio.asset;

  var sellAmount =  currencyValue - (currencyValue * (this.settings.sellFee / 100));
  log.debug("Amount to Sell",sellAmount);
  var profitMargin =  this.settings.profitMarginPercentage / 100;
  var buyAmount  = this.buyPrice * this.lastTrade.portfolio.asset;
  log.debug("Buy Amount",buyAmount);

  var potentialProfit = 1 - (buyAmount / sellAmount);

  log.debug("potential profit :", potentialProfit," required profit margin", profitMargin);

  return potentialProfit > profitMargin;
};


module.exports = method;
