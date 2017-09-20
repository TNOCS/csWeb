import path = require('path');
import qs = require('querystring');
import bcrypt = require('bcryptjs');
// import colors = require('colors');
import cors = require('cors');
import express = require('express');
import jwt = require('jwt-simple');
// import moment = require('moment');
// import mongoose = require('mongoose');
import request = require('request');
import Winston = require('winston');
import ApiManager = require('./ApiManager');
import Layer = ApiManager.Layer;
import ILayer = ApiManager.ILayer;
import Feature = ApiManager.Feature;
import Logs = ApiManager.Log;
import BaseConnector = require('./BaseConnector');
import CallbackResult = ApiManager.CallbackResult;
import ApiResult = ApiManager.ApiResult;
import ApiMeta = ApiManager.ApiMeta;
import config = require('./config');
var dateExt = require('../helpers/DateUtils');

/**
 * Authentication API based on Satellizer, which uses a JSON Web Token for access control.
 */
export class AuthAPI {
    public userUrl: string;
    public loginUrl: string;
    public signupUrl: string;

    constructor(private manager: ApiManager.ApiManager, private server: express.Express, private baseUrl: string = "/api") {
        User.manager = manager;
        baseUrl += '/auth/:teamId';
        Winston.info('Authentication REST service: ' + baseUrl);
        this.userUrl = baseUrl + '/me';
        this.loginUrl = baseUrl + '/login';
        this.signupUrl = baseUrl + '/signup';

        // Force HTTPS on Heroku
        if (server.get('env') === 'production') {
            server.use(function(req, res, next) {
                var protocol = req.get('x-forwarded-proto');
                protocol == 'https' ? next() : res.redirect('https://' + req.hostname + req.url);
            });
        }

        //enables cors, used for external swagger requests
        this.server.use(cors());

        // Read user details
        this.server.get(this.userUrl, this.ensureAuthenticated, this.getUser);

        // Update user details
        this.server.put(this.userUrl, this.ensureAuthenticated, this.updateUser);

        // Log in with Email
        this.server.post(this.loginUrl, this.login);

        // Signup
        this.server.post(this.signupUrl, this.signup);

        // Unlink Provider
        this.server.post(this.baseUrl + '/unlink', this.ensureAuthenticated, this.unlinkProvider);

        // Login with Google
        this.server.post(this.baseUrl + '/google', this.googleLogin);

        // Login with Github
        this.server.post(this.baseUrl + '/github', this.githubLogin);

        // Login with LinkedIn
        this.server.post(this.baseUrl + '/linkedin', this.linkedinLogin);

        // Login with Windows Live
        this.server.post(this.baseUrl + '/live', this.windowsLiveLogin);

        // Login with Facebook
        this.server.post(this.baseUrl + '/facebook', this.facebookLogin);

        // Login with Yahoo
        this.server.post(this.baseUrl + '/yahoo', this.yahooLogin);

        // Login with Twitter
        this.server.post(this.baseUrl + '/twitter', this.twitterLogin);

        // Login with Foursquare
        this.server.post(this.baseUrl + '/foursquare', this.foursquareLogin);

        // Login with Twitch
        this.server.post(this.baseUrl + '/twitch', this.twitchLogin);
    }

    /** Read user details */
    private getUser(req: express.Request, res: express.Response) {
        User.findById(req.params.teamId, req['user'], (err: string, user: User) => {
            if (err) {
                Winston.error('Error: couldn\'t find user: team ' + req.params.teamId, ', user ' + req['user']);
                return res.status(401).send({ message: 'Couldn\'t find user.' });
            } else {
                res.send(user);
            }
        });
    }

    /** Update user details */
    private updateUser(req: express.Request, res: express.Response) {
        User.findById(req.params.teamId, req['user'], (err: string, user: User) => {
            if (!user) {
                Winston.warn('Updating user not possible. User not found: Team ' + req.params.teamId, ', user ' + req['user']);
                return res.status(400).send({ message: 'User not found' });
            }
            user.displayName = req.body.displayName || user.displayName;
            user.email = req.body.email || user.email;
            user.save(req.params.teamId, err => {
                res.status(200).end();
            });
        });
    }

