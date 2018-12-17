const { db } = require('./firebase');
const R = require('ramda');
const { domainProps, timestampCreate, timestampUpdate } = require('./dbProperties');
const { encrypt } = require('./encrypt.js');

const setDefaults = (domainData) => {
  const fields = [
    'audioOnlyEnabled',
    'embedEnabled',
    'fileSharingEnabled',
    'screenSharingEnabled',
    'hls',
    'httpSupport'
  ];
  const setDefault = (v, k) => (R.contains(k, fields) ? R.defaultTo(false)(v) : v);
  return R.mapObjIndexed(setDefault, domainData);
};

const buildDomain = data => setDefaults(R.pick(domainProps, data));

/**
 * Get the list of domains
 * @returns {Promise} <resolve: Domain List, reject: Error>
 */
const getDomains = async () => {
  const snapshot = await db.ref('domains').once('value');
  return snapshot.val();
};


/**
 * Get a particular Domain from firebase
 * @param {String} uid
 * @returns {Promise} <resolve: Domain data, reject: Error>
 */
const getDomainByName = async (name) => {
  const snapshot = await db.ref('domains').orderBy('domain')
        .equalTo(name).once('value');
  return snapshot.val();
};

/**
 * Get a particular Domain from firebase
 * @param {String} name
 * @returns {Promise} <resolve: Domain data, reject: Error>
 */
const getDomain = async (uid) => {
  const snapshot = await db.ref('domains').child(uid).once('value');
  return snapshot.val();
};

/**
 * Create an domain
 * @param {Object} data
 * @returns {Promise} <resolve: Domain data, reject: Error>
 */
const createDomain = async (data) => {
  const domainData = buildDomain(R.merge(timestampCreate, data));
  domainData.otSecret = domainData.otSecret ? encrypt(domainData.otSecret) : '';

  db.ref(`domains/${data.id}`).set(domainData);
  return getDomain(data.id);
};


/**
 * Update an domain
 * @param {String} uid
 * @param {Object} domain data: <otApiKey, otSecret, superDomain, httpSupport, displayName, email>
 * @returns {Promise} <resolve: Domain data, reject: Error>
 */
const updateDomain = async (uid, data) => {
  if (await getDomain(uid)) {
    const domainData = buildDomain(R.merge(timestampUpdate, data));
    if (domainData.otSecret) domainData.otSecret = encrypt(domainData.otSecret);

    db.ref(`domains/${uid}`).update(domainData);
    return await getDomain(uid);
  }
  return null;
};

/**
 * Delete an domain in the DB
 * @param {String} uid
 */
const deleteDomain = async (uid) => {
  db.ref(`domains/${uid}`).remove();
  return true;
};


export {
  getDomains,
  getDomain,
  getDomainByName,
  updateDomain,
  createDomain,
  deleteDomain
};
