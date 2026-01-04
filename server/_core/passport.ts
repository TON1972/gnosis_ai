import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { Express } from "express";
import passport from "passport";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as GoogleStrategy } from "passport-google-oidc";
import { Strategy as LocalStrategy } from "passport-local";
import { users } from "../../drizzle/schema";
import { getDb } from "../db";
import { ENV } from "./env";

/*
 * Configure LocalStrategy for login using e-mail and password.
 */
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  const db = await getDb();
  if (!db) throw new Error("Database not available.");

  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (user && user.password && await bcrypt.compare(password, user.password)) {
    return done(null, user);
  } else {
    return done(null, false, {
      message: "Incorrect e-mail or password.",
    });
  }
}));

/*
 * Configure GoogleStrategy for login using Google.
 */
passport.use(new GoogleStrategy({
  clientID: ENV.googleClientId,
  clientSecret: ENV.googleClientSecret,
  callbackURL: ENV.appUrl + "/api/auth/callback/google",
  scope: ["profile", "email"],
}, async (issuer: any, profile: any, done: any) => {
  const email = profile.emails?.[0]?.value;
  if (!email) return done(new Error("Google account without email address."));

  const db = await getDb();
  if (!db) throw new Error("Database not available.");

  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (user) {
    return done(null, user);
  } else {
    const [result] = await db
      .insert(users)
      .values({
        name: profile.displayName,
        email,
      })
      .$returningId();

    const [newUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, result.id))
      .limit(1);

    return done(null, newUser);
  }
}));

/*
 * Configure FacebookStrategy for login using Facebook.
 */
passport.use(new FacebookStrategy({
  clientID: ENV.facebookClientId,
  clientSecret: ENV.facebookClientSecret,
  callbackURL: ENV.appUrl + "/api/auth/callback/facebook",
  profileFields: ["displayName", "emails"],
  state: true,
}, async (accessToken, refreshToken, profile, done) => {
  const email = profile.emails?.[0]?.value;
  if (!email) return done(new Error("Facebook account without email address."));

  const db = await getDb();
  if (!db) throw new Error("Database not available.");

  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (user) {
    return done(null, user);
  } else {
    const [result] = await db
      .insert(users)
      .values({
        name: profile.displayName,
        email,
      })
      .$returningId();

    const [newUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, result.id))
      .limit(1);

    return done(null, newUser);
  }
}));

/*
 * Configure Passport.js.
 */
export const configurePassport = (app: Express) => {
  app.use(passport.initialize());
  app.use(passport.session());

  app.post("/api/auth/login/password", passport.authenticate("local"), (req, res) => {
    return res.json({ success: true });
  });

  app.get("/api/auth/login/google", passport.authenticate("google"));
  app.get("/api/auth/callback/google", passport.authenticate("google", {
    successRedirect: ENV.appUrl + "/dashboard",
    failureRedirect: ENV.appUrl + "/auth?error=google",
  }));

  app.get("/api/auth/login/facebook", passport.authenticate("facebook"));
  app.get("/api/auth/callback/facebook", passport.authenticate("facebook", {
    successRedirect: ENV.appUrl + "/dashboard",
    failureRedirect: ENV.appUrl + "/auth?error=facebook",
  }));

  app.post("/api/auth/logout", async (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      return res.status(204).end();
    });
  });
};

// Provide serialization and deserialization methods.
passport.serializeUser((user, done) => {
  return done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  const db = await getDb();
  if (!db) throw new Error("Database not available.");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return done(null, user);
});