    /** Log in with Email */
    private login(req: express.Request, res: express.Response) {
        User.findById(req.params.teamId, req.body.email, (err: string, user: User) => {
            if (!user) {
                return res.status(401).send({ message: 'Wrong email and/or password' });
            }
            user.comparePassword(req.body.password, function(err: Error, isMatch: boolean) {
                if (!isMatch) {
                    return res.status(401).send({ message: 'Wrong email and/or password' });
                }
                res.send({ token: AuthAPI.createJWT(user) });
            });
        });
    }

    /** Signup */
    private signup(req: express.Request, res: express.Response) {
        User.findById(req.params.teamId, req.body.email, (err: string, existingUser: User) => {
            if (existingUser) {
                return res.status(409).send({ message: 'Email is already taken' });
            }
            bcrypt.genSalt(10, function(err, salt) {
                bcrypt.hash(req.body.password, salt, function(err, hash) {
                    var user = new User({
                        displayName: req.body.displayName,
                        email: req.body.email,
                        password: hash
                    });
                    user.save(req.params.teamId, () => {
                        res.send({ token: AuthAPI.createJWT(user) });
                    });
                });
            });
        });
    }

    /** Ensure that the user is authenticated by verifying his authorization token. */
    private ensureAuthenticated(req: express.Request, res: express.Response, next: Function) {
        //Winston.error(`AuthN team ${req.params.teamId}`);
        if (!req.headers['authorization']) {
            return res.status(401).send({ message: 'Please make sure your request has an Authorization header' });
        }
        var auths = req.headers['authorization'];
        var token;
        if (_.isArray(auths)) {
            token = auths[0].split(' ')[1];
        } else {
            token = auths.split(' ')[1];
        }

        //Winston.error(`Token received: ${token}`);
        //var user: IUser = { displayName: 'Erik', email: 'erik.vullings@gmail.com', password: '1234' };
        //var testPayload = AuthAPI.createJWT(user);
        //Winston.error(`Token expected: ${jwt.encode(testPayload, config.TOKEN_SECRET) }`);

        var payload = null;
        try {
            payload = jwt.decode(token, config.TOKEN_SECRET);
        } catch (err) {
            Winston.error(`Error ${err.message}`);
            return res.status(401).send({ message: err.message });
        }

        if (payload.exp <= Date.now()) {
            return res.status(401).send({ message: 'Token has expired' });
        }
        req['user'] = payload.sub;
        //Winston.error('Passed ensureAuthenticated...')
        next();
    }

    /** Generate JSON Web Token */
    private static createJWT(user: IUser) {
        var now = new Date();
        var payload = {
            sub: user.email,
            iat: now.getTime(),
            exp: now.addDays(14).getTime()
        };
        return jwt.encode(payload, config.TOKEN_SECRET);
    }

    /** Unlink the provider */
    private unlinkProvider(req: any, res: express.Response) {
        var provider = req.body.provider;
        var providers = ['facebook', 'foursquare', 'google', 'github', 'linkedin', 'live', 'twitter', 'yahoo'];

        if (providers.indexOf(provider) === -1) {
            return res.status(400).send({ message: 'Unknown OAuth Provider' });
        }

        User.findById(req.params.teamId, req['user'], function(err, user) {
            if (!user) {
                return res.status(400).send({ message: 'User Not Found' });
            }
            user[provider] = undefined;
            user.save(req.params.teamId, err => {
                res.status(200).end();
            });
        });
    }

