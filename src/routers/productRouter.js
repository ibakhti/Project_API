const router = require("express").Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const conn = require("./../connection/connection");

const uploadDir = path.join(__dirname + "/../../pictures/");

//----------ADD PRODUCTS----------//
router.post("/products", (req, res) => {
  const data = req.body;
  const sql = `INSERT INTO products SET ?`;

  conn.query(sql, data, (err, result) => {
    if (err) return res.status(400).send(err.sqlMessage);

    res.send(result);
  });
});

//----------ADD PICTURES PRODUCTS---------//
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

router.post("/picture/upload/:sku", upload.single("img"), async (req, res) => {
  const data = {
    sku: req.params.sku,
    img: req.file.filename
  };
  const sql = `INSERT INTO productPicts SET ?`;

  conn.query(sql, data, (err, result) => {
    if (err) return res.status(400).send(err.sqlMessage);

    res.status(200).send("success");
  });
});

//-------GET PRODUCT PICT--------//
router.get("/picture/:img", (req, res) => {
  res.sendFile(uploadDir + "/" + req.params.img);
});

//-------GET PRODUCT PICT BY CATEGORY--------//
router.get("/product/picture", (req, res) => {
  const sql = `SELECT * FROM productPictView WHERE category = '${
    req.query.category
  }' AND img NOT LIKE '%a%'`;

  conn.query(sql, (err, result) => {
    if (err) return res.status(400).send(err.sqlMessage);

    res.status(200).send(result);
  });
});

//------GET PRODUCT DETAIL BY SKU-------//
router.get("/product/detail", (req, res) => {
  const sql = `SELECT img FROM productPictView WHERE sku = '${req.query.sku}'`;
  const sql2 = `SELECT * FROM productSizeStockView WHERE sku = '${
    req.query.sku
  }'`;

  conn.query(sql, (err, result) => {
    if (err) return res.status(400).send(err.sqlMessage);

    conn.query(sql2, (err, result2) => {
      if (err) return res.status(400).send("from err2" + err.sqlMessage);

      res.send([result, result2]);
    });
  });
});

//------ADD TO CART----------//
router.put("/cart/add", (req, res) => {
  const data = req.body;
  const sql = `SELECT quantity FROM cart WHERE userId=${
    data.userId
  } AND productId = ${data.productId}`;
  const sql2 = "INSERT INTO cart SET ?";

  conn.query(sql, (err, result) => {
    if (err) return res.status(400).send("err: " + err.sqlMessage);

    if (result.length == 0) {
      conn.query(sql2, data, (err, result2) => {
        if (err) return res.status(400).send("err2: " + err.sqlMessage);

        res.status(200).send(result2);
      });
    } else {
      const sql3 = `UPDATE cart SET quantity=${result[0].quantity +
        1} WHERE userId = ${data.userId} AND productId = ${data.productId}`;
      conn.query(sql3, (err, result3) => {
        if (err) return res.status(400).send("err3 " + err.sqlMessage);

        res.status(200).send(result3);
      });
    }
  });
});

//-----------------UPDATE STOCK DISPLAY AFTER ADD TO CART-------------//
router.put("/product/stock/update/minus", (req, res) => {
  const sql = `SELECT stockDisplay FROM productSizeAndStock WHERE productId=${
    req.body.productId
  }`;

  conn.query(sql, (err, result) => {
    if (err) return res.status(400).send(err.sqlMessage);
    const sql2 = `UPDATE productSizeAndStock SET stockDisplay = ${result[0]
      .stockDisplay - 1} WHERE productId=${req.body.productId}`;
    conn.query(sql2, (err, result2) => {
      if (err) return res.status(400).send("err2: " + err.sqlMessage);

      res.status(200).send(result2);
    });
  });
});
//-----------UPDATE DATA WHEN REMOVE CART-------------//
router.put("/product/stock/update/plus", (req, res) => {
  const sql = `SELECT stockDisplay FROM productSizeAndStock WHERE productId=${
    req.body.productId
  }`;

  conn.query(sql, (err, result) => {
    if (err) return res.status(400).send(err.sqlMessage);

    const sql2 = `UPDATE productSizeAndStock SET stockDisplay = ${result[0]
      .stockDisplay + 1} WHERE productId=${req.body.productId}`;
    conn.query(sql2, (err, result2) => {
      if (err) return res.status(400).send("err2: " + err.sqlMessage);

      res.status(200).send(result2);
    });
  });
});

