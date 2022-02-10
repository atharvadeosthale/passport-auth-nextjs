import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import User from "../models/User";
import jwt from "jsonwebtoken";

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/api/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const obj = await User.findOne({ email: profile.email });
        if (!obj) {
          // create new user
          const newUser = new User({
            email: profile.email,
            name: profile.displayName,
            accessToken,
          });
          await newUser.save();
          const token = await jwt.sign(
            {
              id: newUser._id,
              created: Date.now().toString(),
            },
            process.env.JWT_SECRET
          );
          newUser.tokens.push(token);
          await newUser.save();
          done(null, newUser, { message: "Auth successful", token });
        } else {
          // login existing user
          const token = await jwt.sign(
            {
              id: obj._id,
              created: Date.now().toString(),
            },
            process.env.JWT_SECRET
          );
          obj.tokens.push(token);
          await obj.save();
          done(null, obj, { message: "Auth successful", token });
        }
      } catch (err) {
        console.error(err);
        done(err, false, { message: "Internal server error" });
      }
    }
  )
);