    /** Login with Google */
    private googleLogin(req: any, res: express.Response) {
        var accessTokenUrl = 'https://accounts.google.com/o/oauth2/token';
        var peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';
        var params = {
            code: req.body.code,
            client_id: req.body.clientId,
            client_secret: config.GOOGLE_SECRET,
            redirect_uri: req.body.redirectUri,
            grant_type: 'authorization_code'
        };

        // Step 1. Exchange authorization code for access token.
        request.post(accessTokenUrl, { json: true, form: params }, function(err, response, token) {
            var accessToken = token.access_token;
            var headers: {[key: string]:any} = { Authorization: 'Bearer ' + accessToken };

            // Step 2. Retrieve profile information about the current user.
            request.get({ url: peopleApiUrl, headers: headers, json: true }, function(err, response, profile) {
                if (profile.error) {
                    return res.status(500).send({ message: profile.error.message });
                }
                // Step 3a. Link user accounts.
                if (req.headers.authorization) {
                    User.findOne(req.params.teamId, { google: profile.sub }, function(err, existingUser) {
                        if (existingUser) {
                            return res.status(409).send({ message: 'There is already a Google account that belongs to you' });
                        }
                        var token = req.headers.authorization.split(' ')[1];
                        var payload = jwt.decode(token, config.TOKEN_SECRET);
                        User.findById(req.params.teamId, payload.sub, function(err, user) {
                            if (!user) {
                                return res.status(400).send({ message: 'User not found' });
                            }
                            user.google = profile.sub;
                            user.picture = user.picture || profile.picture.replace('sz=50', 'sz=200');
                            user.displayName = user.displayName || profile.name;
                            user.save(req.params.teamId, () => {
                                var token = AuthAPI.createJWT(user);
                                res.send({ token: token });
                            });
                        });
                    });
                } else {
                    // Step 3b. Create a new user account or return an existing one.
                    User.findOne(req.params.teamId, { google: profile.sub }, function(err, existingUser) {
                        if (existingUser) {
                            return res.send({ token: AuthAPI.createJWT(existingUser) });
                        }
                        var user = new User();
                        user.google = profile.sub;
                        user.picture = profile.picture.replace('sz=50', 'sz=200');
                        user.displayName = profile.name;
                        user.save(req.params.teamId, err => {
                            var token = AuthAPI.createJWT(user);
                            res.send({ token: token });
                        });
                    });
                }
            });
        });
    }

    // Login with Github
    private githubLogin(req: any, res: express.Response) {
        var accessTokenUrl = 'https://github.com/login/oauth/access_token';
        var userApiUrl = 'https://api.github.com/user';
        var params = {
            code: req.body.code,
            client_id: req.body.clientId,
            client_secret: config.GITHUB_SECRET,
            redirect_uri: req.body.redirectUri
        };

        // Step 1. Exchange authorization code for access token.
        request.get({ url: accessTokenUrl, qs: params }, function(err, response, accessToken) {
            accessToken = qs.parse(accessToken);
            var headers: {[key: string]:any}  = { 'User-Agent': 'Satellizer' };

            // Step 2. Retrieve profile information about the current user.
            request.get({ url: userApiUrl, qs: accessToken, headers: headers, json: true }, function(err, response, profile) {

                // Step 3a. Link user accounts.
                if (req.headers.authorization) {
                    User.findOne(req.params.teamId, { github: profile.id }, function(err, existingUser) {
                        if (existingUser) {
                            return res.status(409).send({ message: 'There is already a GitHub account that belongs to you' });
                        }
                        var token = req.headers.authorization.split(' ')[1];
                        var payload = jwt.decode(token, config.TOKEN_SECRET);
                        User.findById(req.params.teamId, payload.sub, function(err, user) {
                            if (!user) {
                                return res.status(400).send({ message: 'User not found' });
                            }
                            user.github = profile.id;
                            user.picture = user.picture || profile.avatar_url;
                            user.displayName = user.displayName || profile.name;
                            user.save(req.params.teamId, err => {
                                var token = AuthAPI.createJWT(user);
                                res.send({ token: token });
                            });
                        });
                    });
                } else {
                    // Step 3b. Create a new user account or return an existing one.
                    User.findOne(req.params.teamId, { github: profile.id }, function(err, existingUser) {
                        if (existingUser) {
                            var token = AuthAPI.createJWT(existingUser);
                            return res.send({ token: token });
                        }
                        var user = new User();
                        user.github = profile.id;
                        user.picture = profile.avatar_url;
                        user.displayName = profile.name;
                        user.save(req.params.teamId, err => {
                            var token = AuthAPI.createJWT(user);
                            res.send({ token: token });
                        });
                    });
                }
            });
        });
    }

