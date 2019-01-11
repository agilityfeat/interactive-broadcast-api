import httpStatus from 'http-status';
import R from 'ramda';
import jwt from 'jsonwebtoken';
import config from '../../config/config';
import opentok from '../services/opentok';
import { roles } from '../services/auth';
import { eventStatuses } from '../services/dbProperties';
import APIError from '../helpers/APIError';

const Domain = require('../services/domain');
const Event = require('../services/event');


const sendError = (res, error) => {
  const validationError = new APIError(error.message || error,
    error.status || httpStatus.CONFLICT,
    error.code || -1);
  const { status, message, code } = validationError;
  res.status(status).send({ message, code });
};

const checkRole = (role, req, res, next) => {
  const token = req.headers.authorization.replace('Bearer ', '');
  jwt.verify(token, config.jwtSecret, (err, decoded) => {
    if (decoded.role === role || decoded.role === 'admin') {
      next();
    } else {
      sendError(res, { message: 'Authentication error', status: httpStatus.UNAUTHORIZED });
    }
  });
};

/* Exports */

const validateApiKey = (req, res, next) => {
  const { otApiKey, otSecret } = req.body;
  if (otApiKey || otSecret) {
    const ot = opentok.createOTInstance(otApiKey, otSecret);
    ot.createSession(err => (err ? sendError(res, 'Invalid APIKey or APISecret') : next()));
  } else {
    next();
  }
};

const validateEvent = (req, res, next) => {
  const { domainId, fanUrl } = req.body;
  const { id } = req.params;
  Domain.getDomain(domainId)
    .then(() => Event.getEventByKey(domainId, fanUrl, 'fanUrl'))
    .then(event => (!event || event.id === id || event.status === eventStatuses.CLOSED ? next() : sendError(res, 'Event exists')))
    .catch(R.partial(sendError, [res]));
};

const checkAdmin = (req, res, next) => checkRole(roles.ADMIN, req, res, next);
const checkFan = (req, res, next) => checkRole(roles.FAN, req, res, next);
const checkCelebHost = (req, res, next) => checkRole(req.params.userType === roles.FAN ? roles.FAN : roles.CELEBHOST, req, res, next);

module.exports = {
  validateApiKey,
  validateEvent,
  checkAdmin,
  checkFan,
  checkCelebHost
};
