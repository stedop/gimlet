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

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

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
     */
    constructor() {
        var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            userAgent = _ref.userAgent,
            clientId = _ref.clientId,
            clientSecret = _ref.clientSecret,
            refreshToken = _ref.refreshToken,
            subreddit = _ref.subreddit,
            feedsFile = _ref.feedsFile;

        if (clientId === undefined || clientSecret === undefined || refreshToken === undefined) {
            throw new Error("Reddit Credentials not supplied");
        }

        if (feedsFile === undefined) {
            throw new Error("No feeds file deifned");
        }

        (0, _defaults3.default)(this, {
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
        });

        this.feeds = {};
        this.completed = {};
        this.__initRedditClient();
        this.__initFeeds();
    }

    __initRedditClient() {
        this.redditClient = new _snoowrap2.default({
            userAgent: this.userAgent,
            clientId: this.clientId,
            clientSecret: this.clientSecret,
            refreshToken: this.refreshToken
        });
    }

    __initFeeds() {
        this.feeds = require(this.feedsFile);
    }

    __writeFeeds() {
        _fs2.default.writeFile(this.feedsFile, JSON.stringify(this.feeds), function (err) {
            if (err) {
                throw err;
            }
        });
    }

    makePost() {
        var _this = this;

        var post = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        return this.redditClient.getSubreddit(this.subreddit).submitLink(post).then(function (response) {
            // according to the docs I should be able to chain this but it doesn't work
            _this.makeModPost(response);
            _this.completed[post.title] = response.name;
        });
    }

    makeModPost() {}

    run() {
        var self = this;
        (0, _each3.default)(this.feeds, function (feed, name) {
            (0, _request2.default)(feed.url, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    var jsonResponse = JSON.parse(_xml2json2.default.toJson(body));
                    (0, _each3.default)(jsonResponse.rss.channel.item, function (show) {
                        var lastShow = new Date(feed.lastShow);
                        var pubDate = new Date(show.pubDate);
                        if (pubDate > lastShow) {
                            var post = {
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
            });
        });
    }
}
exports.default = bot;
//# sourceMappingURL=bot.js.map
//# sourceMappingURL=bot.js.map
//# sourceMappingURL=bot.js.map