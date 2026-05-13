const bcrypt = require("bcryptjs");
const { Restaurant, User } = require("../models");
const emailService=require("./email.service")

const createRestaurant = async ({ name, location }) => {
  return Restaurant.create({ name, location });
};

const createRestaurantAdmin = async ({
  name,
  email,
  password,
  restaurantId,
}) => {
  const restaurant = await Restaurant.findByPk(restaurantId);
  if (!restaurant) {
    const err = new Error(`Restaurant with id ${restaurantId} not found`);
    err.status = 404;
    throw err;
  }
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    const err = new Error("Email already registered");
    err.status = 409;
    throw err;
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "restaurant_admin",
    restaurantId,
  });

  const emailSent=await emailService.sendRestaurantAdminCredentials({name,email,password,restaurantName:restaurant.name})

  const {password:_p,...safeUser}=user.toJSON()
  return {user:safeUser,emailSent}
};
const listRestaurants=async(activeOnly=false)=>{
    const where=activeOnly?{isActive:true}:{}
    return Restaurant.findAll({where,order:[["name","ASC"]]})
}

module.exports={createRestaurant,createRestaurantAdmin,listRestaurants}