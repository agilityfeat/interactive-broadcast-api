import config from '../../config/config';

const R = require('ramda');
const { db } = require('./firebase');
const { removeAllImages, updateImages } = require('./imageStorage');
const { eventProps, timestampCreate, timestampUpdate, eventStatuses, TS, eventPublicProps } = require('./dbProperties');
const Admin = require('./admin');
const Domain = require('./domain');
const OpenTok = require('./opentok');

const {
  roles
} = require('./auth');
const broadcast = require('./broadcast');

/** Private */
const setDefaults = (eventData) => {
  const setDefaultProps = {
    status: R.defaultTo(eventStatuses.NOT_STARTED),
    archiveEvent: R.defaultTo(false),
    uncomposed: R.defaultTo(false),
  };
  return R.evolve(setDefaultProps, eventData);
};
const buildEvent = (props, eventData) => setDefaults(R.pick(props, eventData));
const buildOtData = userType => JSON.stringify({
  userType
});
const sortByCreatedAt = R.sortWith([R.ascend(R.prop('createdAt'))]);
const filterByStatus = status => R.find(R.propEq('status', status));
const getImages = R.pick(['startImage', 'endImage']);

/** Exports */

/**
 * Get the list of events
 * @returns {Promise} <resolve: Event List, reject: Error>
 */
const getEvents = async () => {
  const snapshot = await db.ref('events').orderByChild('domainId').once('value');
  return snapshot.val();
};

/**
 * Get the list of events by admin for mobile apps without token
 * @returns {Promise} <resolve: Event List, reject: Error>
 */
const getEventsByAdmin = async (adminId = null) => {
  const events = await db.ref('events').orderByChild('adminId').equalTo(adminId).once('value');
  if (events) {
    const notClosed = event => event.status !== eventStatuses.CLOSED;
    const pickProps = items => items.map(item => R.pick(eventPublicProps, item));
    return R.filter(notClosed, sortByCreatedAt(pickProps(Object.values(events))));
  }
  return null;
};

const getEventsByDomainId = async (domainId = null) => {
  const snapshot = await db.ref('events').orderByChild('domainId').equalTo(domainId).once('value');
  return snapshot.val();
};

/**
 * Get the last event that is `live` or `preshow`
 * @param {String} domainId
 * @returns {Promise} <resolve: Event List, reject: Error>
 */
const getMostRecentEvent = async (domainId = null) => {
  const snapshot = await getEventsByDomainId(domainId);
  if (snapshot) {
    const events = sortByCreatedAt(Object.values(snapshot));
    return filterByStatus(eventStatuses.LIVE)(events) || filterByStatus(eventStatuses.PRESHOW)(events);
  }
  return null;
};

/**
 * Get a particular Event
 * @param {String} id
 * @returns {Promise} <resolve: Event data, reject: Error>
 */
const getEvent = async (id) => {
  const snapshot = await db.ref('events').child(id).once('value');
  return snapshot.val();
};

/**
 * Get a particular Event by sessionId
 * @param {String} sessionId
 * @returns {Promise} <resolve: Event data, reject: Error>
 */
const getEventBySessionId = async (sessionId) => {
  const snapshot = await db.ref('events').orderByChild('sessionId').equalTo(sessionId).once('value');
  return R.values(snapshot.val())[0];
};

/**
 * Get a particular Event by primary key <slug, domainId>
 * @param {String} domainId
 * @param {String} slug <fanUrl OR hostUrl OR celebrityUrl>
 * @returns {Promise} <resolve: Event data, reject: Error>
 */
const getEventByKey = async (domainId, slug, field = 'fanUrl') => {
  const snapshot = await db.ref('events').orderByChild(field).equalTo(slug).once('value');
  if (snapshot.numChildren()) {
    const events = Object.values(snapshot.val());
    // Filtering by domainId
    return R.findLast(R.propEq('domainId', domainId))(events);
  }

  return null;
};

/**
 * Create an event
 * @param {Object} event
 * @returns {Promise} <resolve: Event data, reject: Error>
 */
