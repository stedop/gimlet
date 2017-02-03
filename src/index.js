import bot from "./bot";
import env from "node-env-file";
import winston from "winston";

env( ".env" );

const logger = new (winston.Logger)( {
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)( {
            filename: "./logs/" + process.env.logFile,
            handleExceptions: true,
            humanReadableUnhandledException: true
        } )
    ]
} );

const botConfig = {
    'userAgent': process.env.userAgent,
    'clientId': process.env.clientId,
    'clientSecret': process.env.clientSecret,
    'refreshToken': process.env.refreshToken,
    'subreddit': process.env.subreddit,
    'feedsFile': __dirname + process.env.feedsFile
};

try {
    const plBot = new bot( botConfig );
    plBot
        .run();
} catch (error) {
    console.log(error);
}