const router = require("express").Router();
const conn = require("../connection/connection");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const generateInvoice = require("./../email/invoice");
const sendMail = require("./../email/nodemailer");

const uploadDir = path.join(__dirname + "/../../paymentPict/");
const upDirtrf = path.join(__dirname + "/../../trfPict");

const parentPath = path.join(__dirname, "../..");

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
router.get("/shipper", (req, res) => {
  const sql = `SELECT * FROM shippers`;

  conn.query(sql, (err, result) => {
    if (err) return res.status(400).send(err.sqlMessage);

    res.status(200).send(result);
  });
});

router.get("/shipping", (req, res) => {
  const sql = `SELECT * FROM shippingView`;

  conn.query(sql, (err, result) => {
    if (err) return res.status(400).send(err.sqlMessage);

    res.send(result);
  });
});

// -------------UPLOAD PAYMENT PICT------------//
const Storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage: Storage,
  limits: {
    fileSize: 2000000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      //tolak
      return cb(new Error("please upload image file (jpg, jpeg, png)"));
    }

    cb(undefined, true);
  }
});

router.put("/payment/upload/pict", upload.single("paypict"), (req, res) => {
  const rawname = req.file.filename.split(".");
  const data = rawname[0];
  const sql = `UPDATE payments SET paymentImg = '${
    req.file.filename
  }' WHERE paymentName LIKE "${data}"`;

  conn.query(sql, (err, result) => {
    if (err) return res.status(400).send(err.sqlMessage);

    res.status(200).send(result);
  });
});

router.get("/paypict/:paymentImg", (req, res) => {
  res.sendFile(uploadDir + "/" + req.params.paymentImg);
});

//---------GET PAYMENT----//
router.get("/payment", (req, res) => {
  const sql = `SELECT * FROM payments`;

  conn.query(sql, (err, result) => {
    if (err) return res.send(err.sqlMessage);

    res.status(200).send(result);
  });
});

// -------GET PAYMENT ID------------//
router.get("/payment/:paymentId", (req, res) => {
  const sql = `SELECT paymentName, noRek, paymentImg FROM payments WHERE paymentId = ${
    req.params.paymentId
  }`;

  conn.query(sql, (err, result) => {
    if (err) return res.status(400).send(err.sqlMessage);

    res.status(200).send(result);
  });
});

//-------INPUT ORDER----------//
router.put("/order", (req, res) => {
  const data = req.body;
  const sql = `INSERT INTO orders SET ?`;

  conn.query(sql, data, (err, result, fields) => {
    if (err) return res.status(400).send(err.sqlMessage);

    res.status(200).send(result);
  });
});

//---------INPUT ORDER DETAIL-----//
router.put("/orderdetail", (req, res) => {
  const data = req.body.items;
  const sql = `INSERT INTO orderDetails (orderId, productId, sku, productName, size, unitPrice, quantity) VALUE ?`;

  const value = data.reduce((o, a) => {
    let ar = [];
    ar.push(a.orderId);
    ar.push(a.productId);
    ar.push(a.sku);
    ar.push(a.productName);
    ar.push(a.size);
    ar.push(a.unitPrice);
    ar.push(a.quantity);
    o.push(ar);
    return o;
  }, []);

  // console.log(value)
  conn.query(sql, [value], (err, result) => {
    if (err) return res.status(400).send(err.sqlMessage);

    res.send(result);
  });
});

// ----------UPLOAD PAYMENT SLIP PICT------------//
const Store = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, upDirtrf);
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + file.originalname);
  }
});

const up = multer({
  storage: Store,
  limits: {
    fileSize: 2000000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      //tolak
      return cb(new Error("please upload image file (jpg, jpeg, png)"));
    }

    cb(undefined, true);
  }
});

router.put("/payslip", up.single("payslip"), (req, res) => {
  const sql = `UPDATE orders SET transferImg = '${
    req.file.filename
  }', paymentDate = current_timestamp() WHERE orderId = ${req.body.orderId}`;

  conn.query(sql, (err, result) => {
    if (err) return res.status(400).send(err.sqlMessage);

    res.status(200).send({
      result,
      url: `http://localhost:8080/payslip/picture/${req.file.filename}`
    });
  });
});

router.get("/payslip/picture/:img", (req, res) => {
  res.sendFile(upDirtrf + "/" + req.params.img);
});

// ----------ORDER HISTORY---------//
router.get("/order/history", (req, res) => {
  const sql1 = `SELECT * FROM userOrderHistoryView WHERE userId = ${
    req.query.userId
  }`;
  const sql2 = `SELECT * FROM orderDetailView WHERE userId = ${
    req.query.userId
  }`;

  conn.query(sql1, (err, result1) => {
    if (err) return res.status(400).send(err.sqlMessage);

    conn.query(sql2, (err, result) => {
      if (err) return res.status(400).send(err.sqlMessage);

      res.status(200).send([result1, result]);
    });
  });
});

// --------GET ORDER FOR ADMIN-------///
router.get("/admin/order", (req, res) => {
  const sql = `SELECT * FROM orderAdminView WHERE fulfill = 0`;

  conn.query(sql, (err, result) => {
    if (err) return res.send(err.sqlMessage);

    res.send(result);
  });
});

// ---------GET ORDER COMPELETE------//
router.get("/admin/order/fulfill", (req, res) => {
  const sql = `SELECT * FROM orderAdminView WHERE fulfill = 1`;

  conn.query(sql, (err, result) => {
    if (err) return res.send(err.sqlMessage);

    res.send(result);
  });
});

