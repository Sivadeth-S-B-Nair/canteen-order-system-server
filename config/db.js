const {Sequelize}=require('sequelize')
require('dotenv').config()

const sequelize=new Sequelize(process.env.DB_NAME,process.env.DB_USER,process.env.DB_PASSWORD,
    {
        host:process.env.DB_HOST,
        dialect:process.env.DB_DIALECT,
        logging:false,
        pool:{
            max:5,          // max 5 simultaneous DB connections
            min:0,
            acquire:30000,  // wait 30s before throwing connection error
            idle:10000      // release connection after 10s idle
        }
    }
)

module.exports=sequelize