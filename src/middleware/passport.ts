import bcrypt from "bcrypt";
import passport from "passport";
import passportJWT from "passport-jwt";
import { Strategy as LocalStrategy } from "passport-local";

import { RESPONSE_MESSAGE } from "../common/constants";
import { isNullOrEmpty } from "../common/utils";
import User from "../models/user.model";

const JWTStrategy = passportJWT.Strategy;
const ExtractJwt = passportJWT.ExtractJwt;

interface JWTPayload {
  user: string;
  iat: number;
  exp: number;
}

passport.use(
  "jwt",
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      secretOrKey: process.env.JWT_SECRET!
    },
    async (jwtPayload: JWTPayload, done: passportJWT.VerifiedCallback) => {
      try {
        const user = await User.findOne({ userCode: jwtPayload.user });
        
        if (user) {
          if (isNullOrEmpty(user.token)) {
            return done(null, false, { message: RESPONSE_MESSAGE.TOKEN_EXPIRED });
          }
          return done(null, user);
        } else {
          return done(null, false, { message: RESPONSE_MESSAGE.USER_NOT_EXIST });
        }
      } catch (error) {
        return done(error, false, { message: RESPONSE_MESSAGE.SERVER_ERROR });
      }
    }
  )
);

passport.use(
  "login",
  new LocalStrategy(
    {
      usernameField: "password",
      passwordField: "password"
    },
    async (_, password: string, done) => {
      try {
        const user = await User.findOne({ userCode: password });

        if (!user) {
          return done(null, false, { message: RESPONSE_MESSAGE.WRONG_PASSWORD });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: RESPONSE_MESSAGE.WRONG_PASSWORD });
        }
        return done(null, user, { message: RESPONSE_MESSAGE.SUCCESS });
      } catch (error) {
        return done(error, false, { message: RESPONSE_MESSAGE.SERVER_ERROR });
      }
    }
  )
);

export default passport;