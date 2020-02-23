const express = require('express');
const router = express.Router();
const pool = require('../../database');
const { isLoggedIn } = require('../lib/auth');
const paypal = require('paypal-rest-sdk');
router.get('/contacto', (req, res) => {
  res.render('secciones/contacto');
});

router.get('/persona', isLoggedIn, (req, res) => {
  res.render('auth/persona');
});



router.post('/persona', async (req, res) => {
  const { nombre, apellido, date, celular } = req.body;
  const id = req.user.id;
  await pool.query('INSERT  Persona(id_Credencial,nombre, apellido,Nacimiento,celular,fechaRegistro) values(?,?,?,?,?,NOW())', [id, nombre, apellido, date, celular]);
  await pool.query('INSERT  cliente(idPersona,numero_Tarjeta,ciudad,Direccion) values(?,null,null,null)', [id]);

  res.redirect('/perfil');
});


router.get('/detalle/:id', async (req, res) => {
  const { id } = req.params;
  const idu = req.user.id;
  cliente = await pool.query('select id from cliente where idPersona=?', [idu]);
  console.log(cliente);
  const detalle = await pool.query('select pp.id,p.imagen,p.nombre,pp.precio,mar.marca,mat.material from promociones_producto as pp  inner join producto as p  on(pp.idProducto=p.id) inner join marca as mar on(p.idMarca=mar.id) inner join material as mat on(p.idMaterial=mat.id) where pp.id=?', [id]);
  row = await pool.query('select codigoVenta from venta_cliente where idCliente=? and estado=?', [cliente[0].id, 0]);
  console.log(row)
  if (Object.keys(row).length === 0) {
    await pool.query('insert venta_cliente(idCliente,fecha,estado) values(?,NOW(),?)', [cliente[0].id, 0]);
  }



  res.render('secciones/detalle', { detalle });
  console.log(detalle)
});

router.get('/camisas', async (req, res) => {
  const camisas = await pool.query('select pp.id,p.imagen,p.nombre,pp.precio from promociones_producto as pp  inner join producto as p  on(pp.idProducto=p.id) where idCategoria=1 ');
  res.render('secciones/camisa', { camisas });
  console.log(camisas)
});

router.get('/pantalones', async (req, res) => {
  const pantalon = await pool.query('select pp.id,p.imagen,p.nombre,pp.precio from promociones_producto as pp  inner join producto as p  on(pp.idProducto=p.id) where idCategoria=2');
  res.render('secciones/pantalones', { pantalon });
});

router.get('/Gorras', async (req, res) => {
  const gorras = await pool.query('select pp.id,p.imagen,p.nombre,pp.precio from promociones_producto as pp  inner join producto as p  on(pp.idProducto=p.id) where idCategoria=3');
  res.render('secciones/gorras', { gorras });
});

router.get('/zapatos', async (req, res) => {
  const zapatos = await pool.query('select pp.id,p.imagen,p.nombre,pp.precio from promociones_producto as pp  inner join producto as p  on(pp.idProducto=p.id) where idCategoria=4');
  res.render('secciones/zapatos', { zapatos });
});

router.post('/carrito/agregar/:id', async (req, res) => {
  console.log("HOLAAAAAAAAAAAAAA");
  console.log(req.body);
  const { talla, cantidad } = req.body;
  console.log(req.body);
  const idu = req.user.id;
  const { id } = req.params;
  cliente = await pool.query('select id from cliente where idPersona=?', [idu]);

  row = await pool.query('select codigoVenta from venta_cliente where idCliente=? and estado=?', [cliente[0].id, 0]);


  precio = await pool.query('select precio from promociones_producto where id=?', [id]);
  stotal = cantidad[0][0] * precio[0].precio;
  await pool.query('insert bolsa_compra_cliente(codVenta,idProducto,talla,cantidad,subTotal,fechas) values(?,?,?,?,?,NOW())', [row[0].codigoVenta, id, 1, cantidad[0][0], stotal]);
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
  cliente = await pool.query('select id from cliente where idPersona=?', [idu]);
  row = await pool.query('select codigoVenta from venta_cliente where idCliente=? and estado=?', [cliente[0].id, 0]);
  sub = await pool.query('select sum(subTotal) as total from bolsa_compra_cliente where codVenta=?', [row[0].codigoVenta]);

  const carro = await pool.query('select c.id,p.imagen,p.nombre,m.marca,c.cantidad,c.subTotal,pp.precio from bolsa_compra_cliente as c inner join venta_cliente as vc on (c.codVenta=vc.codigoVenta) inner join promociones_producto as pp on(c.idProducto=pp.id) inner join producto as p on(pp.idProducto=p.id) inner join marca as m on(p.idMarca=m.id) where c.codVenta= ?', [row[0].codigoVenta]);
  console.log(sub);
  res.render('carro/carro', { carro, sub });
});



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