    /** Login with LinkedIn */
    private linkedinLogin(req: any, res: express.Response) {
        var accessTokenUrl = 'https://www.linkedin.com/uas/oauth2/accessToken';
        var peopleApiUrl = 'https://api.linkedin.com/v1/people/~:(id,first-name,last-name,email-address,picture-url)';
        var params = {
            code: req.body.code,
            client_id: req.body.clientId,
            client_secret: config.LINKEDIN_SECRET,
            redirect_uri: req.body.redirectUri,
            grant_type: 'authorization_code'
        };

        // Step 1. Exchange authorization code for access token.
        request.post(accessTokenUrl, { form: params, json: true }, function(err, response, body) {
            if (response.statusCode !== 200) {
                return res.status(response.statusCode).send({ message: body.error_description });
            }
            var params = {
                oauth2_access_token: body.access_token,
                format: 'json'
            };

            // Step 2. Retrieve profile information about the current user.
            request.get({ url: peopleApiUrl, qs: params, json: true }, function(err, response, profile) {

                // Step 3a. Link user accounts.
                if (req.headers.authorization) {
                    User.findOne(req.params.teamId, { linkedin: profile.id }, function(err, existingUser) {
                        if (existingUser) {
                            return res.status(409).send({ message: 'There is already a LinkedIn account that belongs to you' });
                        }
                        var token = req.headers.authorization.split(' ')[1];
                        var payload = jwt.decode(token, config.TOKEN_SECRET);
                        User.findById(req.params.teamId, payload.sub, function(err, user) {
                            if (!user) {
                                return res.status(400).send({ message: 'User not found' });
                            }
                            user.linkedin = profile.id;
                            user.picture = user.picture || profile.pictureUrl;
                            user.displayName = user.displayName || profile.firstName + ' ' + profile.lastName;
                            user.save(req.params.teamId, err => {
                                var token = AuthAPI.createJWT(user);
                                res.send({ token: token });
                            });
                        });
                    });
                } else {
                    // Step 3b. Create a new user account or return an existing one.
                    User.findOne(req.params.teamId, { linkedin: profile.id }, function(err, existingUser) {
                        if (existingUser) {
                            return res.send({ token: AuthAPI.createJWT(existingUser) });
                        }
                        var user = new User();
                        user.linkedin = profile.id;
                        user.picture = profile.pictureUrl;
                        user.displayName = profile.firstName + ' ' + profile.lastName;
                        user.save(req.params.teamId, err => {
                            var token = AuthAPI.createJWT(user);
                            res.send({ token: token });
                        });
                    });
                }
            });
        });
    }

    /** Login with Windows Live */
    private windowsLiveLogin(req: any, res: express.Response) {
        async.waterfall([
            // Step 1. Exchange authorization code for access token.
            function(done) {
                var accessTokenUrl = 'https://login.live.com/oauth20_token.srf';
                var params = {
                    code: req.body.code,
                    client_id: req.body.clientId,
                    client_secret: config.WINDOWS_LIVE_SECRET,
                    redirect_uri: req.body.redirectUri,
                    grant_type: 'authorization_code'
                };
                request.post(accessTokenUrl, { form: params, json: true }, function(err, response, accessToken) {
                    done(null, accessToken);
                });
            },
            // Step 2. Retrieve profile information about the current user.
            function(accessToken, done) {
                var profileUrl = 'https://apis.live.net/v5.0/me?access_token=' + accessToken.access_token;
                request.get({ url: profileUrl, json: true }, function(err, response, profile) {
                    done(err, profile);
                });
            },
            function(profile) {
                // Step 3a. Link user accounts.
                if (req.headers.authorization) {
                    User.findOne(req.params.teamId, { live: profile.id }, function(err, user) {
                        if (user) {
                            return res.status(409).send({ message: 'There is already a Windows Live account that belongs to you' });
                        }
                        var token = req.headers.authorization.split(' ')[1];
                        var payload = jwt.decode(token, config.TOKEN_SECRET);
                        User.findById(req.params.teamId, payload.sub, function(err, existingUser) {
                            if (!existingUser) {
                                return res.status(400).send({ message: 'User not found' });
                            }
                            existingUser.live = profile.id;
                            existingUser.displayName = existingUser.displayName || profile.name;
                            existingUser.save(req.params.teamId, err => {
                                var token = AuthAPI.createJWT(existingUser);
                                res.send({ token: token });
                            });
                        });
                    });
                } else {
                    // Step 3b. Create a new user or return an existing account.
                    User.findOne(req.params.teamId, { live: profile.id }, function(err, user) {
                        if (user) {
                            return res.send({ token: AuthAPI.createJWT(user) });
                        }
                        var newUser = new User();
                        newUser.live = profile.id;
                        newUser.displayName = profile.name;
                        newUser.save(req.params.teamId, err => {
                            var token = AuthAPI.createJWT(newUser);
                            res.send({ token: token });
                        });
                    });
                }
            }
        ]);
    }

