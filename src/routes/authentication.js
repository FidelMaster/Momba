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

  //detalle del pedido
  router.get('/pedidos/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;
    const estado = await pool.query('select pe.id, pe.estado as nombre, pe.porcentaje as porcentaje from tblpedido_pedido_cliente pc inner join tblpedido_estado as pe on(pc.id_estado=pe.id) where cod_factura=?', [id]);
    const pd = await pool.query('select * from tblpedido_pedido_cliente as pc inner join tblpedido_estado as pe on(pc.id_estado=pe.id) inner join tblventa_factura_detalle  as fdc on(pc.cod_factura=fdc.cod_factura) inner join tblinv_producto as p on(fdc.id_producto=p.id) where pc.cod_factura=?', [id]);
    const persona = await pool.query('select * from tblpedido_pedido_cliente as pc inner join tblusuarios_persona tp on(pc.id_user=tp.id_user) inner join tblusuarios_clientes as tuc on(tuc.id_persona=tp.id) where pc.cod_factura=?', [id])
    const cod = await pool.query('select * from tblpedido_pedido_cliente where cod_factura=?', [id]);
    const totales = await pool.query('select * from tblventa_factura_pago where cod_factura=?', [id]);
    const repartidor= await pool.query('select concat(tp.nombre, " ", tp.apellido) as nombre, trd.modelo_carro,trd.color,trd.placa from tblpedido_pedido_repartidor as tppr inner join tblusuarios_repartidor as tur on(tppr.cod_repartidor=tur.id) inner join tblusuarios_persona as tp on(tur.id_persona=tp.id) inner join tblusuarios_repartidor_detalle as trd on(tppr.cod_repartidor=trd.id_repartidor) where tppr.cod_pedido=? ', [id]);
    
    if (repartidor.length>0)
    {
      res.render('pedidos/index', { pd, persona, cod, totales, estado,repartidor });
    }else {

      res.render('pedidos/index', { pd, persona, cod, totales, estado });

    }


 
});
  
// perfil del cliente
router.get('/perfil', isLoggedIn, async(req, res) => {
  const idu=req.user.id;
  const persona = await pool.query('select * from tblusuarios_persona  where id_user= ?',[req.user.id]);
  const pedido = await pool.query('select tc.cod_factura,tc.fecha,tp.total,te.estado, te.porcentaje from tblpedido_pedido_cliente  as tc inner join tblpedido_estado as te on(tc.id_estado=te.id) inner join tblventa_factura_pago as tp on(tc.cod_factura=tp.cod_factura) where tc.id_user=?',[idu])
  
  res.render('perfil/perfil', { persona,pedido});
});

module.exports = router;