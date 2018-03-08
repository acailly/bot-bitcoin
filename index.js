const request = require('request')
const subDays = require('date-fns/sub_days')
const endOfToday = require('date-fns/end_of_today')
const format = require('date-fns/format')
const chalk = require('chalk')
const R = require('ramda')
const pad = require('pad-right')

module.exports = function (vorpal) {
  vorpal
    .command('bitcoin')
    .alias('bt')
    .description('Get bitcoin price')
    .option('--days <days>', 'period to watch in days')
    .action(function (args, callback) {
      const days = args.options.days || 30
      const endTime = endOfToday()
      const startTime = subDays(endTime, days)
      const requestDateFormat = 'YYYY-MM-DD'

      const historyRequestUrl = `https://api.coindesk.com/v1/bpi/historical/close.json?start=${format(startTime, requestDateFormat)}&end=${format(endTime, requestDateFormat)}`
      request
        .get(historyRequestUrl, (error, response, body) => {
          if (error) {
            callback(error)
            return error
          }
          body = JSON.parse(body)

          const maxValue = R.reduce(R.max, 0, R.values(body.bpi))

          const history = R.keys(body.bpi)
            .map(key => {
              const value = body.bpi[key]
              const squareCount = Math.round(value * 20 / maxValue)
              const squares = R.repeat('█', squareCount).join('')
              return `${key}\t\t${pad(chalk.green(value + '$'), 40, ' ')}${chalk.blue(squares)}`
            })
            .join('\n')
          console.log(history)

          const realTimeRequestUrl = `https://api.coindesk.com/v1/bpi/currentprice.json`
          request
            .get(realTimeRequestUrl, (error, response, body) => {
              if (error) {
                callback(error)
                return error
              }
              body = JSON.parse(body)

              const updateTime = body.time.updateduk
              const inDollar = chalk.green(`${body.bpi.USD.rate_float}$`)
              const inEuros = chalk.blue(`${body.bpi.EUR.rate_float}€`)

              const result = `${inDollar}\t ${inEuros}\tupdated at ${updateTime}`
              callback(result)
            })
        })
    })
}

/*
  {"time":{"updated":"Dec 8, 2017 09:04:00 UTC","updatedISO":"2017-12-08T09:04:00+00:00","updateduk":"Dec 8, 2017 at 09:04 GMT"},"disclaimer":"This data was produced from the CoinDesk Bitcoin Price Index (USD). Non-USD currency data converted using hourly conversion rate from openexchangerates.org","chartName":"Bitcoin","bpi":{"USD":{"code":"USD","symbol":"&#36;","rate":"15,469.6563","description":"United States Dollar","rate_float":15469.6563},"GBP":{"code":"GBP","symbol":"&pound;","rate":"11,465.5368","description":"British Pound Sterling","rate_float":11465.5368},"EUR":{"code":"EUR","symbol":"&euro;","rate":"13,164.9559","description":"Euro","rate_float":13164.9559}}}
 */

/*
{"bpi":{"2013-09-01":128.2597,"2013-09-02":127.3648,"2013-09-03":127.5915,"2013-09-04":120.5738,"2013-09-05":120.5333},"disclaimer":"This data was produced from the CoinDesk Bitcoin Price Index. BPI value data returned as USD.","time":{"updated":"Sep 6, 2013 00:03:00 UTC","updatedISO":"2013-09-06T00:03:00+00:00"}}
*/