    /** Login with Facebook */
    private facebookLogin(req: any, res: express.Response) {
        var accessTokenUrl = 'https://graph.facebook.com/v2.3/oauth/access_token';
        var graphApiUrl = 'https://graph.facebook.com/v2.3/me';
        var params = {
            code: req.body.code,
            client_id: req.body.clientId,
            client_secret: config.FACEBOOK_SECRET,
            redirect_uri: req.body.redirectUri
        };

        // Step 1. Exchange authorization code for access token.
        request.get({ url: accessTokenUrl, qs: params, json: true }, function(err, response, accessToken) {
            if (response.statusCode !== 200) {
                return res.status(500).send({ message: accessToken.error.message });
            }

            // Step 2. Retrieve profile information about the current user.
            request.get({ url: graphApiUrl, qs: accessToken, json: true }, function(err, response, profile) {
                if (response.statusCode !== 200) {
                    return res.status(500).send({ message: profile.error.message });
                }
                if (req.headers.authorization) {
                    User.findOne(req.params.teamId, { facebook: profile.id }, function(err, existingUser) {
                        if (existingUser) {
                            return res.status(409).send({ message: 'There is already a Facebook account that belongs to you' });
                        }
                        var token = req.headers.authorization.split(' ')[1];
                        var payload = jwt.decode(token, config.TOKEN_SECRET);
                        User.findById(req.params.teamId, payload.sub, function(err, user) {
                            if (!user) {
                                return res.status(400).send({ message: 'User not found' });
                            }
                            user.facebook = profile.id;
                            user.picture = user.picture || 'https://graph.facebook.com/v2.3/' + profile.id + '/picture?type=large';
                            user.displayName = user.displayName || profile.name;
                            user.save(req.params.teamId, err => {
                                var token = AuthAPI.createJWT(user);
                                res.send({ token: token });
                            });
                        });
                    });
                } else {
                    // Step 3b. Create a new user account or return an existing one.
                    User.findOne(req.params.teamId, { facebook: profile.id }, function(err, existingUser) {
                        if (existingUser) {
                            var token = AuthAPI.createJWT(existingUser);
                            return res.send({ token: token });
                        }
                        var user = new User();
                        user.facebook = profile.id;
                        user.picture = 'https://graph.facebook.com/' + profile.id + '/picture?type=large';
                        user.displayName = profile.name;
                        user.save(req.params.teamId, err => {
                            var token = AuthAPI.createJWT(user);
                            res.send({ token: token });
                        });
                    });
                }
            });
        });
    }

    /** Login with Yahoo */
    private yahooLogin(req: any, res: express.Response) {
        var accessTokenUrl = 'https://api.login.yahoo.com/oauth2/get_token';
        var clientId = req.body.clientId;
        var clientSecret = config.YAHOO_SECRET;
        var formData = {
            code: req.body.code,
            redirect_uri: req.body.redirectUri,
            grant_type: 'authorization_code'
        };
        var headers: {[key: string]:any} = { Authorization: 'Basic ' + new Buffer(clientId + ':' + clientSecret).toString('base64') };

        // Step 1. Exchange authorization code for access token.
        request.post({ url: accessTokenUrl, form: formData, headers: headers, json: true }, function(err, response, body) {
            var socialApiUrl = 'https://social.yahooapis.com/v1/user/' + body.xoauth_yahoo_guid + '/profile?format=json';
            var headers: {[key: string]:any} = { Authorization: 'Bearer ' + body.access_token };

            // Step 2. Retrieve profile information about the current user.
            request.get({ url: socialApiUrl, headers: headers, json: true }, function(err, response, body) {

                // Step 3a. Link user accounts.
                if (req.headers.authorization) {
                    User.findOne(req.params.teamId, { yahoo: body.profile.guid }, function(err, existingUser) {
                        if (existingUser) {
                            return res.status(409).send({ message: 'There is already a Yahoo account that belongs to you' });
                        }
                        var token = req.headers.authorization.split(' ')[1];
                        var payload = jwt.decode(token, config.TOKEN_SECRET);
                        User.findById(req.params.teamId, payload.sub, function(err, user) {
                            if (!user) {
                                return res.status(400).send({ message: 'User not found' });
                            }
                            user.yahoo = body.profile.guid;
                            user.displayName = user.displayName || body.profile.nickname;
                            user.save(req.params.teamId, err => {
                                var token = AuthAPI.createJWT(user);
                                res.send({ token: token });
                            });
                        });
                    });
                } else {
                    // Step 3b. Create a new user account or return an existing one.
                    User.findOne(req.params.teamId, { yahoo: body.profile.guid }, function(err, existingUser) {
                        if (existingUser) {
                            return res.send({ token: AuthAPI.createJWT(existingUser) });
                        }
                        var user = new User();
                        user.yahoo = body.profile.guid;
                        user.displayName = body.profile.nickname;
                        user.save(req.params.teamId, err => {
                            var token = AuthAPI.createJWT(user);
                            res.send({ token: token });
                        });
                    });
                }
            });
        });
    }