const saveEvent = async (data) => {
  const id = db.ref('events').push().key;
  await db.ref(`events/${id}`).set(buildEvent(eventProps, R.mergeAll([timestampCreate, {
    id
  }, data])));
  return await getEvent(id);
};

/**
 * Creates the backstage and onstage sessions for an event
 * @param {Object} event
 * @returns {Object} <sessionId, stageSessionId>
 */
const getSessions = async (domain) => {
  const createSession = ({
    otApiKey,
    otSecret
  }) => OpenTok.createSession(otApiKey, otSecret);
  try {
    const session = await createSession(domain);
    const stageSession = await createSession(domain);
    return {
      sessionId: session.sessionId,
      stageSessionId: stageSession.sessionId
    };
  } catch (error) {
    throw new Error('Failed to createSession');
  }
};

/**
 * Save an event
 * @param {Object} data
 * @param {String} data.adminId
 * @param {String} data.domainId
 * @param {Boolean} data.archiveEvent
 * @param {String} data.celebrityUrl
 * @param {String} data.fanUrl
 * @param {String} data.hostUrl
 * @param {String} data.name
 * @param {String} data.rtmpUrl
 * @param {String} data.uncomposed
 */
const create = async (data) => {
  try {
    const domain = await Domain.getDomain(data.domainId);
    const sessions = await getSessions(domain);
    const status = eventStatuses.NOT_STARTED;
    const rtmpUrl = '';
    const defaultValues = {
      status,
      rtmpUrl
    };
    return saveEvent(R.mergeAll([defaultValues, data, sessions]));
  } catch (err) {
    const error = { message: err.message };
    throw error;
  }
};

/**
 * Update an event
 * @param {String} id
 * @param {Object} eventData
 * @returns {Promise} <resolve: Event data, reject: Error>
 */
const update = async (id, data) => {
  const currentImages = getImages((await db.ref(`events/${id}`).once('value')).val());
  updateImages(currentImages, getImages(data));
  await db.ref(`events/${id}`).update(buildEvent(eventProps, R.merge(timestampUpdate, data)));
  return getEvent(id);
};

/**
 * Start archive
 * @param {String} id
 * @returns archiveId
 */
const startArchive = async (id) => {
  const event = await getEvent(id);
  if (event.archiveEvent) {
    const domain = await Domain.getDomain(event.domainId);
    try {
      const archiveId = await OpenTok.startArchive(domain.otApiKey, domain.otSecret, event.stageSessionId, event.name, event.uncomposed);
      // eslint-disable-next-line no-console
      console.log('Starting the archive => ', archiveId);
      return archiveId;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('Error starting the archive =>', error);
    }
  }
  return false;
};

/**
 * Stop archive
 * @param {String} id
 * @returns true
 */
const stopArchive = async (event, domain) => {
  if (event.archiveId) {
    try {
      await OpenTok.stopArchive(domain.otApiKey, domain.otSecret, event.archiveId);
      const archiveExtension = event.uncomposed ? 'zip' : 'mp4';
      const url = `${config.bucketUrl}/${domain.otApiKey}/${event.archiveId}/archive.${archiveExtension}`;
      // eslint-disable-next-line no-console
      console.log('Stopping the archive =>', url);
      return url;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('Error stopping the archive =>', error);
    }
  }
  return true;
};

/**
 * Create a new record in the activeBroadcasts node
 * @param {String} id
 * @returns {Promise} <resolve: Event data, reject: Error>
 */
