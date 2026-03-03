const express= require('express');
const authMiddleware= require("../middleware/auth.middleware")
const accountController= require("../controllers/acount.controller")


const router= express.Router()

/**
 * - POST/api/accounts/
 * - Create a new account
 * - protected route 
 */

router.post("/", authMiddleware.authMiddleware, accountController.createAccountController)  //this is done to prevent unauthorized access to this route , only authenticated users can create accounts

router.get("/",authMiddleware.authMiddleware,accountController.getUserAccountsController)

/**
 * - GET/api/accounts/balance/:accountId
 */

router.get("/balance/:accountId",authMiddleware.authMiddleware,accountController.getUserBalance)


module.exports=router