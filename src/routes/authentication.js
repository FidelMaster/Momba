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
    successRedirect: '/persona',
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

  router.get('/logout', (req, res) => {
    req.logOut();
    res.redirect('/');
  });

router.get('/perfil', isLoggedIn, async(req, res) => {
  const idu=req.user.id;
  cliente=await pool.query('select id from cliente where idPersona=?',[idu]);
   
  const persona = await pool.query('select * from Persona  where id_Credencial= ?',[req.user.id]);
  const pedido =await pool.query('select pc.codVenta,pc.fecha,vct.total,ep.estado from pedido_cliente as pc inner join venta_cliente_total as vct on(pc.codVenta=vct.codVenta) inner join estado_pedido as ep on(pc.idEstado=ep.id) where idCliente=?',[cliente[0].id]);
  console.log(pedido);
  res.render('perfil/perfil', { persona,pedido});
});

module.exports = router;