const addActiveBroadcast = async (id) => {
  const event = await getEvent(id);
  const domain = await Domain.getDomain(event.domainId);
  const record = {
    interactiveLimit: config.interactiveStreamLimit,
    name: event.name,
    hlsUrl: null,
    status: eventStatuses.PRESHOW,
    startImage: event.startImage || null,
    endImage: event.endImage || null,
    activeFans: null,
    archiving: false,
    hlsEnabled: domain.hls || false,
  };
  const ref = db.ref(`activeBroadcasts/${event.domainId}/${event.fanUrl}`);
  try {
    ref.set(record);
    ref.on('value', async (value) => {
      const activeBroadcast = value.val();
      if (activeBroadcast) {
        const {
          activeFans,
          hlsUrl,
          hlsEnabled,
          status
        } = activeBroadcast; // eslint-disable-line  no-unused-vars
        const viewers = R.length(R.keys(activeFans)); // eslint-disable-line  no-unused-vars
        /* Uncomment the next line if you need to consider the limit */
        // const shouldStartBroadcast = hlsEnabled && !hlsUrl && status === 'live' && viewers >= interactiveLimit;
        const shouldStartBroadcast = (hlsEnabled || event.rtmpUrl) && !hlsUrl && status === 'live';
        if (shouldStartBroadcast) {
          const broadcastData = await broadcast.start(domain.otApiKey, domain.otSecret, event.stageSessionId, event.rtmpUrl, hlsEnabled);
          await ref.update(broadcastData);
        }
      }
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error connecting to firebase => ', error);
  }
};

/**
 * Update the status of an activeBroadcast
 * @param {String} id
 * @param {String} newStatus
 * @param {String} archiveId
 * @returns {Promise} <resolve: Event data, reject: Error>
 */
const updateActiveBroadcast = async (id, newStatus, archiveId) => {
  const event = await getEvent(id);
  const record = {
    status: newStatus,
    archiving: archiveId !== false,
  };
  try {
    await db.ref(`activeBroadcasts/${event.domainId}/${event.fanUrl}`).update(record);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
  }
};

/**
 * Stop HLS if it's running
 * @param {String} id
 * @returns {Promise} <resolve: Event data, reject: Error>
 */
const stopHLS = async (otApiKey, otSecret, fanUrl, domainId) => {
  try {
    const query = await db.ref(`activeBroadcasts/${domainId}/${fanUrl}`).once('value');
    const activeBroadcast = query.val();
    if (activeBroadcast.hlsUrl) broadcast.stop(otApiKey, otSecret, activeBroadcast.hlsId);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error stopping HLS', error);
  }
};

/**
 * Delete an activeBroadcast
 * @param {String} id
 * @returns {Promise} <resolve: Event data, reject: Error>
 */
const deleteActiveBroadcast = async (fanUrl, domainId) => {
  try {
    await db.ref(`activeBroadcasts/${domainId}/${fanUrl}`).remove();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
  }
};

/**
 * Change status
 * @param {String} id
 * @param {Object} eventData
 * @returns {Promise} <resolve: Event data, reject: Error>
 */
const changeStatus = async (id, data) => {
  const updateData = data;

  if (data.status === eventStatuses.PRESHOW) {
    /* Create a new record in activeBroadcasts node */
    await addActiveBroadcast(id);
  } else if (data.status === eventStatuses.LIVE) {
    updateData.showStartedAt = TS;

    /* Start archiving */
    const archiveId = await startArchive(id);
    updateData.archiveId = archiveId;

    /* Update the status of the activeBroadcast */
    await updateActiveBroadcast(id, data.status, archiveId);
  } else if (data.status === eventStatuses.CLOSED) {
    /* Get the event and domain information */
    const event = await getEvent(id);
    const domain = await Domain.getDomain(event.domainId);

    /* Stop HLS */
    await stopHLS(domain.otApiKey, domain.otSecret, event.fanUrl, event.domainId);

    /* Delete the activeBroadcast record */
    await deleteActiveBroadcast(event.fanUrl, event.domainId);

    /* Stop archiving */
    const archiveUrl = await stopArchive(event, domain);
    updateData.archiveUrl = archiveUrl;

    /* update the showEndedAt */
    updateData.showEndedAt = TS;
  }
  return update(id, updateData);
};

/**
 * Delete an event
 * @param {String} id
 */
const deleteEvent = async (id) => {
  removeAllImages(getImages((await db.ref(`events/${id}`).once('value')).val()));
  await db.ref(`events/${id}`).remove();
  return true;
};

/**
 * Delete events by AdminId
 * @param {String} id
 */
const deleteEventsByAdminId = async (id) => {
  const ref = db.ref('events');
  const removeEvents = (snapshot) => {
    const updates = {};
    snapshot.forEach((child) => {
      updates[child.key] = null;
    });
    ref.update(updates);
  };

  const snapshot = await ref.orderByChild('adminId').equalTo(id).once('value');
  removeEvents(snapshot);
  return true;
};

/**
 * Create the tokens for the producer, and returns also the event data
 * @param {String} eventId
 * @returns {Object}
 */
const createTokenProducer = async (id) => {
  const event = await getEvent(id);
  const domain = await Domain.getDomain(event.domainId);
  const options = {
    role: OpenTok.otRoles.MODERATOR,
    data: buildOtData(roles.PRODUCER)
  };
  const backstageToken = await OpenTok.createToken(domain.otApiKey, domain.otSecret, event.sessionId, options);
  const stageToken = await OpenTok.createToken(domain.otApiKey, domain.otSecret, event.stageSessionId, options);
  return R.merge(event, {
    apiKey: domain.otApiKey,
    backstageToken,
    stageToken
  });
};

const createTokensFan = async (otApiKey, otSecret, stageSessionId, sessionId) => {
  const options = {
    role: OpenTok.otRoles.PUBLISHER,
    data: buildOtData(roles.FAN)
  };
  const backstageToken = await OpenTok.createToken(otApiKey, otSecret, sessionId, R.assoc('data', buildOtData(roles.BACKSTAGE_FAN), options));
  const stageToken = await OpenTok.createToken(otApiKey, otSecret, stageSessionId, options);
  return {
    backstageToken,
    stageToken
  };
};


/**
 * Create the tokens for the fan, and returns also the event data
 * @param {String} fanUrl
 * @param {String} domainId
 * @returns {Object}
 */
const createTokenFan = async (domainId, slug) => {
  const event = await getEventByKey(domainId, slug, 'fanUrl');
  const { httpSupport, otApiKey, otSecret } = await Domain.getDomain(domainId);
  const { backstageToken, stageToken } = await createTokensFan(otApiKey, otSecret, event.stageSessionId, event.sessionId);
  return R.merge(event, {
    apiKey: otApiKey,
    backstageToken,
    stageToken,
    httpSupport
  });
};

/**
 * Create the token for the host or celebrity, and returns also the event data
 * @param {String} domainId
 * @param {String} slug
 * @param {String} userType
 * @returns {Object}
 */
const createTokenHostCeleb = async (domainId, slug, userType) => {
  const field = userType === 'host' ? 'hostUrl' : 'celebrityUrl';
  const event = await getEventByKey(domainId, slug, field);
  const domain = await Domain.getDomain(domainId);
  const options = {
    role: OpenTok.otRoles.PUBLISHER,
    data: buildOtData(userType)
  };
  const stageToken = await OpenTok.createToken(domain.otApiKey, domain.otSecret, event.stageSessionId, options);
  return R.merge(event, {
    apiKey: domain.otApiKey,
    stageToken,
    httpSupport: domain.httpSupport
  });
};

const buildEventKey = (fanUrl, domainId) => [fanUrl, domainId].join('-');

/**
 * Get credentils for the last event that is `live` or `preshow`
 * @param {String} domainId
 * @param {String} userType <host/celebrity>
 * @returns {Promise} <resolve: Event List, reject: Error>
 */
const createTokenByUserType = async (domainId, userType) => {
  const event = await getMostRecentEvent(domainId);
  if (event) {
    return userType !== roles.FAN ?
      await createTokenHostCeleb(domainId, userType === roles.CELEBRITY ? event.celebrityUrl : event.hostUrl, userType) :
      await createTokenFan(domainId, event.fanUrl);
  }
  return null;
};

export {
  getEvents,
  create,
  update,
  deleteEvent,
  getEvent,
  deleteEventsByAdminId,
  getEventByKey,
  getEventsByDomainId,
  changeStatus,
  createTokenProducer,
  createTokenFan,
  createTokenHostCeleb,
  getEventBySessionId,
  buildEventKey,
  getMostRecentEvent,
  createTokenByUserType,
  getEventsByAdmin
};
