const admin = require('firebase-admin');

const
domainProps = [
  'id',
  'httpSupport',
  'hls',
  'audioOnlyEnabled',
  'embedEnabled',
  'registrationEnabled',
  'fileSharingEnabled',
  'screenSharingEnabled',
  'siteColor',
  'siteLogo',
  'siteFavicon',
  'domain',
  'otApiKey',
  'otSecret',
  'createdAt',
  'updatedAt'
];

const adminProps = [
  'id',
  'domainId',
  'displayName',
  'superAdmin',
  'email',
  'createdAt',
  'updatedAt'
];

const viewerProps = [
  'id',
  'domainId',
  'displayName',
  'email',
  'createdAt',
  'updatedAt'
];

const viewerAuthProps = [
  'id',
  'domainId',
  'displayName',
  'email',
  'createdAt',
  'updatedAt',
  'password'
];

const userProps = [
  'displayName',
  'email',
  'password'
];

const eventProps = [
  'id',
  'name',
  'domainId',
  'startImage',
  'endImage',
  'fanUrl',
  'celebrityUrl',
  'hostUrl',
  'archiveEvent',
  'status',
  'dateTimeStart',
  'dateTimeEnd',
  'sessionId',
  'stageSessionId',
  'archiveUrl',
  'archiveId',
  'redirectUrl',
  'uncomposed',
  'showStartedAt',
  'showEndedAt',
  'adminId',
  'rtmpUrl',
  'createdAt',
  'updatedAt',
  'producerHost'
];

const eventPublicProps = [
  'id',
  'adminId',
  'name',
  'startImage',
  'endImage',
  'fanUrl',
  'celebrityUrl',
  'hostUrl',
  'status',
  'dateTimeStart',
  'dateTimeEnd'
];

const TS = admin.database.ServerValue.TIMESTAMP;
const timestampCreate = { createdAt: TS, updatedAt: TS };
const timestampUpdate = { updatedAt: TS };

const eventStatuses = {
  NOT_STARTED: 'notStarted',
  PRESHOW: 'preshow',
  LIVE: 'live',
  CLOSED: 'closed'
};

module.exports = {
  adminProps,
  domainProps,
  userProps,
  viewerProps,
  viewerAuthProps,
  eventProps,
  eventPublicProps,
  timestampCreate,
  timestampUpdate,
  eventStatuses,
  TS
};
