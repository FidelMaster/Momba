module.exports = {
    //comprobando que el usuario este logeado para continuar
    // se coloca en la url 
    isLoggedIn (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        return res.redirect('/login');
    }
};