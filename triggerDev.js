const lambdaHandler = require('./index')

let event = {"action":"stop"}
let context = null
let callback = (respError, respSuccess) =>{
    if(respError) console.log(respError);
    if(respSuccess) console.log(respSuccess);
}

lambdaHandler.handler(event, context, callback)