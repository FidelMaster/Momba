const express = require('express');
const router = express.Router();
const {check, validationResult} = require('express-validator');

const pool = require('../../database');

const passport = require('passport');
const { isLoggedIn } = require('../lib/auth');


router.get('/registro', (req, res) => {
    res.render('auth/registro');
  });

router.post('/registro', passport.authenticate('local.signup', {
    successRedirect: '/perfil',
    failureRedirect: '/registro',
    failureFlash: true
}));

// SINGIN
router.get('/login', (req, res) => {
    res.render('auth/login');
  });
  
  router.post('/login', (req, res, next) => {
    console.log(req.body)
      check('correo').isEmail();
    const errors = validationResult(req);
    if (errors.length > 0) {
      console.log("entre")
      req.flash('message', errors[0].msg);
      res.redirect('/login');
    }
    passport.authenticate('local.signin', {
      successRedirect: '/perfil',
      failureRedirect: '/login',
      failureFlash: true
    })(req, res, next);
  });
//Matar la sesion
  router.get('/logout', (req, res) => {
    req.logOut();
    res.redirect('/');
  });
  
// perfil del cliente
router.get('/perfil', isLoggedIn, async(req, res) => {
  const idu=req.user.id;
  const persona = await pool.query('select * from tblusuarios_persona  where id_user= ?',[req.user.id]);
  const pedido = await pool.query('select * from tblpedido_pedido_cliente where id_user=?',[idu])
  res.render('perfil/perfil', { persona,pedido});
});

module.exports = router;