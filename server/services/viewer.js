const { db, admin } = require('./firebase');
const R = require('ramda');
const { userProps, viewerProps, timestampCreate } = require('./dbProperties');

const buildUser = (data, props = userProps) => R.pick(props, data);
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

  return snapshot.val();
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
  let user = null;

  try {
    user = await admin.auth().createUser(buildUser(data));
  } catch (error) {
    user = await admin.auth().getUserByEmail(data.email);
  }

  const viewerData = buildViewer(R.merge(timestampCreate, data));
  db.ref(`domains/${data.domainId}/viewers/${user.uid}`).set(viewerData);
  return getViewer(data.domainId, user.uid);
};


export {
  getViewers,
  getViewer,
  deleteViewer,
  createViewer
};
