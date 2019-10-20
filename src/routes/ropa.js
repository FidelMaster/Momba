const express = require('express');
const router = express.Router();
const pool = require('../../database');
const { isLoggedIn } = require('../lib/auth');

router.get('/contacto', (req, res) => {
    res.render('secciones/contacto');
});

router.get('/persona', isLoggedIn, (req, res) => {
    res.render('auth/persona');
  });

router.post('/persona', async (req, res) => {
  const { date,nombre, apellido, Ciudad,direccion,celular,Genero } = req.body;
  const id = req.user.id;
  await pool.query('INSERT  Persona(credencial,nacimiento,nombre, apellido,direccion,ciudad,celular,fehca_registro,genero) values(?,?,?,?,?,?,?,NOW(),?)', [id,date,nombre,apellido,Ciudad,direccion,celular,Genero]);
  res.redirect('/perfil');
});


router.get('/detalle/:id', async (req, res) => {
  const { id } = req.params;
  const detalle = await pool.query('select i.id,i.imagen,i.nombre,ma.marca,mat.material,i.precio  from inventario as i inner join marca as ma on(i.marca=ma.id)  inner join material as mat on (i.material=mat.id) where i.id = ?', [id]);
  res.render('detalle/detalle', {detalle});
});

router.get('/camisas',async (req, res) => {
    const camisas = await pool.query('select id,imagen,nombre,precio from inventario where categoria=1 ');
    res.render('secciones/camisa', { camisas });
});

router.get('/pantalones',async (req, res) => {
  const pantalon = await pool.query('select id,imagen,nombre,precio from inventario where categoria=2');
  res.render('secciones/pantalones',{pantalon});
});

router.get('/Gorras',async (req, res) => {
  const gorras = await pool.query('select id,imagen,nombre,precio from inventario where categoria=3');
  res.render('secciones/gorras',{gorras});
});

router.get('/zapatos',async (req, res) => {
  const zapatos = await pool.query('select id,imagen,nombre,precio from inventario where categoria=4');
  res.render('secciones/zapatos',{zapatos});
});

router.post('/carrito/agregar/:id',async (req, res) => {
  const { cantidad } = req.body;
  const { id } = req.params;
   await pool.query('insert carrito ( idPersona,idProducto,cantidad,fecha,total) values(?,?,?,NOW(),0)',[req.user.id,id,cantidad]);
  res.redirect('/camisas');
});

router.get('/carrito',async(req,res)=>{
  const carro= await pool.query('select i.id,i.imagen,i.nombre,i.precio, t.talla ,m.marca,ma.material,c.cantidad  from carrito as c inner join Talla_Inventario as ti on(c.idProducto=ti.id) inner join inventario as i on(ti.idInventario=i.id) inner join material as ma on (i.material=ma.id) inner join marca as m on( i.marca=m.marca) inner join tallas  as t on (ti.idTalla=t.id) where c.idPersona = ?',[req.user.id]);

  res.render('carro/carro',{carro});
});



module.exports = router;