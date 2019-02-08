import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import config from '../../config/config';
import { getEventByKey, getMostRecentEvent } from './event';
import { getAdmin } from './admin';
import { getDomain } from './domain';
import { getViewerByEmail, buildViewer } from './viewer';
import { verifyIdToken } from './firebase';

const roles = {
  ADMIN: 'admin',
  PRODUCER: 'producer',
  HOST: 'host',
  CELEBRITY: 'celebrity',
  FAN: 'fan',
  BACKSTAGE_FAN: 'backstageFan',
  CELEBHOST: 'celebhost',
};

/**
 * Returns jwt token if valid username and password is provided
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
const login = async (req, res, next) => {
  const idToken = req.body.idToken;
  const uid = await verifyIdToken(idToken);
  const { domainId, superAdmin } = await getAdmin(uid);
  const { domain } = !superAdmin && await getDomain(domainId);

  if (uid && (superAdmin || req.originDomain === domain)) {
    const token = jwt.sign({
      uid,
      role: roles.ADMIN
    }, config.jwtSecret);
    return res.json({ token });
  }
  const err = new APIError('Authentication error', httpStatus.UNAUTHORIZED, true);
  return next(err);
};

/**
 * Returns jwt token if valid username and password is provided
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
const loginFan = async (req, res, next) => {
  const { fanUrl, domainId, email, password } = req.body;

  const user = email && await getViewerByEmail(domainId, email);
  const { registrationEnabled } = await getDomain(domainId);
  const authorized = user && bcrypt.compareSync(password, user.password);

  if (!registrationEnabled || authorized) {
    const token = jwt.sign({
      fanUrl,
      domainId,
      role: roles.FAN,
    }, config.jwtSecret);
    return res.json({ token, user: user && buildViewer(user) });
  }

  const err = new APIError('Authentication error', httpStatus.UNAUTHORIZED, true);
  return next(err);
};


/**
 * Returns jwt token if valid username and password is provided
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
const loginHost = async (req, res, next) => {
  const { hostUrl, domainId } = req.body;
  const event = hostUrl ? await getEventByKey(domainId, hostUrl, 'hostUrl') : await getMostRecentEvent(domainId);
  if (event) {
    const token = jwt.sign({
      hostUrl,
      domainId,
      role: roles.CELEBHOST,
    }, config.jwtSecret);
    return res.json({ token });
  }

  const err = new APIError('Authentication error', httpStatus.UNAUTHORIZED, true);
  return next(err);
};

/**
 * Returns jwt token if valid username and password is provided
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
const loginCelebrity = async (req, res, next) => {
  const { celebrityUrl, domainId } = req.body;
  const event = celebrityUrl ? await getEventByKey(domainId, celebrityUrl, 'celebrityUrl') : await getMostRecentEvent(domainId);
  if (event) {
    const token = jwt.sign({
      celebrityUrl,
      domainId,
      role: roles.CELEBHOST,
    }, config.jwtSecret);
    return res.json({ token });
  }

  const err = new APIError('Authentication error', httpStatus.UNAUTHORIZED, true);
  return next(err);
};

export default {
  login,
  loginFan,
  loginHost,
  loginCelebrity,
  roles
};
