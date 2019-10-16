const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const pool = require('../../database');
const helpers = require('./helpers');

passport.use('local.signin', new LocalStrategy({
  usernameField: 'correo',
  passwordField: 'clave',
  passReqToCallback: true
}, async (req, correo, clave, done) => {
  const rows = await pool.query('SELECT * FROM Credenciales WHERE correo = ?', [correo]);
  if (rows.length > 0) {
    const user = rows[0];
    const validPassword = await helpers.matchPassword(clave, user.clave)
    if (validPassword) {
      done(null, user, req.flash('success', 'Welcome ' + user.correo));
    } else {
      done(null, false, req.flash('message', 'Incorrect Password'));
    }
  } else {
    return done(null, false, req.flash('message', 'The Username does not exists.'));
  }
}));

passport.use('local.signup', new LocalStrategy({
  usernameField: 'correo',
  passwordField: 'clave',
  passReqToCallback: true
}, async (req, correo, clave, done) => {

  
  let newUser = {
   
    correo,
    clave
  };
  newUser.clave = await helpers.encryptPassword(clave);
  // Saving in the Database
  const result = await pool.query('INSERT INTO Credenciales SET ? ', newUser);
  newUser.id = result.insertId;
  return done(null, newUser);
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const rows = await pool.query('SELECT * FROM Credenciales WHERE id = ?', [id]);
  done(null, rows[0]);
});