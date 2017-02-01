"use strict";

import { defaults, each } from "lodash";
import Snoowrap from "snoowrap";
import parser from "xml2json";
import request from "request";

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
     * @param {object} [feeds] Onject containting list of xml feeds to parse
     */
    constructor( {
        userAgent,
        clientId,
        clientSecret,
        refreshToken,
        subreddit,
        feeds
    } = {} ) {
        if ( clientId === undefined || clientSecret === undefined || refreshToken === undefined ) {
            throw new Error( "Reddit Credentials not supplied" );
        }

        if ( feeds === undefined || feeds.length === 0 ) {
            throw new Error( "No feeds to parse" );
        }


        defaults( this, {
            userAgent,
            clientId,
            clientSecret,
            refreshToken,
            subreddit,
            feeds
        }, {
            userAgent: null,
            clientId: null,
            clientSecret: null,
            refreshToken: null,
            subbreddit: null,
            feeds: {}
        } );

        this.__initRedditClient();
    }

    __initRedditClient() {
        this.redditClient = new Snoowrap( {
            userAgent: this.userAgent,
            clientId: this.clientId,
            clientSecret: this.clientSecret,
            refreshToken: this.refreshToken
        } );
    }

    httpGetAsync( theUrl ) {
        return new Promise( ( resolve, reject ) => {
            request( theUrl, ( error, response, body ) => {
                if ( !error && response.statusCode === 200 ) {
                    resolve( body );
                }

                reject( error );
            } );
        } );

    }

    getFeeds( data = {} ) {
        data.responses = {};
        return new Promise( ( resolve, reject ) => {
            each( this.feeds, ( feed, name ) => {
                this.httpGetAsync( feed.url ).then( ( response ) => {
                    let jsonResponse = JSON.parse( parser.toJson( response ) );
                    data.responses[ name ] = jsonResponse.rss.channel;
                    resolve( data );
                }, reject );
            } );
        } );
    }

    parseFeeds( data = {} ) {
        data.posts = {};
        return new Promise( ( resolve, reject ) => {
            each( data.responses, ( response, name ) => {
                each( response.item, ( show ) => {
                    let lastShow = new Date( this.feeds[ name ].lastShow );
                    let pubDate = new Date( show.pubDate );
                    if ( pubDate > lastShow ) {
                        data.posts[ name ] = {
                            title: response.title + " - " + show.title,
                            link: show.enclosure.url
                        };
                    }
                } );
            } );

            resolve( data );
        } );
    }

    postNewShows( data = {} ) {
        let self = this;
        let completed = {};
        return new Promise( ( resolve, reject ) => {
            each( data.posts, function ( post, name ) {
                self
                    .redditClient
                    .getSubreddit(self.subreddit)
                    .submitLink( {
                        title: post.title,
                        url: post.link
                    } )
                    .then( ( response ) => {
                        // according to the docs I should be able to chain this but it doesn't work
                        self.makeModPost(response);
                        completed[ post.title ] = response.name;
                    }, reject
                );

            } );
            resolve( completed );
        } );
    }

    makeModPost( response ) {
        this.redditClient
            .getSubmission(response)
            .distinguish();
        this.redditClient
            .getSubmission(response)
            .approve();
    }

    run() {
        return this.getFeeds()
            .then( ( data ) => this.parseFeeds( data ) )
            .then( ( data ) => this.parseFeeds( data ) )
            .then( ( data ) => this.postNewShows( data ) );
    }
}