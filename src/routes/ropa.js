const express = require('express');
const router = express.Router();
const pool = require('../../database');
const { isLoggedIn } = require('../lib/auth');
const paypal = require('paypal-rest-sdk');


//contacto page
router.get('/contacto', (req, res) => {
  res.render('secciones/contacto');
});

//obtener el detalle del producto
router.get('/detalle/:id', async (req, res) => {
  
  const { id } = req.params;
  const talla= await pool.query('select it.id as id,it.nombre as name from tblinv_talla_producto as tp inner join tblinv_tallas as it on(tp.id_talla=it.id) where tp.id_producto=?',id)
  console.log(talla);
  const detalle = await pool.query('select p.id,p.codproducto,p.imagen,p.precio_venta,m.nombre as marca, ma.nombre as material from tblinv_producto as p  left join tblinv_marca as m  on(p.id_marca=m.id) left join tblinv_material as ma on(p.id_marca=ma.id) where p.id=? ', [id]);
  res.render('secciones/detalle', { detalle,talla });
});

//  Camisas
router.get('/camisas', async (req, res) => {
  console.log(req)
  const camisas = await pool.query('select * from tblinv_producto where id_categoria=1 ');
  res.render('secciones/camisa', { camisas });

});
// pantalones
router.get('/pantalones', async (req, res) => {
  const pantalon = await pool.query('select * from tblinv_producto where id_categoria=2');
  console.log(pantalon)
  res.render('secciones/pantalones', { pantalon });
});
// Gorras
router.get('/Gorras', async (req, res) => {
  const gorras = await pool.query('select * from tblinv_producto where id_categoria=3');
  res.render('secciones/gorras', { gorras });
});
//Zapatos 
router.get('/zapatos', async (req, res) => {
  const zapatos = await pool.query('select * from tblinv_producto where id_categoria=4');
  res.render('secciones/zapatos', { zapatos });
});


//Agregando al carrito de compras
router.post('/carrito/agregar/:id', async (req, res) => {
  // this variables, i will get from DOM
  const { talla, cantidad } = req.body;
  const idu = req.user.id;
  const { id } = req.params;
  const estado=0;
  const precio = await pool.query('select precio_venta from tblinv_producto where id=?', [id]);
  console.log(precio);
  const stotal = precio[0].precio_venta;
  for (let index = 0; index <cantidad; index++) {
    await pool.query('insert tblcarro_bolsa_cliente(id_user,id_producto,id_talla,subtotal,estado,fecha) values(?,?,?,?,?,NOW())', [idu, id, talla, stotal,estado]);
  
  }
   res.redirect('/camisas');
});

//Pantalla de contactenos se almacena el mensaje enviado
router.post('/contacto/mensaje', async (req, res) => {
  const {Nombre,Correo,Celular,Mensaje} = req.body;
  const estado = 0;
  await pool.query('insert tblinbox_mensaje(Nombre,Correo,Celular,Mensaje,estado,creado) values(?,?,?,?,?,now())', [Nombre,Correo,Celular,Mensaje,estado]);
  res.redirect('/contacto');
});

//Ver el contenido del carro de compras
router.get('/carrito',isLoggedIn, async (req, res) => {
  // con req.user.id se obtiene el id del usuario que esta loggeado 
  const idu = req.user.id;
   const sub = await pool.query('select sum(subtotal) as subtotal from tblcarro_bolsa_cliente where id_user=? and estado=0', [idu]);
    //Si el carro esta vacio se manda a otra pagina
   if (sub[0].subtotal) {
  
    const dolar=await pool.query('select valor from tbladmin_taza_cambio order by fecha desc limit 1')
    let total=0.00;
    const tax= (100.00/dolar[0].valor).toFixed(2);
  
    let sub_total=(sub[0].subtotal).toFixed(2)
    const carro = await pool.query('select cb.id as id_carrito, p.id,p.nombre,p.imagen,p.precio_venta,m.nombre as marca,mat.nombre as material from tblcarro_bolsa_cliente as cb inner join tblinv_producto as p on(cb.id_producto=p.id) left join tblinv_marca as m on(p.id_marca=m.id) left join tblinv_material as mat on(p.id_material=mat.id) where cb.id_user=? and estado=0', [idu]);
  
    total=( parseFloat(tax)+ parseFloat((sub[0].subtotal)));
    console.log(total);
    res.render('carro/carro', { carro, sub_total ,tax,total});
  }else{
    res.render('carro/carrov');
 
  }

});

// Eliminar producto del carrito
router.get('/politicas', async (req, res) => {
  res.render('terminos/index');
});



// Eliminar producto del carrito
router.get('/carrito/eliminar/:id', async (req, res) => {
  const { id } = req.params;
  await pool.query('delete from tblcarro_bolsa_cliente where id=?', [id]);
  res.redirect('/carrito');
});




