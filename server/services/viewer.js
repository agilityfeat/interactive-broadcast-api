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
