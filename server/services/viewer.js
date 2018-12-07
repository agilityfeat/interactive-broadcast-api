const { db } = require('./firebase');
const R = require('ramda');
const bcrypt = require('bcrypt');
const { viewerProps, timestampCreate } = require('./dbProperties');

const buildViewer = (data, props = viewerProps) => R.pick(props, data);


/**
 * Get list of viewers
 * @param {String} domainId
 * @returns {Promise} <resolve: Viewer List, reject: Error/>
 */
const getViewers = async (domainId) => {
  const snapshot = await db.ref(`domains/${domainId}/viewers`).once('value');
  return snapshot.val();
};


/**
 * Get a particular viewer from firebase
 * @param {String} domainId
 * @param {String} uid
 * @returns {Promise} <resolve: Viewer data, reject: Error>
 */
const getViewer = async (domainId, uid) => {
  const viewers = await db.ref(`domains/${domainId}/viewers`);
  const snapshot = await viewers.child(uid).once('value');

  return buildViewer(snapshot.val());
};


/**
 * Get a particular viewer by email from firebase
 * @param {String} domainId
 * @param {String} email
 * @returns {Promise} <resolve: Viewer data, reject: Error>
 */
const getViewerByEmail = async (domainId, email) => {
  const viewers = await db.ref(`domains/${domainId}/viewers`).orderByChild('email');
  const snapshot = await viewers.equalTo(email).once('value');
  const viewer = snapshot.val() && snapshot.val()[Object.keys(snapshot.val())[0]];

  return viewer;
};

/**
 * Send a reset password email for viewers
 * @param {String} domainId
 * @param {String} email
 * @returns {Promise} <resolve: Promise>
 */
const sendResetPassword = async (userUrl, domainId, email) => {
  const viewer = await getViewerByEmail(domainId, email);
  const domain = await getDomain(domainId);

  const mailer = new Mailer();
  return await mailer.sendViewerResetMail(userUrl, domain, viewer);
};


/**
 * Send a reset password email for viewers
 * @param {String} token
 * @param {String} password
 * @returns {Promise} <resolve: Promise>
 */
const resetPassword = async (token, password) => {
  const { domainId, userId, userUrl } = jwt.verify(token, process.env.JWT_SECRET);
  const viewerPass = await db.ref(`domains/${domainId}/viewers/${userId}/password`);

  await viewerPass.set(bcrypt.hashSync(password, 10));
  return { success: true, userUrl };
};


/**
 * Delete a particular viewer from firebase
 * @param {String} uid
 * @returns {Promise} <resolve: Viewer data, reject: Error>
 */
const deleteViewer = async (domainId, uid) => {
  await db.ref(`domains/${domainId}/viewers/${uid}`).remove();
  return true;
};


/**
 * Create a new viewer
 * @returns {Promise} <resolve: Viewer data, reject: Error/>
 */
const createViewer = async (data) => {
  if (!await getViewerByEmail(data.domainId, data.email)) {
    /* eslint-disable no-param-reassign */
    data.password = bcrypt.hashSync(data.password, 10);
    data.timeStampCreate = timestampCreate;
    db.ref(`domains/${data.domainId}/viewers/${data.id}`).set(data);

    return getViewer(data.domainId, data.id);
  }

  return null;
};


export {
  buildViewer,
  getViewers,
  getViewer,
  getViewerByEmail,
  deleteViewer,
  createViewer
};