//-----------------GET CART-----------------//
router.get("/cart", (req, res) => {
  const data = req.query.userId;
  const sql = `SELECT * FROM cartView WHERE userId=?`;

  conn.query(sql, data, (err, result) => {
    if (err) return res.status(400).send(err.sqlMessage);

    res.status(200).send(result);
  });
});

//-----------------REMOVE CART-----------------//
router.delete("/cart/remove", (req, res) => {
  const sql1 = `SELECT quantity FROM cart WHERE userId = ${
    req.body.userId
  } AND productId=${req.body.productId}`;
  const sql2 = `DELETE FROM cart WHERE userId = ${
    req.body.userId
  } AND productId=${req.body.productId}`;

  conn.query(sql1, (err, result1) => {
    if (err) return res.status(400).send("err1 " + err.sqlMessage);

    if (result1[0].quantity === 1) {
      conn.query(sql2, (err, result2) => {
        if (err) return res.status(400).send("err2 " + err.sqlMessage);

        res.send(result2);
      });
    } else {
      const sql3 = `UPDATE cart SET quantity = ${result1[0].quantity -
        1} WHERE userId = ${req.body.userId} AND productId = ${
        req.body.productId
      }`;
      conn.query(sql3, (err, result3) => {
        if (err) return res.status(400).send("err3 " + err.sqlMessage);

        res.send(result3);
      });
    }
  });
});

//---------DELETE ALL CART AFTER CHECKOUT----------//
router.delete("/allcart", (req, res) => {
  const sql = `DELETE FROM cart WHERE userId = ${req.body.userId}`;

  conn.query(sql, (err, result) => {
    if (err) return res.status(400).send(err.sqlMessage);

    res.status(200).send(result);
  });
});

router.get("/search/productName", (req, res) => {
    const sql = `SELECT * FROM productPictView WHERE productName LIKE '%${req.query.name}%' AND img NOT LIKE '%a%'`

    conn.query(sql, (err, result) => {
        if(err) return res.status(400).send(err.sqlMessage);

        res.status(200).send(result)
    })
});

router.get("/search/color", (req, res) => {
    const sql = `SELECT * FROM productPictView WHERE color LIKE '%${req.query.color}%' AND img NOT LIKE '%a%'`

    conn.query(sql, (err, result) => {
        if(err) return res.status(400).send(err.sqlMessage);

        res.status(200).send(result)
    })
});

router.get("/search/category", (req, res) => {
    const sql = `SELECT * FROM productPictView WHERE category LIKE '${req.query.category}' AND img NOT LIKE '%a%'`

    conn.query(sql, (err, result) => {
        if(err) return res.status(400).send(err.sqlMessage);

        res.status(200).send(result)
    })
});

router.get("/search/price", (req, res) => {
    const sql = `SELECT * FROM productPictView WHERE unitPrice >= ${req.query.min} AND unitPrice <= ${req.query.max} AND img NOT LIKE '%a%'`

    conn.query(sql, (err, result) => {
        if(err) return res.status(400).send(err.sqlMessage);

        res.status(200).send(result)
    })
});

router.get("/search/size", (req, res) => {
    const sql = `SELECT * FROM productSizeStockImgView WHERE unitSize = ${req.query.size}`

    conn.query(sql, (err, result) => {
        if(err) return res.status(400).send(err.sqlMessage);

        res.status(200).send(result)
    })
});



module.exports = router;