    /** Login with Twitter */
    private twitterLogin(req: any, res: express.Response) {
        var requestTokenUrl = 'https://api.twitter.com/oauth/request_token';
        var accessTokenUrl = 'https://api.twitter.com/oauth/access_token';
        var profileUrl = 'https://api.twitter.com/1.1/users/show.json?screen_name=';

        // Part 1 of 2: Initial request from Satellizer.
        if (!req.body.oauth_token || !req.body.oauth_verifier) {
            var requestTokenOauth = {
                consumer_key: config.TWITTER_KEY,
                consumer_secret: config.TWITTER_SECRET,
                callback: req.body.redirectUri
            };

            // Step 1. Obtain request token for the authorization popup.
            request.post({ url: requestTokenUrl, oauth: requestTokenOauth }, function(err, response, body) {
                var oauthToken = qs.parse(body);

                // Step 2. Send OAuth token back to open the authorization screen.
                res.send(oauthToken);
            });
        } else {
            // Part 2 of 2: Second request after Authorize app is clicked.
            var accessTokenOauth = {
                consumer_key: config.TWITTER_KEY,
                consumer_secret: config.TWITTER_SECRET,
                token: req.body.oauth_token,
                verifier: req.body.oauth_verifier
            };

            // Step 3. Exchange oauth token and oauth verifier for access token.
            request.post({ url: accessTokenUrl, oauth: accessTokenOauth }, function(err, response, accessToken) {

                accessToken = qs.parse(accessToken);

                var profileOauth = {
                    consumer_key: config.TWITTER_KEY,
                    consumer_secret: config.TWITTER_SECRET,
                    oauth_token: accessToken.oauth_token
                };

                // Step 4. Retrieve profile information about the current user.
                request.get({
                    url: profileUrl + accessToken.screen_name,
                    oauth: profileOauth,
                    json: true
                }, function(err, response, profile) {

                    // Step 5a. Link user accounts.
                    if (req.headers.authorization) {
                        User.findOne(req.params.teamId, { twitter: profile.id }, function(err, existingUser) {
                            if (existingUser) {
                                return res.status(409).send({ message: 'There is already a Twitter account that belongs to you' });
                            }

                            var token = req.headers.authorization.split(' ')[1];
                            var payload = jwt.decode(token, config.TOKEN_SECRET);

                            User.findById(req.params.teamId, payload.sub, function(err, user) {
                                if (!user) {
                                    return res.status(400).send({ message: 'User not found' });
                                }

                                user.twitter = profile.id;
                                user.displayName = user.displayName || profile.name;
                                user.picture = user.picture || profile.profile_image_url.replace('_normal', '');
                                user.save(req.params.teamId, err => {
                                    res.send({ token: AuthAPI.createJWT(user) });
                                });
                            });
                        });
                    } else {
                        // Step 5b. Create a new user account or return an existing one.
                        User.findOne(req.params.teamId, { twitter: profile.id }, function(err, existingUser) {
                            if (existingUser) {
                                return res.send({ token: AuthAPI.createJWT(existingUser) });
                            }

                            var user = new User();
                            user.twitter = profile.id;
                            user.displayName = profile.name;
                            user.picture = profile.profile_image_url.replace('_normal', '');
                            user.save(req.params.teamId, err => {
                                res.send({ token: AuthAPI.createJWT(user) });
                            });
                        });
                    }
                });
            });
        }
    }

