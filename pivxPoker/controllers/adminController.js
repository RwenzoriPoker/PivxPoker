/**
 * This page is mainly for adminPage to get its data
 */

const User = require('../models/user');
const Visited = require('../models/visited');
const Ticket = require('../models/ticket');
const Recharge = require('../models/recharge');
const Withdrawal = require('../models/withdrawal');
const CashGame=require('../models/cashGame');
const SitGame=require('../models/sitGame');
const { sha256 } = require('../utils/fair');
const { sendToAddress, getTotalBalance } = require('../utils/pivx');


/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
exports.getTotal = async (req, res, next) => {
  const visits = await Visited.countDocuments({});
  const users = await User.countDocuments({});

  let recharges = await Recharge.aggregate([
    { $match: {} },
    { $group: { _id: null, amount: { $sum: '$amount' } } }
  ]);

  let withdraws = await Withdrawal.aggregate([
    { $match: { status: 1 } },
    { $group: { _id: null, amount: { $sum: '$amount' } } }
  ]);
  let balance = await User.aggregate([
    { $match: {} },
    { $group: { _id: null, amount: { $sum: '$pivx' } } }
  ]);
  return res.status(200).json({ visits, users, recharges, withdraws, balance });
};

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
exports.getVisit = async (req, res, next) => {
  let fromDate = new Date(req.params.from);
  const toDate = new Date(req.params.to);
  const dates = Math.ceil((toDate - fromDate) / (3600000 * 24));
  const visits = [];
  const users = [];
  for (let i = 0; i <= dates; i++) {
    const nextDate = new Date(fromDate);
    nextDate.setDate(nextDate.getDate() + 1);
    // console.log(nextDate);
    const visit = await Visited.countDocuments({ createdAt: { $lt: nextDate, $gte: fromDate } });
    const user = await User.countDocuments({ created: { $lt: nextDate, $gte: fromDate } });
    visits.push(visit);
    users.push(user);
    fromDate.setDate(fromDate.getDate() + 1);
  }
  return res.json({ visits, users });
};

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
exports.getWallet = async (req, res, next) => {
  let fromDate = new Date(req.params.from);
  const toDate = new Date(req.params.to);
  const dates = Math.ceil((toDate - fromDate) / (3600000 * 24));
  const recharges = [],
    withdraws = [];
  for (let i = 0; i <= dates; i++) {
    const nextDate = new Date(fromDate);
    nextDate.setDate(nextDate.getDate() + 1);
    // console.log(nextDate);
    const recharge = await Recharge.aggregate([
      { $match: { createdAt: { $lt: nextDate, $gte: fromDate } } },
      { $group: { _id: null, amount: { $sum: '$amount' } } }
    ]);
    recharges.push(Number(recharge[0] ? recharge[0].amount : 0));
    const withdraw = await Withdrawal.aggregate([
      { $match: { createdAt: { $lt: nextDate, $gte: fromDate }, status: 1 } },
      { $group: { _id: null, amount: { $sum: '$amount' } } }
    ]);
    withdraws.push(Number(withdraw[0] ? withdraw[0].amount : 0));
    fromDate.setDate(fromDate.getDate() + 1);
  }
  return res.json({ recharges, withdraws });
};

