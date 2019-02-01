import express from 'express';
import validate from 'express-validation';

const router = express.Router(); // eslint-disable-line new-cap
const File = require('../services/file');
const getAPIResponse = require('../helpers/APIResponse');
const { checkAdmin, checkFan } = require('../middleware/validation');
const paramValidation = require('../../config/param-validation');

const getFiles = getAPIResponse(req => File.getFiles(req.params.domainId), { skipNotFoundValidation: true });
const getFilesByUser = getAPIResponse(req => File.getFilesByUser(req.params.domainId, req.params.userId));
const createFile = getAPIResponse(req => File.create(req.body));
const deleteFile = getAPIResponse(req => File.deleteFile(req.params.domainId, req.params.id));

router.post('/', validate(paramValidation.sharedFile), createFile);
router.get('/:domainId', checkAdmin, getFiles);
router.get('/:domainId/:userId', checkFan, getFilesByUser);
router.delete('/:domainId/:id', checkFan, deleteFile);

export default router;
