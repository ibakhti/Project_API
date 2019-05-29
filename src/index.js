const express = require("express");
const cors = require("cors");

const userRouter = require("./routers/userRouter");
const productRouter = require("./routers/productRouter");
const orderRouter = require("./routers/orderRouter");

app = express();
port = 8080;

app.use(cors());
app.use(express.json());
app.use(userRouter);
app.use(productRouter);
app.use(orderRouter);

app.listen(port, () => {
  console.log("API Running at Port: " + port);
});
