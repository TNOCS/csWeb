class AuthConfig {
    static TOKEN_SECRET = process.env.TOKEN_SECRET || 'JWT Token Secret';
    static MONGO_URI = process.env.MONGO_URI || 'localhost=27017';

    // OAuth 2.0
    static FACEBOOK_SECRET = process.env.FACEBOOK_SECRET || '';
    static FOURSQUARE_SECRET = process.env.FOURSQUARE_SECRET || '';
    static GOOGLE_SECRET = process.env.GOOGLE_SECRET || '';
    static GITHUB_SECRET = process.env.GITHUB_SECRET || '';
    static LINKEDIN_SECRET = process.env.LINKEDIN_SECRET || '';
    static TWITCH_SECRET = process.env.TWITCH_SECRET || '';
    static WINDOWS_LIVE_SECRET = process.env.WINDOWS_LIVE_SECRET || '';
    static YAHOO_SECRET = process.env.YAHOO_SECRET || '';

    // OAuth 1.0
    static TWITTER_KEY = process.env.TWITTER_KEY || '';
    static TWITTER_SECRET = process.env.TWITTER_SECRET || ''
}
export = AuthConfig;
