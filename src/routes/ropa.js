const express = require('express');
const router = express.Router();
const pool = require('../../database');
const { isLoggedIn } = require('../lib/auth');
const paypal = require('paypal-rest-sdk');
router.get('/contacto', (req, res) => {
  res.render('secciones/contacto');
});


router.get('/detalle/:id', async (req, res) => {
  const { id } = req.params;
  //const idu = req.user.id;
 // cliente = await pool.query('select id from cliente where idPersona=?', [id_p.RowDataPacket.id]);
  //console.log(cliente);
  const talla= await pool.query('select it.id as id,it.nombre as name from tblinv_talla_producto as tp inner join tblinv_tallas as it on(tp.id_talla=it.id) where tp.id_producto=?',id)
  console.log(talla);
  const detalle = await pool.query('select p.id,p.codproducto,p.imagen,p.precio_venta,m.nombre as marca, ma.nombre as material from tblinv_producto as p  left join tblinv_marca as m  on(p.id_marca=m.id) left join tblinv_material as ma on(p.id_marca=ma.id) where p.id=? ', [id]);
 // row = await pool.query('select codigoVenta from venta_cliente where idCliente=? and estado=?', [cliente[0].id, 0]);
 // console.log(row)
//  if (Object.keys(row).length === 0) {
  //  await pool.query('insert venta_cliente(idCliente,fecha,estado) values(?,NOW(),?)', [cliente[0].id, 0]);
  //}



  res.render('secciones/detalle', { detalle,talla });
});

//  Camisas
router.get('/camisas', async (req, res) => {
  const camisas = await pool.query('select * from tblinv_producto where id_categoria=1 ');
  res.render('secciones/camisa', { camisas });

});
// pantalones
router.get('/pantalones', async (req, res) => {
  const pantalon = await pool.query('select pp.id,p.imagen,p.nombre,pp.precio from promociones_producto as pp  inner join producto as p  on(pp.idProducto=p.id) where idCategoria=2');
  res.render('secciones/pantalones', { pantalon });
});
// Gorras
router.get('/Gorras', async (req, res) => {
  const gorras = await pool.query('select pp.id,p.imagen,p.nombre,pp.precio from promociones_producto as pp  inner join producto as p  on(pp.idProducto=p.id) where idCategoria=3');
  res.render('secciones/gorras', { gorras });
});

router.get('/zapatos', async (req, res) => {
  const zapatos = await pool.query('select pp.id,p.imagen,p.nombre,pp.precio from promociones_producto as pp  inner join producto as p  on(pp.idProducto=p.id) where idCategoria=4');
  res.render('secciones/zapatos', { zapatos });
});

router.post('/carrito/agregar/:id', async (req, res) => {
  // this variables, i will get from DOM
  const { talla, cantidad } = req.body;
  const idu = req.user.id;
  const { id } = req.params;
  const estado=0;
  const precio = await pool.query('select precio_venta from tblinv_producto where id=?', [id]);
  console.log(precio);
  const stotal = cantidad * precio[0].precio_venta;
  for (let index = 0; index <cantidad; index++) {
    await pool.query('insert tblcarro_bolsa_cliente(id_user,id_producto,id_talla,subtotal,estado,fecha) values(?,?,?,?,?,NOW())', [idu, id, talla, stotal,estado]);
  
  }
  
  //cliente = await pool.query('select id from cliente where idPersona=?', [idu]);

 // row = await pool.query('select codigoVenta from venta_cliente where idCliente=? and estado=?', [cliente[0].id, 0]);
 
   res.redirect('/camisas');

});


router.post('/contacto/mensaje', async (req, res) => {
  
  
  const {Nombre,Correo,Celular,Mensaje} = req.body;
  console.log(req.body)
  
    await pool.query('insert contacto values(?,?,?,?,now())', [Nombre,Correo,Celular,Mensaje]);
  res.redirect('/contacto');



});
router.get('/carrito', async (req, res) => {
  const idu = req.user.id;
  //cliente = await pool.query('select id from cliente where idPersona=?', [idu]);
  //row = await pool.query('select codigoVenta from venta_cliente where idCliente=? and estado=?', [cliente[0].id, 0]);
  sub = await pool.query('select sum(subtotal) as total from tblcarro_bolsa_cliente where id_user=? and estado=0', [idu]);

  const carro = await pool.query('select cb.id as id_carrito, p.id,p.nombre,p.imagen,p.precio_venta,m.nombre as marca,mat.nombre as material from tblcarro_bolsa_cliente as cb inner join tblinv_producto as p on(cb.id_producto=p.id) left join tblinv_marca as m on(p.id_marca=m.id) left join tblinv_material as mat on(p.id_material=mat.id) where cb.id_user=? and estado=0', [idu]);
  console.log(sub);
  res.render('carro/carro', { carro, sub });
});

router.get('/carrito/eliminar/:id', async (req, res) => {
  const { id } = req.params;
  await pool.query('delete from tblcarro_bolsa_cliente where id=?', [id]);

   res.redirect('/carrito');
});
//Proceso del pago

router.post('/pay', (req, res) => {
  const { cantidad } = req.body;
  console.log("funcion")
  console.log(req.body.total);
  const create_payment_json = {
    "intent": "sale",
    "payer": {
      "payment_method": "paypal"
    },
    "redirect_urls": {
      "return_url": "http://localhost:4000/success",
      "cancel_url": "http://localhost:4000/cancel"
    },
    "transactions": [{
      "item_list": {
        "items": [{
          "name": "Red Sox Hat",
          "sku": "001",
          "price": req.body.total,
          "currency": "USD",
          "quantity": 1
        }]
      },
      "amount": {
        "currency": "USD",
        "total": req.body.total
      },
      "description": "Hat for the best team ever"
    }]
  };

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      throw error;
    } else {
      for (let i = 0; i < payment.links.length; i++) {
        if (payment.links[i].rel === 'approval_url') {
          res.redirect(payment.links[i].href);
        }
      }
    }
  });

});

router.get('/success', async (req, res) => {
  console.log("todo bien ");
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  console.log(req.query)
  const { cantidad } = req.body;
  const idu = req.user.id;
  cliente = await pool.query('select id from cliente where idPersona=?', [idu]);
  console.log(cliente);
  row = await pool.query('select codigoVenta from venta_cliente where idCliente=? and estado=?', [cliente[0].id, 0]);
  console.log(req.body);

  console.log()

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
      "amount": {
        "currency": "USD",
        "total": "40.00"
      }
    }]
  };

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
      console.log(error.response);
      throw error;
    } else {

      pool.query('update venta_cliente set estado =1 where estado=0 and idCliente=?', [cliente[0].id]);

      console.log(row);

      pool.query('insert venta_cliente_total(codVenta,fecha,subTotal,costo_envio,total) values(?,now(),?,?,?)', [row[0].codigoVenta, 0, payment.transactions[0].amount.total, payment.transactions[0].amount.total]);
      pool.query('insert pedido_cliente(codVenta,idCliente,idEstado,fecha) values(?,?,?,now())', [row[0].codigoVenta, cliente[0].id, 4]);
      console.log(JSON.stringify(payment));
      console.log((payment.transactions[0].amount.total));

      res.redirect('/perfil');

    }
  });
});

router.get('/cancel', (req, res) => res.send('Cancelled'));

module.exports = router;