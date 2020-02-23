module.exports = {
    //comprobando que el usuario este logeado para continuar
    isLoggedIn (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        return res.redirect('/login');
    }
};