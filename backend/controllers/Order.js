const { Order, CartItem } = require("../models/Order");
const { errorHandler } = require("../helpers/dbErrorHandler");
const nodemailer = require("nodemailer");
// Env Variables
require("dotenv").config();

// Nodemailer
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASSWORD,
  },
});

// Testing transporter
transporter.verify((error, success) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Ready for Message : ", success);
  }
});

exports.orderById = (req, res, next, id) => {
  Order.findById(id)
    .populate(
      "investmentpackages.investmentpackage",
      "name price",
      "percentage_interest duration withdrawalDate"
    )
    .exec((err, order) => {
      if (err || !order) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      }
      req.order = order;
      next();
    });
};

exports.create = (req, res) => {
  console.log("CREATE ORDER: ", req.body);
  req.body.order.user = req.profile;
  const order = new Order(req.body.order);
  order.save((error, data) => {
    if (error) {
      return res.status(400).json({
        error: errorHandler(error),
      });
    }
    // send email alert to admin
    // order.investment packages.length
    // order.amount
    const emailData = {
      to: process.env.AUTH_EMAIL,
      from: process.env.AUTH_EMAIL,
      subject: `A new investment order is received`,
      html: `
            <p>Customer name:</p>
            <p>Total investments: ${order.investmentpackages.length}</p>
            <p>Total cost: $${order.amount}</p>
            <p>Login to dashboard to the order in detail.</p>
        `,
    };
    transporter.sendMail(emailData);
    res.json(data);
  });
};

exports.listOrders = (req, res) => {
  Order.find()
    .populate("user", "_id fullName history usdt_address")
    .sort("-created")
    .exec((err, orders) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(error),
        });
      }
      res.json(orders.reverse());
    });
};

exports.getStatusValues = (req, res) => {
  res.json(Order.schema.path("status").enumValues);
};

exports.updateOrderStatus = (req, res) => {
  Order.findOneAndUpdate(
    { _id: req.body.orderId },
    { $set: { status: req.body.status } },
    (err, order) => {
      if (err) {
        console.log(err);
        console.log(req.body.orderId);
        return res.status(400).json({
          error: errorHandler(err),
        });
      }
      console.log(order);
      res.json(order);
    }
  );
};


