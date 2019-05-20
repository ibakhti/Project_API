const router = require('express').Router();

const {userControl} = require('./../controllers/index')


//--------REGISTER USER--------------//
// save data user to database
// firstname, lastname not ''
router.post('/users',userControl.userRegister );

//---------USER LOGIN----------------------//
router.get('/users/login', userControl.userLogin );

//-----------GET USER--------------------//
router.get('/users', userControl.userGet );

//------------UPDATE USER---------------//
router.put('/users/update/:userId', userControl.userUpdate );

//-----------CHANGED PASSWORD-----------//
router.put('/users/pass/:userId', userControl.userPassChaged )

//---------REGISTER ADDRESS USER-----------//
//save user address to database
router.post('/users/address', userControl.addressRegister );

//------------GET ADDRESS-------------//
router.get('/users/address', userControl.addressGet )

//-----------UPDATE ADDRESS-----------//
router.put('/users/address/update/:userId', userControl.addressUpdate);


module.exports = router