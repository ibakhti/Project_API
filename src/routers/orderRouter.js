const router = require("express").Router();
const conn = require("../connection/connection");
const multer = require('multer');
const path = require('path')

const uploadDir = path.join(__dirname + '/../../paymentPict/');

//----------GET ITMES FOR CHECKOUT-----------//
router.get("/checkout", (req, res) => {
  const sql = `SELECT * FROM checkoutItemView WHERE userId = ${
    req.query.userId
  }`;
  const sql2 = `SELECT SUM(total) subTotal FROM checkoutItemView GROUP BY userId HAVING userId = ${
    req.query.userId
  }`;

  conn.query(sql, (err, result) => {
    if (err) return res.status(400).send(err.sqlMessage);

    conn.query(sql2, (err2, result2) => {
      if (err2) return res.status(400).send("err2: " + err2.sqlMessage);

      res.send([result, result2]);
    });
  });
});

//--------------GET ALL SHIPPING METHOD------------//
router.get('/shipper', (req, res) => {
  const sql = `SELECT * FROM shippers`

  conn.query(sql, (err, result) => {
    if(err) return res.status(400).send(err.sqlMessage);

    res.status(200).send(result);
  });
});

router.get("/shipping", (req, res) => {
    const sql = `SELECT * FROM shippingView`;

    conn.query(sql, (err, result) => {
        if(err) return res.status(400).send(err.sqlMessage);

        res.send(result);
    });
});

// -------------UPLOAD PAYMENT PICT------------//
const Storage = multer.diskStorage({
  destination: function(req, file, cb) {
      cb(null, uploadDir)
  },
  filename: function(req, file, cb){
      cb(null, file.originalname)
  }
})

const upload = multer({
  storage:Storage,
  limits: {
      fileSize: 2000000
  },
  fileFilter(req, file, cb){
      if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
          //tolak
          return cb(new Error('please upload image file (jpg, jpeg, png)'))
      }
      
      cb(undefined, true)
  }
})

router.put("/payment/upload/pict", upload.single("paypict"), (req, res) => {
  const rawname = req.file.filename.split(".")
  const data = rawname[0]
  const sql = `UPDATE payments SET paymentImg = '${req.file.filename}' WHERE paymentName LIKE "${data}"`

  conn.query(sql, (err, result) => {
    if(err) return res.status(400).send(err.sqlMessage);

    res.status(200).send(result);
  });
});

router.get("/paypict/:paymentImg", (req, res) => {
  res.sendFile(uploadDir + '/' + req.params.paymentImg)
});


//---------GET PAYMENT----//
router.get("/payment", (req, res) => {
  const sql = `SELECT * FROM payments`

  conn.query(sql, (err, result) => {
    if(err) return res.status(400).send(err.sqlMessage);

    res.status(200).send(result)
  })
})

module.exports = router;