/**
 * get feedback
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getTicket = async (req, res, next) => {
  const status = req.params.status == 1 ? true : false;
  const feedbacks = await Ticket.find({ status })
    .populate('sender')
    .skip((req.params.page - 1) * 20)
    .limit(20);
  const total = await Ticket.countDocuments({});
  res.status(200).json({ feedbacks, last_page: Math.ceil(total / 20) });
};

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.patchTicket = async (req, res, next) => {
  const feedback = await Ticket.findById(req.params.id);
  feedback.status = true;
  await feedback.save();
  res.status(200).json({ message: 'ok' });
};

/**
 * user Admin
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
exports.getUsers = async (req, res, next) => {
  const search = req.params.search;
  const page = req.params.page;
  if (search) {
    const users = await User.find({ username: { $regex: search } })
      .sort({ _id: -1 })
      .skip((page - 1) * 20)
      .limit(20);
    const total = await User.countDocuments({ username: { $regex: search } });
    return res.status(200).json({
      users: users,
      page: page,
      last_page: Math.ceil(total / 20)
    });
  } else if (page) {
    const users = await User.find({})
      .sort({ _id: -1 })
      .skip((page - 1) * 20)
      .limit(20);
    const total = await User.countDocuments({});

    return res.status(200).json({
      users: users,
      page: page,
      last_page: Math.ceil(total / 20)
    });
  } else {
    const users = await User.find({});

    return res.status(200).json(users);
  }
};

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
exports.getUser = async (req, res, next) => {
  try {
    const user_db = await User.findById(req.params.id);
    const user = user_db.toJSON();
    user.financials = user_db.financials;
    const recharges = await Recharge.find({ user: req.params.id });
    const withdrawals = await Withdrawal.find({ user: req.params.id });
    return res.status(200).json({ user, recharges, withdrawals });
  } catch (err) {
    // console.log(err);
    return res.status(400).json({ message: 'failed' });
  }
};
/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
exports.putPointUp = async (req, res, next) => {
  const user = await User.findById(req.params.id);
  user.admin = true;
  await user.save();

  return res.status(200).json(user);
};
/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
exports.putPointDown = async (req, res, next) => {
  const user = await User.findById(req.params.id);
  user.admin = false;
  await user.save();
  return res.status(200).json(user);
};
/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
exports.removeUser = async (req, res, next) => {
  await Recharge.deleteMany({ user: req.params.id });
  await Ticket.deleteMany({ sender: req.params.id });
  await Visited.deleteMany({ user: req.params.id });
  await Withdrawal.deleteMany({ user: req.params.id });
  const user = await User.findById(req.params.id);
  await user.remove();
  return res.status(200).json({ message: 'ok' });
};

/**
 * added for admin withdraw page
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
exports.getTotalProfit = async (req, res, next) => {
  let balanceUsers = await User.aggregate([
    { $match: {} },
    { $group: { _id: null, amount: { $sum: '$pivx' } } }
  ]);
  const respond = await getTotalBalance();
  if (respond.body.error == null) {
    const balanceWallet = respond.body.result;
    return res.status(200).json({ balanceWallet, balanceUsers });
  }
  return res.status(200).json({ balanceWallet: 0, balanceUsers });
};

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
exports.postProfitWithdraw = async (req, res, next) => {
  const respond = await sendToAddress(req.body.address, req.body.amount);
  if (respond.body && respond.body.error == null) {
    return res.status(200).json({ message: 'Successfully withdrawn!' });
  }
  return res.status(403).json({ message: 'Failed!' });
};

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
exports.postRakes = async (req, res, next) => {
  try {
    if (req.body.sitRakes) {
      require('fs').unlinkSync(__dirname + '/../uploads/configs/sitRakes.json');
    }
    if (req.body.cashRakes) {
      require('fs').unlinkSync(__dirname + '/../uploads/configs/cashRakes.json');
    }
    require('fs').writeFileSync(
      __dirname + '/../uploads/configs/sitRakes.json',
      req.body.sitRakes,
      'utf8'
    );
    require('fs').writeFileSync(
      __dirname + '/../uploads/configs/cashRakes.json',
      req.body.cashRakes,
      'utf8'
    );
    return res.status(200).json({ message: 'Successfully uploaded!' });
  } catch (err) {
    console.log(err);
    return res.status(400).json({});
  }
};

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
exports.getTableData = async (req, res, next) => {
  try {
    if(req.params.category==0){
      const cashGame=await CashGame.findById(req.params.id);
      if(cashGame.closed){
        return res.status(200).json({
          name:cashGame.name,
          serverSeed:cashGame.serverSeed,
          serverHash:sha256(cashGame.serverSeed)
        })
      }else{
        return res.status(400).json({message:'No Game records!'});
      }
    }else{
      const sitGame=await SitGame.findById(req.params.id);
      if(sitGame.closed){
        return res.status(200).json({
          name:sitGame.name,
          serverSeed:sitGame.serverSeed,
          serverHash:sha256(sitGame.serverSeed)
        })
      }else{
        return res.status(400).json({message:'No Game records!'});
      }
    }
  } catch (err) {
    console.log(err);
    return res.status(400).json({err});
  }
};

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
exports.test = async (req, res, next) => {
  const {category}=req.params;
  console.log(category)
        return res.status(200).json({message:category});
      
   
};