    /** Login with Foursquare */
    private foursquareLogin(req: any, res: express.Response) {
        var accessTokenUrl = 'https://foursquare.com/oauth2/access_token';
        var profileUrl = 'https://api.foursquare.com/v2/users/self';
        var formData = {
            code: req.body.code,
            client_id: req.body.clientId,
            client_secret: config.FOURSQUARE_SECRET,
            redirect_uri: req.body.redirectUri,
            grant_type: 'authorization_code'
        };

        // Step 1. Exchange authorization code for access token.
        request.post({ url: accessTokenUrl, form: formData, json: true }, function(err, response, body) {
            var params = {
                v: '20140806',
                oauth_token: body.access_token
            };

            // Step 2. Retrieve information about the current user.
            request.get({ url: profileUrl, qs: params, json: true }, function(err, response, profile) {
                profile = profile.response.user;

                // Step 3a. Link user accounts.
                if (req.headers.authorization) {
                    User.findOne(req.params.teamId, { foursquare: profile.id }, function(err, existingUser) {
                        if (existingUser) {
                            return res.status(409).send({ message: 'There is already a Foursquare account that belongs to you' });
                        }
                        var token = req.headers.authorization.split(' ')[1];
                        var payload = jwt.decode(token, config.TOKEN_SECRET);
                        User.findById(req.params.teamId, payload.sub, function(err, user) {
                            if (!user) {
                                return res.status(400).send({ message: 'User not found' });
                            }
                            user.foursquare = profile.id;
                            user.picture = user.picture || profile.photo.prefix + '300x300' + profile.photo.suffix;
                            user.displayName = user.displayName || profile.firstName + ' ' + profile.lastName;
                            user.save(req.params.teamId, err => {
                                var token = AuthAPI.createJWT(user);
                                res.send({ token: token });
                            });
                        });
                    });
                } else {
                    // Step 3b. Create a new user account or return an existing one.
                    User.findOne(req.params.teamId, { foursquare: profile.id }, function(err, existingUser) {
                        if (existingUser) {
                            var token = AuthAPI.createJWT(existingUser);
                            return res.send({ token: token });
                        }
                        var user = new User();
                        user.foursquare = profile.id;
                        user.picture = profile.photo.prefix + '300x300' + profile.photo.suffix;
                        user.displayName = profile.firstName + ' ' + profile.lastName;
                        user.save(req.params.teamId, err => {
                            var token = AuthAPI.createJWT(user);
                            res.send({ token: token });
                        });
                    });
                }
            });
        });
    }

    /** Login with Twitch */
    private twitchLogin(req: any, res: express.Response) {
        var accessTokenUrl = 'https://api.twitch.tv/kraken/oauth2/token';
        var profileUrl = 'https://api.twitch.tv/kraken/user';
        var formData = {
            code: req.body.code,
            client_id: req.body.clientId,
            client_secret: config.TWITCH_SECRET,
            redirect_uri: req.body.redirectUri,
            grant_type: 'authorization_code'
        };

        // Step 1. Exchange authorization code for access token.
        request.post({ url: accessTokenUrl, form: formData, json: true }, function(err, response, accessToken) {
            var params = {
                oauth_token: accessToken.access_token
            };

            // Step 2. Retrieve information about the current user.
            request.get({ url: profileUrl, qs: params, json: true }, function(err, response, profile) {
                // Step 3a. Link user accounts.
                if (req.headers.authorization) {
                    User.findOne(req.params.teamId, { twitch: profile._id }, function(err, existingUser) {
                        if (existingUser) {
                            return res.status(409).send({ message: 'There is already a Twitch account that belongs to you' });
                        }
                        var token = req.headers.authorization.split(' ')[1];
                        var payload = jwt.decode(token, config.TOKEN_SECRET);
                        User.findById(req.params.teamId, payload.sub, function(err, user: User) {
                            if (!user) {
                                return res.status(400).send({ message: 'User not found' });
                            }
                            user.twitch = profile._id;
                            user.picture = user.picture || profile.logo;
                            user.displayName = user.displayName || profile.name;
                            user.email = user.email || profile.email;
                            user.save(req.params.teamId, err => {
                                var token = AuthAPI.createJWT(user);
                                res.send({ token: token });
                            });
                        });
                    });
                } else {
                    // Step 3b. Create a new user account or return an existing one.
                    User.findOne(req.params.teamId, { twitch: profile._id }, function(err, existingUser) {
                        if (existingUser) {
                            var token = AuthAPI.createJWT(existingUser);
                            return res.send({ token: token });
                        }
                        var user = new User();
                        user.twitch = profile._id;
                        user.picture = profile.logo;
                        user.displayName = profile.name;
                        user.email = profile.email;
                        user.save(req.params.teamId, err => {
                            var token = AuthAPI.createJWT(user);
                            res.send({ token: token });
                        });
                    });
                }
            });
        });
    }

}

