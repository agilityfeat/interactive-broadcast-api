import express from 'express';
import validate from 'express-validation';

const router = express.Router(); // eslint-disable-line new-cap
const Domain = require('../services/domain');
const getAPIResponse = require('../helpers/APIResponse');
const { validateApiKey, checkAdmin } = require('../middleware/validation');
const paramValidation = require('../../config/param-validation');

const getDomains = getAPIResponse(() => Domain.getDomains(), { skipNotFoundValidation: true });
const getDomainById = getAPIResponse(req => Domain.getDomain(req.params.id));
const createDomain = getAPIResponse(req => Domain.createDomain(req.body));
const updateDomain = getAPIResponse(req => Domain.updateDomain(req.params.id, req.body));
const deleteDomain = getAPIResponse(req => Domain.deleteDomain(req.params.id));

router.get('/', checkAdmin, getDomains);
router.get('/:id', checkAdmin, getDomainById);
router.post('/', checkAdmin, validate(paramValidation.createDomain), validateApiKey, createDomain);
router.patch('/:id', checkAdmin, validate(paramValidation.updateDomain), validateApiKey, updateDomain);
router.delete('/:id', checkAdmin, deleteDomain);

export default router;
