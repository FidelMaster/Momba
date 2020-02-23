const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const pool = require('../../database');
const helpers = require('./helpers');

passport.use('local.signin', new LocalStrategy({
  usernameField: 'correo',
  passwordField: 'clave',
  passReqToCallback: true
}, async (req, correo, clave, done) => {
  console.log(correo)
  
  const rows = await pool.query('SELECT * FROM credenciales WHERE correo = ?', [correo]);
  if (rows.length > 0) {
    const user = rows[0];
     
    const validPassword = await helpers.matchPassword(clave, user.clave)
    console.log(validPassword);
    if (validPassword) {
      done(null, user, req.flash('success', 'Welcome ' + user.correo));
      console.log(validPassword);
    } else {
      console.log("esta mal");
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
  await pool.query('update Credenciales SET idtipo=?  where id=?', [3,result.insertId]);
  return done(null, newUser);
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const rows = await pool.query('SELECT * FROM credenciales WHERE id = ?', [id]);
  done(null, rows[0]);
});