export interface IUser {
    email: string;
    password?: string;
    displayName?: string;
    roles?: string;
    picture?: string;
    facebook?: string;
    foursquare?: string;
    google?: string;
    github?: string;
    linkedin?: string;
    live?: string;
    yahoo?: string;
    twitter?: string;
    twitch?: string;
}

export class User extends Feature implements IUser {
    static manager: ApiManager.ApiManager;

    // TODO Do we need to emove the pwd from the User object, even though it is hashed?
    get password() { return this.properties['password']; }
    set password(value: string) { this.properties['password'] = value; }

    get email() { return this.id; }
    set email(value: string) { this.id = value.toLowerCase(); }

    get displayName() { return this.properties['displayName']; }
    set displayName(value: string) { this.properties['displayName'] = value; }

    get roles() { return this.properties['roles']; }
    set roles(value: string) { this.properties['roles'] = value; }

    get picture() { return this.properties['picture']; }
    set picture(value: string) { this.properties['picture'] = value; }

    get facebook() { return this.properties['facebook']; }
    set facebook(value: string) { this.properties['facebook'] = value; }

    get foursquare() { return this.properties['foursquare']; }
    set foursquare(value: string) { this.properties['foursquare'] = value; }

    get google() { return this.properties['google']; }
    set google(value: string) { this.properties['google'] = value; }

    get github() { return this.properties['github']; }
    set github(value: string) { this.properties['github'] = value; }

    get linkedin() { return this.properties['linkedin']; }
    set linkedin(value: string) { this.properties['linkedin'] = value; }

    get live() { return this.properties['live']; }
    set live(value: string) { this.properties['live'] = value; }

    get yahoo() { return this.properties['yahoo']; }
    set yahoo(value: string) { this.properties['yahoo'] = value; }

    get twitter() { return this.properties['twitter']; }
    set twitter(value: string) { this.properties['twitter'] = value; }

    get twitch() { return this.properties['twitch']; }
    set twitch(value: string) { this.properties['twitch'] = value; }

    constructor(user?: IUser) {
        super();
        this.properties = {};
        if (user) {
            this.email = user.email;
            this.password = user.password;
            this.displayName = user.displayName;
            if (user.roles) this.roles = user.roles;
            if (user.picture) this.picture = user.picture;
        };
    }

    /** Get the team layer with users based on the teamId. */
    private static getTeam(teamId: string, callback: (err: string, team: Layer) => void) {
        User.manager.getLayer(teamId, <ApiMeta>{}, (cb: CallbackResult) => {
            if (cb.result !== ApiResult.OK) {
                User.manager.addUpdateLayer(<ILayer>{ id: teamId, storage: 'file', type: 'dynamicgeojson' }, <ApiMeta>{ source: 'auth' }, (cb2) => {
                    callback(null, cb2.layer);
                });
            }
            else {
                callback(null, cb.layer);
            }
        });
    }

    /** Find the user by ID (i.e. email) */
    static findById(teamId: string, id: string, callback: (err: string, user: User) => void) {
        User.getTeam(teamId, (err, team) => {
            if (err) {
                callback(err, null);
            } else {
                var found: User;
                team.features.some(user => {
                    if (user.id !== id) return false;
                    found = new User({ email: user.id });
                    found.properties = user.properties;
                    return true;
                });
                if (found)
                    callback('', found);
                else
                    callback('User not found', null);
            }
        });
    }

    /** Find one user by key */
    static findOne(teamId: string, keys: { [key: string]: string }, callback: (err: string, user: User) => void) {
        var key = keys[0];
        var val = keys[key];
        User.getTeam(teamId, (err, team) => {
            if (err) {
                callback(err, null);
            } else {
                team.features.some(user => {
                    if (!user.properties || !user.properties.hasOwnProperty(key) || user.properties[key] !== val) return false;
                    callback('', new User(<User>user));
                    return true;
                });
            }
        });
    }

    static load() {

    }

    /** Save the user details */
    save(teamId: string, callback: (err: string) => void) {
        User.manager.addFeature(teamId, this, <ApiMeta>{ source: 'auth' }, (cb: CallbackResult) => {
            if (cb.result === ApiResult.OK) {
                callback('');
                //User.manager.updateFeature()
            } else {
                callback(cb.error);
            }
        });
    }

    /** Compare the received password with the known password */
    comparePassword(password: string, done: (err: Error, isMatch: boolean) => void) {
        bcrypt.compare(password, this.password, (err: Error, isMatch: boolean) => {
            done(err, isMatch);
        });
    }
}
