const { db } = require('./firebase');
const R = require('ramda');
const { sharedFileProps } = require('./dbProperties');


const buildSharedFile = eventData => R.pick(sharedFileProps, eventData);

/**
 * Get list of files
 * @param {String} domainId
 * @returns {Promise} <resolve: File List, reject: Error/>
 */
const getFiles = async (domainId) => {
  const snapshot = await db.ref(`domains/${domainId}/files`).once('value');
  return snapshot.val();
};


/**
 * Get a particular file by id from firebase
 * @param {String} domainId
 * @param {String} email
 * @returns {Promise} <resolve: File data, reject: Error>
 */
const getFilesByUser = async (domainId, userId) => {
  const ref = await db.ref(`domains/${domainId}/files`).orderByChild('userId');
  const byMe = await db.ref(`domains/${domainId}/files`).orderByChild('fromId');

  const swm = await ref.equalTo(userId).once('value');
  const swa = await ref.equalTo('all').once('value');
  const sbm = await byMe.equalTo(userId).once('value');

  return { sharedByMe: sbm.val(), sharedWithMe: swm.val(), sharedWithAll: swa.val() };
};

/**
 * Delete a particular file from firebase
 * @param {String} uid
 * @returns {Promise} <resolve: File data, reject: Error>
 */
const deleteFile = async (domainId, id) => {
  await db.ref(`domains/${domainId}/files/${id}`).remove();
  return true;
};


/**
 * Create a file belonging to an event
 * @param {Object} file
 * @return {Promise} <resolve: File saved, reject: Error>
 */
const create = async (data) => {
  const { domainId, id } = data;
  const ref = db.ref(`domains/${domainId}/files/${id}`);
  const builtFile = buildSharedFile(data);

  await ref.set(builtFile);
  return builtFile;
};


export {
  create,
  getFiles,
  getFilesByUser,
  deleteFile,
};
