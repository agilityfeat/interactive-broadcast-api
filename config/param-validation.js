import Joi from 'joi';
import R from 'ramda';

const { eventStatuses } = require('../server/services/dbProperties');

const jwtAdmin = {
  body: {
    idToken: Joi.string().required()
  }
};

const jwtFan = {
  body: {
    domainId: Joi.string().required(),
    email: Joi.string(),
    password: Joi.string(),
    fanUrl: Joi.string(),
  }
};

const jwtHost = {
  body: {
    hostUrl: Joi.string(),
    domainId: Joi.string().required(),
  }
};

const jwtCelebrity = {
  body: {
    celebrityUrl: Joi.string(),
    domainId: Joi.string().required(),
  }
};

const createAdmin = {
  body: {
    displayName: Joi.string().required(),
    otApiKey: Joi.string().allow(''),
    otSecret: Joi.string().allow(''),
    superAdmin: Joi.boolean(),
    email: Joi.string().email().required(),
    password: Joi.string().regex(/[a-zA-Z0-9]{6,30}/)
      .required()
      .options({ language: { string: { regex: { base: 'must be a string with at least 6 characters.' } } } })
      .label('Password'),
  },
};

const createDomain = {
  body: {
    domain: Joi.string().required(),
    hls: Joi.boolean(),
    httpSupport: Joi.boolean(),
    embedEnabled: Joi.boolean(),
    registrationEnabled: Joi.boolean(),
    fileSharingEnabled: Joi.boolean(),
    siteColor: Joi.string().required(),
  }
};

const updateDomain = {
  body: R.omit(['domain'], createDomain.body)
};

const updateAdmin = {
  body: R.omit(['password'], createAdmin.body)
};

const event = {
  body: {
    name: Joi.string().required(),
    startImage: Joi.object({
      id: Joi.string(),
      url: Joi.string(),
    }),
    endImage: Joi.object({
      id: Joi.string(),
      url: Joi.string(),
    }),
    fanUrl: Joi.string().required(),
    celebrityUrl: Joi.string().required(),
    hostUrl: Joi.string().required(),
    archiveEvent: Joi.boolean().required(),
    redirectUrl: Joi.string(),
    uncomposed: Joi.boolean().required(),
    adminId: Joi.string(),
    domainId: Joi.string(),
    status: Joi.string().valid(R.values(eventStatuses)),
  },
};

const sharedFile = {
  body: {
    id: Joi.string().required(),
    name: Joi.string().required(),
    url: Joi.string().required(),
    type: Joi.string().required(),
    userId: Joi.string().allow(null),
    domainId: Joi.string().required(),
    fromId: Joi.string().allow(null)
  }
};

const eventStatus = {
  body: {
    status: Joi.string().valid(R.values(eventStatuses)).required(),
  },
};

const createTokenFan = {
  body: {
    domainId: Joi.string().required(),
    fanUrl: Joi.string().required(),
  },
};

const createTokenHost = {
  body: {
    domainId: Joi.string().required(),
    hostUrl: Joi.string().required(),
  },
};

const createTokenCelebrity = {
  body: {
    domainId: Joi.string().required(),
    celebrityUrl: Joi.string().required(),
  },
};

const createViewer = {
  body: {
    domainId: Joi.string().required(),
    displayName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().regex(/[a-zA-Z0-9]{6,30}/)
      .required()
      .options({ language: { string: { regex: { base: 'must be a string with at least 6 characters.' } } } })
      .label('Password'),
  },
};

const resetPassword = {
  body: {
    token: Joi.string().required(),
    password: Joi.string().required()
  }
};

const sendResetPassword = {
  body: {
    domainId: Joi.string().required(),
    email: Joi.string().required()
  }
};

export {
  jwtAdmin,
  createAdmin,
  updateAdmin,
  event,
  sharedFile,
  eventStatus,
  createTokenFan,
  createTokenHost,
  createTokenCelebrity,
  createViewer,
  createDomain,
  updateDomain,
  sendResetPassword,
  resetPassword,
  jwtFan,
  jwtHost,
  jwtCelebrity
};
