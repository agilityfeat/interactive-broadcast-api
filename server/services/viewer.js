const { db, admin } = require('./firebase');
const R = require('ramda');
const { userProps, viewerProps, timestampCreate } = require('./dbProperties');

const buildUser = (data, props = userProps) => R.pick(props, data);
const buildViewer = (data, props = viewerProps) => R.pick(props, data);


/**
 * Get list of viewers
 * @param {String} adminId
 * @returns {Promise} <resolve: Viewer List, reject: Error/>
 */
const getViewers = async (adminId) => {
  const snapshot = await db.ref(`admins/${adminId}/viewers`).once('value');
  return snapshot.val();
};


/**
 * Get a particular viewer from firebase
 * @param {String} adminId
 * @param {String} uid
 * @returns {Promise} <resolve: Viewer data, reject: Error>
 */
const getViewer = async (adminId, uid) => {
  const viewers = await db.ref(`admins/${adminId}/viewers`);
  const snapshot = await viewers.child(uid).once('value');

  return snapshot.val();
};


/**
 * Delete a particular viewer from firebase
 * @param {String} uid
 * @returns {Promise} <resolve: Viewer data, reject: Error>
 */
const deleteViewer = async (adminId, uid) => {
  await db.ref(`admins/${adminId}/viewers/${uid}`).remove();
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
  db.ref(`admins/${data.adminId}/viewers/${user.uid}`).set(viewerData);
  return getViewer(data.adminId, user.uid);
};


export {
  getViewers,
  getViewer,
  deleteViewer,
  createViewer
};
