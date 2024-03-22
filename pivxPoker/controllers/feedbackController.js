const User = require('../models/user');
// const Feedback=require('../models/feedback');
const Ticket=require('../models/ticket');
const { body, validationResult } = require('express-validator');

/**
 * post feedback
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
exports.postFeedback = async (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array({ onlyFirstError: true });
    return res.status(422).json({ errors });
  }

  const user=await User.findById(req.user.id);
  user.email=req.body.email;
  await user.save();
  const tmp={};
  tmp.sender=user.id;
  tmp.content=req.body.content;
  // if(req.body.type){
    await (new Ticket(tmp)).save();
  // }else{
  //   await (new Feedback(tmp)).save();
  // }

  res.status(200).json({ email: user.email });
};

exports.validateFeedback = [
  body('email')
    .exists()
    .trim()
    .withMessage('is required')

    .notEmpty()
    .withMessage('cannot be blank')

    .isEmail()
    .withMessage('is not email type'),   

  body('content')
    .exists()
    .trim()
    .withMessage('is required')

    .notEmpty()
    .withMessage('cannot be blank')

    .isLength({ min: 20 })
    .withMessage('must be at least 20 characters long')

    .isLength({ max: 500 })
    .withMessage('must be at most 500 characters long')
];
