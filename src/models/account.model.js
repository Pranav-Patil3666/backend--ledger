const mongoose= require('mongoose');
const ledgerModel= require('./ledger.model')

const accountSchema = new mongoose.Schema({

    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"user" , // the name given in userModel
        required:[ true, "Account must be associated with a user"],
        index: true   // for faster searching
    },
    status :{
        type:String,
        enum:{
            values:["ACTIVE", "FROZEN", "CLOSED"],
            message:"Status can be either ACTIVE, FROZEN or CLOSED",
        },
        default:"ACTIVE"
    },

    currency:{
        type: String,
        required: [true, "Currency is required for creating an account"],
        default: "INR"
    },
    
     systemUser :{
        type :Boolean,
        default: false,
        immutable: true,
        select: false,
    }

    //blance is never hard coded in database , that is why we use ledger
},{
    timestamps: true
})

accountSchema.index({user:1,status:1})  // to create a compound index on user and status fields for faster querying of accounts based on user and status

accountSchema.methods.getBalance = async function()
{
     const balanceData= await ledgerModel.aggregate([
        {$match :{ account :this._id } },
        {
            $group:{
                _id:null,
                totalDebit:{
                    $sum:{
                        $cond:[
                            {$eq:["$type","DEBIT"]},
                            "$amount",
                            0
                        ]
                    }
                },
                totalCredit:{
                    $sum:{
                        $cond:[
                            {$eq:["$type","CREDIT"]},
                            "$amount",
                            0
                        ]
                    }
                }
            }
        },
        {
            $project:{
                _id: 0,
                balance :{ $subtract: ["$totalCredit", "$totalDebit"]}
            }
        }
     ])

     //if user is new , then this balanceData will return an empty array

     if(balanceData.length === 0)
     {
        return 0
     }
     return balanceData[0].balance
}

const accountModel= mongoose.model("account", accountSchema)

module.exports =accountModel