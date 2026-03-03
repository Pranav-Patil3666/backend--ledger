//business logic
// This controller file is going to handle the logic for creating a new transaction , 

/**
 * - Create a new Transaction
 * The 10- step transfer flow:
        * 1. Validate request
        * 2. Validate idempotency key
        * 3. check account status
        * 4. derive sender balance from ledger
        * 5. create transaction (pending)
        * 6. create debit ledger entry
        * 7. create credit ledger entry
        * 8. mark transaction complete
        * 9. commit mongoDb session
        * 10. send email notification
        * 
 */

const transactionModel= require("../models/transaction.model")
const ledgerModel= require("../models/ledger.model")
const accountModel= require("../models/account.model")
const emailService= require("../services/email.service")
const mongoose = require('mongoose')


async function createTransaction(req,res){
    
    const { fromAccount , toAccount, amount, idempotencyKey } = req.body;

    if(!fromAccount || !toAccount || !amount || !idempotencyKey ){
        return res.status(400).json({   // 400 tb jab client side se glti
            message:"All fields are required",
            success: false  
        })
    }

    //1.check if fromAccount and toAccount exists in db

    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount,
    })

    
    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if(!fromUserAccount || !toUserAccount)
    {
        return res.status(400).json({
            message:"Invalid fromAccount or toAccount",
        })
    }

    //2.validate idempotency key

    const isTransactionAlreadyExists= await transactionModel.findOne({
        idempotencyKey : idempotencyKey
    })

    if(isTransactionAlreadyExists)
    {
        if(isTransactionAlreadyExists.status==="COMPLETED") 
            {
                return res.status(200).json({
                    message:"Transaction already processed",
                    transaction : isTransactionAlreadyExists,
                })
            } 
        if(isTransactionAlreadyExists.status==="PENDING") 
        {
            return res.status(200).json({
                    message:"Transaction pending",
                    
                })
        }
        if(isTransactionAlreadyExists.status==="FAILED") 
        {
            return res.status(500).json({
                    message:"Transaction processing failed",
                    
                })
        }
        if(isTransactionAlreadyExists.status==="REVERSED") 
        {
            return res.status(200).json({
                    message:"Transaction WAS reversed , please retyr",
                    
                })
        }

    }

    // 3. check account status

    if(fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE")
    {
        return res.status(400).json({
                    message:"Both sender and receiver account must be active",
                })
    }

    //4.sender balance before deducting- For this we use aggregation pipeline to calculate the balance of the sender account from the ledger entries

    const balance = await fromUserAccount.getBalance()

    if(balance < amount){
        return res.status(400).json({
            message: `Insufficient balance in fromAccount. current balance is ${balance}.`
        })
    }

    //5.create transaction
    //5-8 parts are completed in one single session

    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = new transactionModel({
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status:"PENDING"
    } )

    const debitLedgerEntry = await ledgerModel.create([{
        account :fromAccount,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
    }], { session })

    const creditLedgerEntry = await ledgerModel.create([{
        account :toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
    }], { session })

    transaction.status= "COMPLETED" 
    await transaction.save({session})

    await session.commitTransaction()
    session.endSession()

    //10. send email notification

    await emailService.sendTransactionEmail(req.user.email , req.user.name, amount, fromAccount, toAccount)

    return res.status(201).json({
        message: "Transaction completed successfully",
        transaction : transaction,
    })

}

async function createInitialFundsTransaction(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body

  if (!toAccount || typeof amount !== "number" || amount <= 0 || !idempotencyKey) {
    return res.status(400).json({ message: "Invalid input" })
  }

  const toUserAccount = await accountModel.findById(toAccount)
  if (!toUserAccount) {
    return res.status(400).json({ message: "Invalid toAccount" })
  }

  const systemAccount = await accountModel.findOne({ systemUser: true })
  if (!systemAccount) {
    return res.status(500).json({ message: "System account not found" })
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const transaction = new transactionModel({
      fromAccount: systemAccount._id,
      toAccount: toUserAccount._id,
      amount,
      idempotencyKey,
      status: "PENDING",
    })

    await transaction.save({ session })

    await ledgerModel.create(
      [
        {
          account: systemAccount._id,
          transaction: transaction._id,
          amount,
          type: "DEBIT",
        },
        {
          account: toUserAccount._id,
          transaction: transaction._id,
          amount,
          type: "CREDIT",
        },
      ],
      { session , ordered: true}
    )

    transaction.status = "COMPLETED"
    await transaction.save({ session })

    await session.commitTransaction()

    return res.status(201).json({
      message: "Initial fund transaction completed successfully",
      transaction,
    })
  } catch (err) {
    await session.abortTransaction()
    throw err
  } finally {
    session.endSession()
  }
}

module.exports = {
    createTransaction, createInitialFundsTransaction
}