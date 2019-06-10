const router = require('express').Router();
const multer = require("multer");
const path = require("path");

const {userControl} = require('./../controllers/index')
const uploadDir = path.join(__dirname + "/../../avatar/");



//---------UPLOAD AVATAR--------------//
const Storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
      cb(null, Date.now() + file.originalname);
    }
  });
  
  const upload = multer({
    storage: Storage,
    limits: {
      fileSize: 8000000
    },
    fileFilter(req, file, cb) {
      if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
        //tolak
        return cb(new Error("please upload image file (jpg, jpeg, png)"));
      }
  
      cb(undefined, true);
    }
  });

router.put("/user/avatar", upload.single('avatar'), userControl.uploadAvatar);

// ---------GET AVATAR---------------//
router.get("/user/avatar/:img", userControl.getAvatar)

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