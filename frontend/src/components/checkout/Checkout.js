import React, { useState, useEffect } from "react";
import {
  getBraintreeClientToken,
  processPayment,
  createOrder,
} from "../apiCore";
import { emptyCart } from "../cart/cartHelpers";
import InvestmentCard from "../card/InvestmentCard";
import { isAuthenticated } from "../../functions/auth";
import { Link } from "react-router-dom";
// import "braintree-web"; // not using this package
import DropIn from "braintree-web-drop-in-react";
import { toast } from "react-toastify";
import { getCart } from "../cart/cartHelpers";
import transactionId from "react-use-uuid";
import { USDT_ADDRESS } from "../../config";

const Checkout = ({
  investmentpackages,
  setRun = (f) => f,
  run = undefined,
}) => {
  const [data, setData] = useState({
    loading: false,
    success: false,
    clientToken: null,
    error: "",
    instance: {},
    address: "",
  });
  const [items, setItems] = useState([]);
  const [proceedToPayment, setProceedToPayment] = useState(false);

  const [amount, setAmount] = useState("");
  const handleProceedToPayment = () => {
    setProceedToPayment(proceedToPayment ? false : true);
  };

  const userId = isAuthenticated() && isAuthenticated().user._id;
  const token = isAuthenticated() && isAuthenticated().token;
  useEffect(() => {
    setItems(getCart());
  }, [run]);
  const getToken = (userId, token) => {
    getBraintreeClientToken(userId, token).then((data) => {
      if (data.error) {
        console.log(data.error);
        setData({ ...data, error: data.error });
      } else {
        console.log(data);
        setData({ clientToken: data.clientToken });
      }
    });
  };

  useEffect(() => {
    getToken(userId, token);
  }, []);

  const handleAddress = (event) => {
    setData({ ...data, address: event.target.value });
  };

  const getTotal = () => {
    return investmentpackages.reduce((currentValue, nextValue) => {
      return currentValue + nextValue.count * amount;
    }, 0);
  };

  const showCheckout = () => {
    return isAuthenticated() ? (
      <div>{showDropIn()}</div>
    ) : (
      <Link to="/login">
        <button className="btn" style={{ backgroundColor: "#f09d51" }}>
          Sign in to invest
        </button>
      </Link>
    );
  };

  let deliveryAddress = data.address;
const transId = transactionId();
  const invest = () => {
    const createOrderData = {
      investmentpackages: investmentpackages,
      transaction_id: transId.slice(2, 10),
      amount: getTotal(investmentpackages),
      withdrawalDate: getWithdrawalDate(),
    };
    createOrder(userId, token, createOrderData)
      .then((response) => {
        emptyCart(() => {
          setRun(!run); // run useEffect in parent Cart
          console.log("payment success and empty cart");
          setData({
            loading: false,
            success: true,
          });
        });
      })
      .catch((error) => {
        console.log(error);
        setData({ loading: false });
      });
  }

  // const buy = () => {
  //   setData({ loading: true });
  //   // send the nonce to your server
  //   // nonce = data.instance.requestPaymentMethod()
  //   let nonce;
  //   let getNonce = data.instance
  //     .requestPaymentMethod()
  //     .then((data) => {
  //       // console.log(data);
  //       nonce = data.nonce;
  //       // once you have nonce (card type, card number) send nonce as 'paymentMethodNonce'
  //       // and also total to be charged
  //       // console.log(
  //       //     "send nonce and total to process: ",
  //       //     nonce,
  //       //     getTotal(investmentpackages)
  //       // );
  //       const paymentData = {
  //         paymentMethodNonce: nonce,
  //         amount: getTotal(investmentpackages),
  //       };

  //       processPayment(userId, token, paymentData)
  //         .then((response) => {
  //           console.log(response);
  //           // empty cart
  //           // create order

  //           const createOrderData = {
  //             investmentpackages: investmentpackages,
  //             transaction_id: response.transaction.id,
  //             amount: response.transaction.amount,
  //             address: deliveryAddress,
  //             withdrawalDate: getWithdrawalDate(),
  //           };

  //           createOrder(userId, token, createOrderData)
  //             .then((response) => {
  //               emptyCart(() => {
  //                 setRun(!run); // run useEffect in parent Cart
  //                 console.log("payment success and empty cart");
  //                 setData({
  //                   loading: false,
  //                   success: true,
  //                 });
  //               });
  //             })
  //             .catch((error) => {
  //               console.log(error);
  //               setData({ loading: false });
  //             });
  //         })
  //         .catch((error) => {
  //           console.log(error);
  //           setData({ loading: false });
  //         });
  //     })
  //     .catch((error) => {
  //       // console.log("dropin error: ", error);
  //       setData({ ...data, error: error.message });
  //     });
  // };

  const getWithdrawalDate = () => {
    var date = new Date();
    var eWD = date;
    eWD = new Date(
      Date.now() + investmentpackages[0].duration * 24 * 60 * 60 * 1000
    );
    return eWD.toLocaleDateString();
  };

  const showDropIn = () => (
    <div onBlur={() => setData({ ...data, error: "" })}>
      {data.clientToken !== null && investmentpackages.length > 0 ? (
        <div>
          {items.map((investmentpackage, ip) => (
            <div
              className="gorm-group mb-3"
              style={proceedToPayment ? { display: "none" } : null}
            >
              <label className="text-muted">Amount</label>
              <input
                key={ip}
                className="form-control"
                type="number"
                min={investmentpackage.minimum_amount}
                max={investmentpackage.maximum_amount}
                placeholder={`Enter amount ($${investmentpackage.minimum_amount} - $${investmentpackage.maximum_amount})`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <input
                key={ip}
                className="form-control"
                type="text"
                value={getWithdrawalDate()}
                style={{ display: "none" }}
              />
            </div>
          ))}
          {/* <div className="gorm-group mb-3">
              <label className="text-muted">Delivery address:</label>
              <textarea
                onChange={handleAddress}
                className="form-control"
                value={data.address}
                placeholder="Type your delivery address here..."
              />
            </div> */}

          {items.map((investmentpackage, ip) => (
            <>
              <>
                {amount >= investmentpackage.minimum_amount ? null : (
                  <>
                    {amount < investmentpackage.maximum_amount ? (
                      <small>Enter amount to continue...</small>
                    ) : null}
                  </>
                )}
              </>
              {amount < investmentpackage.minimum_amount ? null : (
                <>
                  {amount > investmentpackage.maximum_amount ? null : (
                    <>
                      {proceedToPayment ? (
                        <p className="col-md-8">
                          Copy and send {amount} USDT to this wallet address{" "}
                          <b>{USDT_ADDRESS}</b>
                        </p>
                      ) : null}

                      {/* <DropIn
                        options={{
                          authorization: data.clientToken,
                          paypal: {
                            flow: "vault",
                          },
                        }}
                        onInstance={(instance) => (data.instance = instance)}
                      /> */}
                      {proceedToPayment ? (
                        <>
                          <br/>
                          <button
                            type="submit"
                            onClick={invest}
                            className="hd-btn btn-block "
                          >
                            <b>I have Paid</b>
                          </button>
                          <small className="text-warning">
                            Make payment before clicking on "I Have Paid" to
                            avoid failed transaction
                          </small>
                          <br />
                          <br/>
                        </>
                      ) : (
                        <button
                          type="submit"
                          onClick={handleProceedToPayment}
                          className="btn btn-success btn-block "
                        >
                          <b>Proceed To Payment</b>
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
              {/* {amount < investmentpackage.minimum_amount ? null : (
                
              )} */}
            </>
          ))}
        </div>
      ) : null}
    </div>
  );

  const showError = (error) => (
    <div
      className="alert alert-danger"
      style={{ display: error ? "" : "none" }}
    >
      {error}
    </div>
  );

  const showSuccess = (success) => (
    <div
      className="alert alert-info"
      style={{ display: success ? "" : "none" }}
    >
      Thanks! Your payment of ${amount} was successful!
    </div>
  );

  const showLoading = (loading) =>
    loading && <h4 className="text-danger">Processing...</h4>;

  return (
    <div>
      {showLoading(data.loading)}
      {showSuccess(data.success)}
      {showError(data.error)}
      {showCheckout()}
    </div>
  );
};

export default Checkout;
