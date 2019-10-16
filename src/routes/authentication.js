const express = require('express');
const router = express.Router();

const pool = require('../../database');

const passport = require('passport');
const { isLoggedIn } = require('../lib/auth');


router.get('/registro', (req, res) => {
    res.render('auth/registro');
  });

router.post('/registro', passport.authenticate('local.signup', {
    successRedirect: '/persona',
    failureRedirect: '/registro',
    failureFlash: true
}));

// SINGIN
router.get('/login', (req, res) => {
    res.render('auth/login');
  });
  
  router.post('/login', (req, res, next) => {
    req.check('correo', 'Username is Required').notEmpty();
    req.check('clave', 'Password is Required').notEmpty();
    const errors = req.validationErrors();
    if (errors.length > 0) {
      req.flash('message', errors[0].msg);
      res.redirect('/login');
    }
    passport.authenticate('local.signin', {
      successRedirect: '/profile',
      failureRedirect: '/login',
      failureFlash: true
    })(req, res, next);
  });

  router.get('/logout', (req, res) => {
    req.logOut();
    res.redirect('/');
  });

router.get('/perfil', isLoggedIn, async(req, res) => {
  const persona = await pool.query('select * from Persona  where idCredenciales= ?',[req.user.id]);
 
  res.render('perfil/perfil', { persona});
});

module.exports = router;