"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _each2 = require("lodash/each");

var _each3 = _interopRequireDefault(_each2);

var _defaults2 = require("lodash/defaults");

var _defaults3 = _interopRequireDefault(_defaults2);

var _snoowrap = require("snoowrap");

var _snoowrap2 = _interopRequireDefault(_snoowrap);

var _xml2json = require("xml2json");

var _xml2json2 = _interopRequireDefault(_xml2json);

var _request = require("request");

var _request2 = _interopRequireDefault(_request);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class bot {

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
    constructor() {
        var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            userAgent = _ref.userAgent,
            clientId = _ref.clientId,
            clientSecret = _ref.clientSecret,
            refreshToken = _ref.refreshToken,
            subreddit = _ref.subreddit,
            feeds = _ref.feeds;

        if (clientId === undefined || clientSecret === undefined || refreshToken === undefined) {
            throw new Error("Reddit Credentials not supplied");
        }

        if (feeds === undefined || feeds.length === 0) {
            throw new Error("No feeds to parse");
        }

        (0, _defaults3.default)(this, {
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
        });

        this.__initRedditClient();
    }

    __initRedditClient() {
        this.redditClient = new _snoowrap2.default({
            userAgent: this.userAgent,
            clientId: this.clientId,
            clientSecret: this.clientSecret,
            refreshToken: this.refreshToken
        });
    }

    httpGetAsync(theUrl) {
        return new Promise(function (resolve, reject) {
            (0, _request2.default)(theUrl, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    resolve(body);
                }

                reject(error);
            });
        });
    }

    getFeeds() {
        var _this = this;

        var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        data.responses = {};
        return new Promise(function (resolve, reject) {
            (0, _each3.default)(_this.feeds, function (feed, name) {
                _this.httpGetAsync(feed.url).then(function (response) {
                    var jsonResponse = JSON.parse(_xml2json2.default.toJson(response));
                    data.responses[name] = jsonResponse.rss.channel;
                    resolve(data);
                }, reject);
            });
        });
    }

    parseFeeds() {
        var _this2 = this;

        var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        data.posts = {};
        return new Promise(function (resolve, reject) {
            (0, _each3.default)(data.responses, function (response, name) {
                (0, _each3.default)(response.item, function (show) {
                    var lastShow = new Date(_this2.feeds[name].lastShow);
                    var pubDate = new Date(show.pubDate);
                    if (pubDate > lastShow) {
                        data.posts[name] = {
                            title: response.title + " - " + show.title,
                            link: show.enclosure.url
                        };
                    }
                });
            });

            resolve(data);
        });
    }

    postNewShows() {
        var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        var self = this;
        var completed = {};
        return new Promise(function (resolve, reject) {
            (0, _each3.default)(data.posts, function (post, name) {
                self.redditClient.getSubreddit(self.subreddit).submitLink({
                    title: post.title,
                    url: post.link
                }).then(function (response) {
                    // according to the docs I should be able to chain this but it doesn't work
                    self.makeModPost(response);
                    completed[post.title] = response.name;
                }, reject);
            });
            resolve(completed);
        });
    }

    makeModPost(response) {
        this.redditClient.getSubmission(response).distinguish();
        this.redditClient.getSubmission(response).approve();
    }

    run() {
        var _this3 = this;

        return this.getFeeds().then(function (data) {
            return _this3.parseFeeds(data);
        }).then(function (data) {
            return _this3.parseFeeds(data);
        }).then(function (data) {
            return _this3.postNewShows(data);
        });
    }
}
exports.default = bot;
//# sourceMappingURL=bot.js.map
//# sourceMappingURL=bot.js.map
//# sourceMappingURL=bot.js.map
//# sourceMappingURL=bot.js.map