//Proceso del pago
router.post('/pay', async(req, res) => {
  const idu = req.user.id;
  // se obtiene la ultima tasa de canmbio
  const dolar=await pool.query('select valor from tbladmin_taza_cambio order by fecha desc limit 1');
  console.log(dolar)
  let total=0.00;
  const tax= (100.00/dolar[0].valor).toFixed(2);
  const sub =await  pool.query('select sum(subtotal) as subtotal from tblcarro_bolsa_cliente where id_user=? and estado=0', [idu]);
    // Total de la transaccion
  total=(parseFloat(tax)+ parseFloat((sub[0].subtotal)));
  
   //JSON for the pago
  const create_payment_json = {
    "intent": "sale",
    "payer": {
      "payment_method": "paypal"
    },
    "redirect_urls": {
      "return_url": "http://localhost:3000/success",
      "cancel_url": "http://localhost:3000/cancel"
    },
    "transactions": [{
      "item_list": {
        "items": [{
          "name": "Red Sox Hat",
          "sku": "001",
          "price": total,
          "currency": "USD",
          "quantity": 1
        }]
      },
      "amount": {
        "currency": "USD",
        "total": total
      },
      "description": "Compra tienda en linea de Mombashop.com"
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

// Si la transaccion salio bien se viene a esta funcion
router.get('/success', async (req, res) => {
  console.log("todo bien ");
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  const idu = req.user.id;
  // se obtiene la ultima tasa de canmbio
  const dolar= await pool.query('select valor from tbladmin_taza_cambio order by fecha desc limit 1')
  let total=0.00;
  const tax= (100.00/dolar[0].valor).toFixed(2);
  const sub = await pool.query('select sum(subtotal) as subtotal from tblcarro_bolsa_cliente where id_user=? and estado=0', [idu]);
    // Total de la transaccion
  total=(parseFloat(tax)+ parseFloat((sub[0].subtotal)));

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
      "amount": {
        "currency": "USD",
        "total": total
      }
    }]
  };
 
  // si todo se ejecuta correctamente
  paypal.payment.execute(paymentId, execute_payment_json,async  (error, payment)=> {
    
    const idu = req.user.id;
    if (error) {
      // si ocurrio algun error daselo al usuario 
      console.log(error.response);
      throw error;
    } else {
      // como no ocurre ningun error hago la logica que correspondiente
      // mando a actualizar el estado del carrito  a 1 ya que ya se cancelo estoy valorando si eliminarlo pero es lo de menos 
      // Mando  a insertar los datos de la transaccion  y a crear la factura y los detalles
      const dolar=await pool.query('select valor from tbladmin_taza_cambio order by fecha desc limit 1')
      let total=0.00;
      const tax= (100.00/dolar[0].valor).toFixed(2);
 
      const sub = await pool.query('select sum(subtotal) as subtotal from tblcarro_bolsa_cliente where id_user=? and estado=0', [idu]);
        // Total de la transaccion
      total=(parseFloat(tax)+ parseFloat((sub[0].subtotal)));      
      //payment.transactions[0].amount.total
      await pool.query('insert tblventa_factura_cliente(id_user,fecha,estado) values(?,now(),0)', [idu]);
      const id= await pool.query('select id from tblventa_factura_cliente where id_user=? and estado=0', [idu]);
      const datos= await pool.query('SELECT id_producto,id_talla,COUNT(id) as cantidad FROM tblcarro_bolsa_cliente where id_user=? and estado=0 group by id_producto, id_talla',[idu])
      for (let index = 0; index < datos.length; index++) {
        await pool.query('insert tblventa_factura_detalle(cod_factura,id_producto,cantidad,fecha,creado,actualizado) values(?,?,?,now(),now(),now())', [id[0].id,datos[index].id_producto,datos[index].cantidad]);
        await pool.query('update tblinv_inventario set disponibilidad=disponibilidad-? where id_producto=? and id_tallas=?',[datos[index].cantidad,datos[index].id_producto,datos[index].id_talla])
      }
      await pool.query('insert tblventa_factura_pago(cod_factura,subtotal,descuento,tax,total,fecha,creado,actualizado) values(?,?,0,?,?,now(),now(),now())', [id[0].id,sub[0].subtotal, tax,total]);
      await pool.query('insert tblpedido_pedido_cliente(cod_factura,id_user,id_estado,fecha,creado,actualizado) values(?,?,6,now(),now(),now())', [id[0].id,idu]);
      await pool.query('update tblcarro_bolsa_cliente set estado=1 where id_user=? and estado=0', [idu]);
      await pool.query('update tblventa_factura_cliente set estado=1 where id_user=? and estado=0', [idu]);

      res.redirect('/perfil');

    }
  });
});

router.get('/cancel', (req, res) => res.send('Cancelled'));

module.exports = router;