// -------GET ORDER DETAIL FOR ADMIN-----//
router.get("/admin/detail", (req, res) => {
  const sql = `SELECT * FROM orderDetails WHERE orderId = ${req.query.orderId}`;

  conn.query(sql, (err, result) => {
    if (err) return res.send(err.sqlMessage);

    res.send(result);
  });
});

// -------------GET CUSTOMER DATA ------//
router.get("/admin/customer", (req, res) => {
  const sql = `SELECT * FROM customerDataView WHERE userId = ${
    req.query.userId
  }`;

  conn.query(sql, (err, result) => {
    if (err) return res.send(err.sqlMessage);

    res.send(result);
  });
});

//--------DENY CUSTOMER PAY SLIP-----//
router.delete("/admin/deny", (req, res) => {
  const sql1 = `SELECT transferImg FROM orders WHERE orderId=${
    req.body.orderId
  }`;
  const sql2 = `UPDATE orders SET transferImg = '' WHERE orderId = ${
    req.body.orderId
  }`;

  conn.query(sql1, (err, result) => {
    if (err) return res.send(err.sqlMessage);

    if (result[0].transferImg) {
      fs.unlinkSync(upDirtrf + "/" + result[0].transferImg);

      conn.query(sql2, (err, result) => {
        if (err) return res.send(err.sqlMessage);

        res.send(result);
      });
    }
  });
});

// -------GET ADDRESS----//
router.get("/admin/address", (req, res) => {
  const sql = `SELECT * FROM customerDataView WHERE userId = ${
    req.query.userId
  }`;

  conn.query(sql, (err, result) => {
    if (err) return res.send(err.sqlMessage);

    res.send(result);
  });
});

// -----FULLFIL ORDER---//
router.put("/admin/sent", (req, res) => {
  const sql = `UPDATE orders SET fulfill = 1 WHERE orderId = ${
    req.body.orderId
  }`;

  conn.query(sql, (err, result) => {
    if (err) return res.send(err.sqlMessage);

    res.send(result);
  });
});

// ------REMOVE ORDER---//
router.delete('/admin/order/delete', (req, res) => {
  const sql = `DELETE FROM orders WHERE orderId = ${req.body.orderId}`

  conn.query(sql, (err, result) => {
    if (err) return res.send(err.sqlMessage);

    res.send(result)
  })
});

// -------DELETE STOCK------------//
router.put("/order/delete", (req, res) => {
  const sql = `SELECT unitStock FROM productSizeAndStock WHERE productId = ${
    req.body.productId
  }`;

  conn.query(sql, (err, result) => {
    if (err) return res.send("err1: " + err.sqlMessage);
    const sql2 = `UPDATE productSizeAndStock SET unitStock = ${result[0]
      .unitStock - 1} WHERE productId = ${req.body.productId}`;

    conn.query(sql2, (err, result) => {
      if (err) return res.send("err2 " + err.sqlMessage);

      res.send(result);
    });
  });
});

// ---------COUNT UNCOMPLETE ORDER---//
router.get("/count", (req, res) => {
  const sql = `SELECT Count(*) noFulfillOrder FROM orders WHERE	fulfill = 0;`;

  conn.query(sql, (err, result) => {
    if (err) return res.send(err.sqlMessage);

    res.send(result);
  });
});

// -----SEND INVOICE TO CUSTOMER---//
router.put("/invoice", (req, res) => {
  const sql = `SELECT * FROM orderDetailView WHERE userId=${
    req.body.userId
  } AND orderId=${req.body.orderId}`;
  const sql2 = `SELECT price FROM  orderAdminView WHERE userId=${
    req.body.userId
  } AND orderId=${req.body.orderId}`;
  const sql3 = `SELECT firstName, lastName, email FROM users WHERE userId=${
    req.body.userId
  }`;

  conn.query(sql, (err, result1) => {
    if (err) return res.send(err.sqlMessage);

    conn.query(sql2, (err, result2) => {
      if (err) return res.send(err.sqlMessage);

      // res.send([result1, result])
      conn.query(sql3, (err, result3) => {
        if(err) return res.send(err.sqlMessage);

        const items = result1.map(item => {
          return {
            name: `${item.productName} ${item.size}`,
            quantity: item.quantity,
            unit_cost: item.unitPrice
          };
        });
        const name = `${result3[0].firstName} ${result3[0].lastName}`;
        const email = result3[0].email;

        var invoice = {
          logo:
            "https://static1.squarespace.com/static/578dbb17d2b857223fe8cbd0/t/5886ea1586e6c0c012631de7/1555992834192/",
          from: "BnC Online Store, Jakarta, 11134 Mt.Hartono Jakarta Timur Daya",
          to: name,
          currency: "usd",
          number: req.body.orderId,
          payment_terms: "Your payment has been accept",
          items: items,
          shipping: result2[0].price,
          notes: "Thanks for shopping with us!",
          terms: "you product has been send"
        };
        const fileDir = path.join(
          parentPath,
          `src/invoice/invoice${req.body.orderId}.pdf`
        );
  
        generateInvoice(
          invoice,
          fileDir,
          function() {
            console.log("Saved invoice to invoice.pdf");
            // res.sendFile(fileDir)
  
            sendMail(email, fileDir);
  
            res.sendStatus(200);
          },
          function(error) {
            console.error(error);
          }
        );
      })
    });
  });
});


module.exports = router;
