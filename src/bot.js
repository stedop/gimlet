"use strict";

import { defaults, each } from "lodash";
import Snoowrap from "snoowrap";
import parser from "xml2json";
import request from "request";
import fs from "fs";

export default class bot {

    /**
     * @summary initialises the bot
     *
     * @param {string} [userAgent] A unique description of what your app does. This argument is not necessary when Snoowrap
     is running in a browser.
     * @param {string} [clientId] The client ID of your app (assigned by reddit)
     * @param {string} [clientSecret] The client secret of your app (assigned by reddit). If you are using a refresh token
     with an installed app (which does not have a client secret), pass an empty string as your `clientSecret`.
     * @param {string} [refreshToken] A refresh token for your app.
     * @param {string} [subreddit] The subreddit name we are going to be managing
     */
    constructor( {
        userAgent,
        clientId,
        clientSecret,
        refreshToken,
        subreddit,
        feedsFile
    } = {} ) {

        if ( clientId === undefined || clientSecret === undefined || refreshToken === undefined ) {
            throw new Error( "Reddit Credentials not supplied" );
        }

        if ( feedsFile === undefined ) {
            throw new Error( "No feeds file deifned" );
        }


        defaults( this, {
            userAgent,
            clientId,
            clientSecret,
            refreshToken,
            subreddit,
            feedsFile
        }, {
            userAgent: null,
            clientId: null,
            clientSecret: null,
            refreshToken: null,
            subbreddit: null,
            feedsFile: null
        } );

        this.feeds = {};
        this.completed = {};
        this.__initRedditClient();
        this.__initFeeds();
    }

    __initRedditClient() {
        this.redditClient = new Snoowrap( {
            userAgent: this.userAgent,
            clientId: this.clientId,
            clientSecret: this.clientSecret,
            refreshToken: this.refreshToken
        } );
    }

    __initFeeds() {
        this.feeds = require(this.feedsFile);
    }

    __writeFeeds() {
        fs.writeFile(this.feedsFile, JSON.stringify(this.feeds), function (err) {
            if (err) {
                throw err;
            }
        });
    }

    makePost(post = {}) {
        return this
            .redditClient
            .getSubreddit(this.subreddit)
            .submitLink(post)
            .then( ( response ) => {
                    // according to the docs I should be able to chain this but it doesn't work
                    this.makeModPost(response);
                    this.completed[ post.title ] = response.name;
                }
            );
    }

    makeModPost() {

    }

    run() {
        let self = this;
        each( this.feeds, function ( feed, name ) {
            request( feed.url, function ( error, response, body ) {
                if ( !error && response.statusCode === 200 ) {
                    let jsonResponse = JSON.parse( parser.toJson( body ) );
                    each( jsonResponse.rss.channel.item, function ( show ) {
                        let lastShow = new Date( feed.lastShow );
                        let pubDate = new Date( show.pubDate );
                        if ( pubDate > lastShow ) {
                            let post = {
                                'title': show.title,
                                'url': show.enclosure.url
                            };
                            self.makePost(post);
                            self.feeds[name].lastShow = show.pubDate;
                            self.__writeFeeds();
                        }
                    });

                } else {
                    throw error;
                }
            } );
        } );
    }
}