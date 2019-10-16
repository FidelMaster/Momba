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
  const { nombre, apellido, Ciudad,direccion,celular } = req.body;
  const id = req.user.id;
  console.log("dddd" +id)
  await pool.query('INSERT  Persona(idCredenciales,nombre, apellido,direccion,ciudad,codigoPostal,fecha_registro) values(?,?,?,?,?,?,NOW())', [id,nombre,apellido,Ciudad,direccion,celular]);
  req.flash('success', 'Link Saved Successfully');
  res.redirect('/perfil');
});

router.get('/camisas',async (req, res) => {
    const camisas = await pool.query('select ti.id, i.imagen, i.nombre,i.marca,ti.precio from Talla_Inventario as ti inner join inventario as i on(ti.idInventario=i.id) where i.categoria=1 ');
    res.render('secciones/camisa', { camisas });
});

module.exports = router;