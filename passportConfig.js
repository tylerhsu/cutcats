const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const models = require('./models');
const COURIER = 'courier';
const GUEST = 'guest';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
}, (accessToken, refreshToken, profile, done) => {
    const email = profile.emails[0].value;

    Promise.all([
        models.Courier.findOne({ email }).exec(),
        models.Guest.findOne({ email }).exec()
    ])
        .then(info => {
            const [courier, guest] = info;
            if (courier) {
                done(null, { type: COURIER, ...courier });
            } else if (guest) {
                done(null, { type: GUEST, ...guest });
            } else {
                done(null, false, { message: `No user with email ${email} was found` });
            }
        })
        .catch(done);
}));

passport.serializeUser((user, done) => {
    done(null, `${user.type}-${user._doc._id}`);
});

passport.deserializeUser((id, done) => {
    const [type, _id] = id.split('-');
    let query;

    if (type === COURIER) {
        query = models.Courier.findOne({ _id: _id }).exec();
    } else if (type === GUEST) {
        query = models.Guest.findOne({ _id: _id }).exec();
    } else {
        done(new Error(`Expected user id ${id} to be prefixed with "${COURIER}-" or "${GUEST}-"`));
    }

    query
        .then(user => {
            done(null, user);
        })
        .catch(done);
});
