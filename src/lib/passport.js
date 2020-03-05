const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const pool = require('../../database');
const helpers = require('./helpers');

passport.use('local.signin', new LocalStrategy({
  usernameField: 'correo',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, correo, password, done) => {
  console.log(correo)
  
  const rows = await pool.query('select * from tbladmin_users as u inner join tbladmin_roles_users as rol where rol.id_role=1 and u.correo = ?', [correo]);
  if (rows.length > 0) {
    const user = rows[0];
     
    const validPassword = await helpers.matchPassword(password, user.password)
    console.log(validPassword);
    if (validPassword) {
      done(null, user, req.flash('success', 'Welcome ' + user.correo));
      console.log(validPassword);
    } else {
      done(null, false, req.flash('message', 'Contraseña incorrecta'));
    }
  } else {
    return done(null, false, req.flash('message', 'Ha ocurrido un error con su usuario favor verifique sus datos'));
  }
}));

passport.use('local.signup', new LocalStrategy({
  usernameField: 'correo',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, correo, password, done) => {
  const {nombre, apellido, date} = req.body;

  // obtengo la direccion ip del usuario
  //var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  //rol 1 es cliente
  var rol=1;
  var permiso1=1;
  var permiso2=2;
  let newUser = {
    correo,
    password
  };
  newUser.password = await helpers.encryptPassword(password);
  // almaceno los datos en la tabla user
  const result = await pool.query('insert into tbladmin_users SET ? ', newUser);
  newUser.id = result.insertId;
  await pool.query('insert into tbladmin_roles_users(id_role,id_user,creado,actualizado) values(?,?,current_timestamp(),current_timestamp())', [rol,result.insertId]);
  await pool.query('insert  tblusuarios_persona(id_user,nombre, apellido,fecha_nacimiento) values(?,?,?,?)', [result.insertId, nombre, apellido, date]);
  id_p= await pool.query('select id from tblusuarios_persona where id_user=?', [result.insertId]);
  console.log(id_p[0].id)
  await pool.query('insert  tblusuarios_clientes(id_persona) values(?)', [id_p[0].id]);
  return done(null, newUser);
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const rows = await pool.query('select * from tbladmin_users where id = ?', [id]);
  done(null, rows[0]);
});